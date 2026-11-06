// ==UserScript==
// @name         MTG Collection Checker
// @namespace    https://github.com/
// @version      0.3.2
// @description  MTG collection, shopping list and reference checker.
// @author       Djinn
// @match        *://*/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @run-at       document-idle
// ==/UserScript==

(function () {

    'use strict';

    const LISTS_KEY = 'mtgcc_lists_v2';
    const FILTER_KEY = 'mtgcc_scry_filter_v1';

    // ============================================================
    // Storage
    // ============================================================

    function getLists() {

        const lists =
            GM_getValue(
                LISTS_KEY,
                {}
            );

        let changed = false;

        for (const name of Object.keys(lists)) {

            if (!lists[name].type) {

                lists[name].type =
                    inferListType(name);

                changed = true;
            }
        }

        if (changed) {
            GM_setValue(
                LISTS_KEY,
                lists
            );
        }

        return lists;
    }

    function saveLists(lists) {

        GM_setValue(
            LISTS_KEY,
            lists
        );
    }

    function getFilterSettings() {

        return GM_getValue(
            FILTER_KEY,
            {
                shopping: false,
                reference: false
            }
        );
    }

    function saveFilterSettings(settings) {

        GM_setValue(
            FILTER_KEY,
            settings
        );
    }

    function inferListType(name) {

        const n =
            String(name)
                .toLowerCase();

        if (
            n.includes('collection') ||
            n.includes('binder') ||
            n.includes('owned') ||
            n.includes('my cards')
        ) {

            return 'collection';
        }

        if (
            n.includes('shopping') ||
            n.includes('want') ||
            n.includes('buy') ||
            n.includes('missing') ||
            n.includes('wishlist')
        ) {

            return 'shopping';
        }

        return 'reference';
    }

    // ============================================================
    // Utilities
    // ============================================================

    function normalizeName(name) {

        if (!name) {
            return '';
        }

        return String(name)
            .replace(/\u00a0/g, ' ')
            .replace(/[“”]/g, '"')
            .replace(/[‘’]/g, "'")
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();
    }

    function createText(
        tag,
        text,
        className
    ) {

        const el =
            document.createElement(tag);

        el.textContent =
            text;

        if (className) {
            el.className =
                className;
        }

        return el;
    }

    // ============================================================
    // CSS
    // ============================================================

    GM_addStyle(`

        /* ======================================================
           Selection popup
           ====================================================== */

        #mtgcc-selection-popup {

            position: fixed !important;

            z-index: 2147483647 !important;

            background: #18181b !important;
            color: #f4f4f5 !important;

            border: 1px solid #52525b !important;

            border-radius: 7px !important;

            padding: 4px 5px !important;

            box-shadow:
                0 4px 16px rgba(0,0,0,.35) !important;

            font-family:
                -apple-system,
                BlinkMacSystemFont,
                "Segoe UI",
                sans-serif !important;

            font-size: 11px !important;

            line-height: 1.2 !important;

            white-space: nowrap !important;
        }

        .mtgcc-popup-header {

            padding:
                3px 5px 4px 5px !important;

            margin-bottom: 2px !important;

            border-bottom:
                1px solid #3f3f46 !important;

            color: #a1a1aa !important;

            font-size: 10px !important;

            max-width: 250px !important;

            overflow: hidden !important;

            text-overflow: ellipsis !important;
        }

        .mtgcc-popup-row {

            display: flex !important;

            align-items: center !important;

            gap: 10px !important;

            padding: 3px 5px !important;

            border-radius: 4px !important;
        }

        .mtgcc-popup-name {

            color: #d4d4d8 !important;

            max-width: 180px !important;

            overflow: hidden !important;

            text-overflow: ellipsis !important;
        }

        .mtgcc-popup-value {

            margin-left: auto !important;

            font-weight: 700 !important;
        }

        .mtgcc-popup-owned {
            color: #4ade80 !important;
        }

        .mtgcc-popup-shopping {
            color: #facc15 !important;
        }

        .mtgcc-popup-reference {
            color: #60a5fa !important;
        }

        .mtgcc-popup-absent {
            color: #71717a !important;
        }


        /* ======================================================
           Inline badges
           ====================================================== */

        .mtgcc-card-badge {

            display: inline-block !important;

            margin-left: 5px !important;

            padding:
                0 3px !important;

            border-radius: 3px !important;

            font-family:
                -apple-system,
                BlinkMacSystemFont,
                "Segoe UI",
                sans-serif !important;

            font-size: 10px !important;

            font-weight: 700 !important;

            line-height: 1.35 !important;

            vertical-align: middle !important;

            cursor: help !important;

            user-select: none !important;

            text-decoration: none !important;

            white-space: nowrap !important;
        }

        .mtgcc-badge-owned {

            color: #4ade80 !important;

            background:
                rgba(34,197,94,.12) !important;

            border:
                1px solid rgba(74,222,128,.35) !important;
        }

        .mtgcc-badge-shopping {

            color: #facc15 !important;

            background:
                rgba(234,179,8,.12) !important;

            border:
                1px solid rgba(250,204,21,.35) !important;
        }

        .mtgcc-badge-reference {

            color: #60a5fa !important;

            background:
                rgba(59,130,246,.12) !important;

            border:
                1px solid rgba(96,165,250,.35) !important;
        }


        /* ======================================================
           Hover tooltip
           ====================================================== */

        #mtgcc-hover-tooltip {

            position: fixed !important;

            z-index: 2147483647 !important;

            background: #18181b !important;

            color: #f4f4f5 !important;

            border:
                1px solid #52525b !important;

            border-radius: 8px !important;

            padding: 5px !important;

            min-width: 170px !important;

            max-width: 280px !important;

            box-shadow:
                0 6px 22px rgba(0,0,0,.4) !important;

            font-family:
                -apple-system,
                BlinkMacSystemFont,
                "Segoe UI",
                sans-serif !important;

            font-size: 11px !important;

            pointer-events: none !important;
        }

        .mtgcc-tooltip-title {

            padding:
                3px 5px 5px 5px !important;

            border-bottom:
                1px solid #3f3f46 !important;

            font-size: 12px !important;

            font-weight: 700 !important;

            max-width: 260px !important;

            overflow: hidden !important;

            text-overflow: ellipsis !important;
        }

        .mtgcc-tooltip-section {

            margin-top: 5px !important;

            padding:
                2px 5px !important;

            color: #a1a1aa !important;

            font-size: 9px !important;

            text-transform: uppercase !important;

            letter-spacing: .04em !important;
        }

        .mtgcc-tooltip-row {

            display: flex !important;

            align-items: center !important;

            justify-content: space-between !important;

            gap: 12px !important;

            padding:
                3px 5px !important;

            border-radius: 4px !important;
        }

        .mtgcc-tooltip-list {

            overflow: hidden !important;

            text-overflow: ellipsis !important;

            white-space: nowrap !important;
        }

        .mtgcc-tooltip-number {

            font-weight: 700 !important;

            flex-shrink: 0 !important;
        }


        /* ======================================================
           Scry filter bar
           ====================================================== */

        #mtgcc-scry-filter {

            position: fixed !important;

            top: 5px !important;

            right: 250px !important;

            z-index: 2147483645 !important;

            display: flex !important;

            align-items: center !important;

            gap: 6px !important;

            padding: 5px 7px !important;

            background:
                rgba(24,24,27,.94) !important;

            border:
                1px solid #52525b !important;

            border-radius: 7px !important;

            box-shadow:
                0 4px 14px rgba(0,0,0,.3) !important;

            font-family:
                -apple-system,
                BlinkMacSystemFont,
                "Segoe UI",
                sans-serif !important;

            font-size: 11px !important;

            color: #d4d4d8 !important;

            user-select: none !important;
        }

        .mtgcc-filter-label {

            display: flex !important;

            align-items: center !important;

            gap: 3px !important;

            cursor: pointer !important;

            white-space: nowrap !important;

            padding:
                2px 3px !important;

            border-radius: 4px !important;
        }

        .mtgcc-filter-label:hover {

            background:
                rgba(255,255,255,.08) !important;
        }

        .mtgcc-filter-checkbox {

            margin: 0 !important;

            width: 12px !important;

            height: 12px !important;

            cursor: pointer !important;

            accent-color: #71717a !important;
        }

        .mtgcc-filter-shopping {

            color: #facc15 !important;
        }

        .mtgcc-filter-reference {

            color: #60a5fa !important;
        }

        #mtgcc-filter-count {

            color: #71717a !important;

            font-size: 10px !important;

            margin-left: 2px !important;

            padding-left: 5px !important;

            border-left:
                1px solid #3f3f46 !important;

            white-space: nowrap !important;
        }


        /* ======================================================
           Management dialog
           ====================================================== */

        #mtgcc-overlay {

            position: fixed !important;

            inset: 0 !important;

            z-index: 2147483646 !important;

            background:
                rgba(0,0,0,.65) !important;

            display: flex !important;

            align-items: center !important;

            justify-content: center !important;

            font-family:
                -apple-system,
                BlinkMacSystemFont,
                "Segoe UI",
                sans-serif !important;
        }

        #mtgcc-dialog {

            width: 560px !important;

            max-width:
                calc(100vw - 40px) !important;

            max-height: 80vh !important;

            overflow: auto !important;

            background: #18181b !important;

            color: #f4f4f5 !important;

            border:
                1px solid #3f3f46 !important;

            border-radius: 14px !important;

            padding: 20px !important;

            box-shadow:
                0 20px 60px rgba(0,0,0,.5) !important;
        }

        .mtgcc-dialog-title {

            margin:
                0 0 8px 0 !important;

            font-size: 20px !important;
        }

        .mtgcc-dialog-text {

            color: #a1a1aa !important;

            line-height: 1.5 !important;
        }

        .mtgcc-managed-list {

            display: flex !important;

            justify-content:
                space-between !important;

            align-items: center !important;

            gap: 10px !important;

            background: #27272a !important;

            border-radius: 8px !important;

            padding: 10px !important;

            margin: 7px 0 !important;
        }

        .mtgcc-managed-info {

            min-width: 0 !important;

            flex: 1 !important;
        }

        .mtgcc-managed-name {

            font-weight: 700 !important;
        }

        .mtgcc-managed-meta {

            color: #a1a1aa !important;

            font-size: 11px !important;

            margin-top: 3px !important;
        }

        .mtgcc-type-select {

            background: #18181b !important;

            color: white !important;

            border:
                1px solid #52525b !important;

            border-radius: 6px !important;

            padding:
                5px 7px !important;
        }

        .mtgcc-button {

            background: #3f3f46 !important;

            border:
                1px solid #52525b !important;

            color: white !important;

            border-radius: 7px !important;

            padding:
                8px 12px !important;

            cursor: pointer !important;

            margin-right: 6px !important;
        }

        .mtgcc-button:hover {

            background: #52525b !important;
        }

        .mtgcc-primary {

            background: #166534 !important;

            border-color: #15803d !important;
        }

        .mtgcc-danger {

            background: #7f1d1d !important;

            border-color: #991b1b !important;
        }

        .mtgcc-type-label {

            color: #a1a1aa !important;

            font-size: 10px !important;

            margin-right: 4px !important;
        }

        #mtgcc-toast {

            position: fixed !important;

            right: 20px !important;

            bottom: 20px !important;

            z-index: 2147483647 !important;

            background: #18181b !important;

            color: white !important;

            border:
                1px solid #3f3f46 !important;

            padding:
                12px 16px !important;

            border-radius: 8px !important;

            box-shadow:
                0 8px 25px rgba(0,0,0,.4) !important;
        }

    `);

    // ============================================================
    // CSV parser
    // ============================================================

    function parseCSV(text) {

        const rows = [];

        let row = [];

        let field = '';

        let insideQuotes = false;

        for (
            let i = 0;
            i < text.length;
            i++
        ) {

            const char =
                text[i];

            if (insideQuotes) {

                if (char === '"') {

                    if (
                        text[i + 1] === '"'
                    ) {

                        field += '"';

                        i++;

                    } else {

                        insideQuotes = false;
                    }

                } else {

                    field += char;
                }

            } else {

                if (char === '"') {

                    insideQuotes = true;

                } else if (
                    char === ','
                ) {

                    row.push(field);

                    field = '';

                } else if (
                    char === '\n'
                ) {

                    row.push(field);

                    rows.push(row);

                    row = [];

                    field = '';

                } else if (
                    char === '\r'
                ) {

                    // Ignore.

                } else {

                    field += char;
                }
            }
        }

        if (
            field.length ||
            row.length
        ) {

            row.push(field);

            rows.push(row);
        }

        return rows;
    }

    function buildListFromCSV(
        text,
        listName,
        sourceName,
        type
    ) {

        const rows =
            parseCSV(text);

        if (!rows.length) {

            throw new Error(
                'CSV is empty.'
            );
        }

        const headers =
            rows[0].map(
                h => h.trim()
            );

        function findColumn(...names) {

            for (const name of names) {

                const index =
                    headers.findIndex(
                        h =>
                            h.toLowerCase() ===
                            name.toLowerCase()
                    );

                if (index !== -1) {
                    return index;
                }
            }

            return -1;
        }

        const nameIndex =
            findColumn(
                'Name',
                'Card Name',
                'CardName'
            );

        if (nameIndex === -1) {

            throw new Error(
                'Could not find a "Name" column.'
            );
        }

        const quantityIndex =
            findColumn(
                'Quantity',
                'Qty',
                'Count'
            );

        const cards = {};

        let totalQuantity = 0;

        let rowCount = 0;

        for (
            let i = 1;
            i < rows.length;
            i++
        ) {

            const row =
                rows[i];

            if (!row.length) {
                continue;
            }

            const name =
                (
                    row[nameIndex] ||
                    ''
                ).trim();

            if (!name) {
                continue;
            }

            let quantity = 1;

            if (
                quantityIndex !== -1
            ) {

                const parsed =
                    parseInt(
                        (
                            row[
                                quantityIndex
                            ] || ''
                        ).trim(),
                        10
                    );

                if (
                    Number.isFinite(parsed)
                ) {

                    quantity = parsed;
                }
            }

            const key =
                normalizeName(name);

            if (!cards[key]) {

                cards[key] = {

                    name,

                    quantity: 0

                };
            }

            cards[key].quantity +=
                quantity;

            totalQuantity +=
                quantity;

            rowCount++;
        }

        return {

            name: listName,

            type:
                type ||
                inferListType(listName),

            source:
                sourceName,

            importedAt:
                new Date().toISOString(),

            cards,

            rows:
                rowCount,

            uniqueCards:
                Object.keys(cards).length,

            totalQuantity

        };
    }

    // ============================================================
    // Import
    // ============================================================

    function importList() {

        const input =
            document.createElement(
                'input'
            );

        input.type = 'file';

        input.accept =
            '.csv,text/csv';

        input.style.position =
            'fixed';

        input.style.left =
            '-9999px';

        input.style.top =
            '-9999px';

        input.style.width =
            '1px';

        input.style.height =
            '1px';

        input.style.opacity =
            '0';

        document.body.appendChild(
            input
        );

        input.addEventListener(
            'change',
            async function () {

                try {

                    if (
                        !input.files ||
                        !input.files.length
                    ) {

                        return;
                    }

                    const file =
                        input.files[0];

                    const text =
                        await file.text();

                    if (!text.trim()) {

                        alert(
                            'The selected CSV is empty.'
                        );

                        return;
                    }

                    const defaultName =
                        file.name.replace(
                            /\.csv$/i,
                            ''
                        );

                    const listName =
                        prompt(
                            'Enter a name for this list:',
                            defaultName
                        );

                    if (
                        !listName ||
                        !listName.trim()
                    ) {

                        return;
                    }

                    const inferred =
                        inferListType(
                            listName
                        );

                    const type =
                        prompt(
                            'List type:\n\n' +
                            'collection = cards you own\n' +
                            'shopping = cards you want\n' +
                            'reference = reference/staples/meta\n\n' +
                            `Default: ${inferred}`,
                            inferred
                        );

                    let finalType =
                        String(type || inferred)
                            .trim()
                            .toLowerCase();

                    if (
                        ![
                            'collection',
                            'shopping',
                            'reference'
                        ].includes(finalType)
                    ) {

                        finalType =
                            inferred;
                    }

                    const list =
                        buildListFromCSV(
                            text,
                            listName.trim(),
                            file.name,
                            finalType
                        );

                    const lists =
                        getLists();

                    if (
                        lists[list.name]
                    ) {

                        const replace =
                            confirm(
                                `"${list.name}" already exists.\n\n` +
                                'Replace it?'
                            );

                        if (!replace) {
                            return;
                        }
                    }

                    lists[list.name] =
                        list;

                    saveLists(lists);

                    showToast(
                        `✓ Imported "${list.name}" · ` +
                        `${list.uniqueCards} cards`,
                        4000
                    );

                    /*
                     * Refresh current Scry page immediately.
                     */

                    if (isSupportedShop()) { rescanAll(); }

                } catch (error) {

                    console.error(
                        '[MTGCC] Import failed:',
                        error
                    );

                    alert(
                        'Import failed:\n\n' +
                        error.message
                    );

                } finally {

                    input.remove();
                }
            },
            {
                once: true
            }
        );

        input.click();
    }

    // ============================================================
    // Lookup
    // ============================================================

    function lookupInList(
        list,
        cardName
    ) {

        const key =
            normalizeName(cardName);

        if (
            list.cards &&
            list.cards[key]
        ) {

            return list.cards[key];
        }

        /*
         * Variant suffixes such as "(Showcase)", "(Extended Art)",
         * "(Borderless)": retry without the trailing parenthetical.
         * Exact match above runs first, so cards whose real name
         * contains parentheses still work.
         */
        const stripped =
            String(cardName)
                .replace(/\s*[\(\[][^\)\]]*[\)\]]\s*$/, '')
                .trim();

        if (
            stripped &&
            stripped !== cardName
        ) {

            const result =
                lookupInList(
                    list,
                    stripped
                );

            if (result) {
                return result;
            }
        }

        if (
            cardName.includes('/')
        ) {

            const parts =
                cardName
                    .split(/\s*\/{1,2}\s*/)
                    .map(
                        x => x.trim()
                    );

            for (
                const part of parts
            ) {

                const result =
                    lookupInList(
                        list,
                        part
                    );

                if (result) {
                    return result;
                }
            }
        }

        return null;
    }

    // ============================================================
    // Card status
    // ============================================================

    function getCardStatus(
        cardName
    ) {

        const lists =
            getLists();

        const collection = [];

        const shopping = [];

        const reference = [];

        for (
            const name of Object.keys(lists)
        ) {

            const list =
                lists[name];

            const result =
                lookupInList(
                    list,
                    cardName
                );

            if (
                list.type ===
                'collection'
            ) {

                collection.push({

                    name,

                    result

                });

            } else if (
                list.type ===
                'shopping'
            ) {

                shopping.push({

                    name,

                    result

                });

            } else {

                reference.push({

                    name,

                    result

                });
            }
        }

        const owned =
            collection.some(
                x => !!x.result
            );

        const wanted =
            shopping.some(
                x => !!x.result
            );

        const referenced =
            !wanted &&
            reference.some(
                x => !!x.result
            );


        return {

            collection,

            shopping,

            reference,

            owned,

            wanted,

            referenced

        };
    }

    // ============================================================
    // Tooltip
    // ============================================================

    let tooltipTimer = null;

    function removeTooltip() {

        if (tooltipTimer) {

            clearTimeout(
                tooltipTimer
            );

            tooltipTimer = null;
        }

        const tooltip =
            document.getElementById(
                'mtgcc-hover-tooltip'
            );

        if (tooltip) {
            tooltip.remove();
        }
    }

    function createTooltip(
        cardName,
        badge
    ) {

        removeTooltip();

        const status =
            getCardStatus(
                cardName
            );

        const tooltip =
            document.createElement(
                'div'
            );

        tooltip.id =
            'mtgcc-hover-tooltip';

        tooltip.appendChild(
            createText(
                'div',
                cardName,
                'mtgcc-tooltip-title'
            )
        );

        function addSection(
            title
        ) {

            tooltip.appendChild(
                createText(
                    'div',
                    title,
                    'mtgcc-tooltip-section'
                )
            );
        }

        function addRows(
            items,
            type
        ) {

            for (
                const item of items
            ) {

                const row =
                    document.createElement(
                        'div'
                    );

                row.className =
                    'mtgcc-tooltip-row';

                row.appendChild(
                    createText(
                        'span',
                        item.name,
                        'mtgcc-tooltip-list'
                    )
                );

                const value =
                    document.createElement(
                        'span'
                    );

                value.className =
                    'mtgcc-tooltip-number';

                if (item.result) {

                    if (
                        type ===
                        'collection'
                    ) {

                        value.textContent =
                            String(
                                item.result.quantity
                            );

                        value.classList.add(
                            'mtgcc-popup-owned'
                        );

                    } else if (
                        type ===
                        'shopping'
                    ) {

                        value.textContent =
                            String(
                                item.result.quantity
                            );

                        value.classList.add(
                            'mtgcc-popup-shopping'
                        );

                    } else {

                        value.textContent =
                            '✓';

                        value.classList.add(
                            'mtgcc-popup-reference'
                        );
                    }

                } else {

                    value.textContent =
                        '—';

                    value.classList.add(
                        'mtgcc-popup-absent'
                    );
                }

                row.appendChild(
                    value
                );

                tooltip.appendChild(
                    row
                );
            }
        }

        if (
            status.collection.length
        ) {

            addSection(
                'COLLECTION'
            );

            addRows(
                status.collection,
                'collection'
            );
        }

        if (
            status.shopping.length
        ) {

            addSection(
                'SHOPPING'
            );

            addRows(
                status.shopping,
                'shopping'
            );
        }

        if (
            status.reference.length
        ) {

            addSection(
                'REFERENCE'
            );

            addRows(
                status.reference,
                'reference'
            );
        }

        document.body.appendChild(
            tooltip
        );

        const badgeRect =
            badge.getBoundingClientRect();

        const tooltipRect =
            tooltip.getBoundingClientRect();

        const margin = 6;

        let left =
            badgeRect.left;

        let top =
            badgeRect.bottom +
            margin;

        if (
            left +
            tooltipRect.width >
            window.innerWidth -
            margin
        ) {

            left =
                window.innerWidth -
                tooltipRect.width -
                margin;
        }

        if (
            left < margin
        ) {

            left = margin;
        }

        if (
            top +
            tooltipRect.height >
            window.innerHeight -
            margin
        ) {

            top =
                badgeRect.top -
                tooltipRect.height -
                margin;
        }

        if (
            top < margin
        ) {

            top = margin;
        }

        tooltip.style.left =
            `${Math.round(left)}px`;

        tooltip.style.top =
            `${Math.round(top)}px`;
    }

    // ============================================================
    // Badge
    // ============================================================

    function addBadge(
        cardElement,
        cardName
    ) {

        if (
            cardElement.querySelector(
                '.mtgcc-card-badge'
            )
        ) {

            return;
        }

        const status =
            getCardStatus(
                cardName
            );

        let badgeText = '';

        let badgeClass = '';

            if (status.wanted) {

                badgeText = '[✓]';

                badgeClass =
                    'mtgcc-card-badge ' +
                    'mtgcc-badge-shopping';

            } else if (status.referenced) {

                badgeText = '[△]';

                badgeClass =
                    'mtgcc-card-badge ' +
                    'mtgcc-badge-reference';

            } else if (status.owned) {

                badgeText = '[O]';

                badgeClass =
                    'mtgcc-card-badge ' +
                    'mtgcc-badge-owned';

            } else {

                return;
            }

        const badge =
            createText(
                'span',
                badgeText,
                badgeClass
            );

        badge.dataset.mtgccCard =
            cardName;

        badge.addEventListener(
            'mouseenter',
            () => {

                tooltipTimer =
                    setTimeout(
                        () => {

                            createTooltip(
                                cardName,
                                badge
                            );

                        },
                        100
                    );
            }
        );

        badge.addEventListener(
            'mouseleave',
            () => {

                if (tooltipTimer) {

                    clearTimeout(
                        tooltipTimer
                    );

                    tooltipTimer = null;
                }

                removeTooltip();
            }
        );

        badge.addEventListener('click', e => {
            e.stopPropagation();
        });

        cardElement.appendChild(badge);
    }

    // ============================================================
    // Selection popup
    // ============================================================

    function removeSelectionPopup() {

        const popup =
            document.getElementById(
                'mtgcc-selection-popup'
            );

        if (popup) {
            popup.remove();
        }
    }

    function getSelectionText() {

        const selection =
            window.getSelection();

        if (!selection) {
            return '';
        }

        return selection
            .toString()
            .replace(/\s+/g, ' ')
            .trim();
    }

    function isPotentialCardName(text) {

        if (!text) {
            return false;
        }

        if (
            text.length < 2 ||
            text.length > 100
        ) {

            return false;
        }

        if (
            text.split(/\s+/).length > 12
        ) {

            return false;
        }

        return true;
    }

    function showSelectionPopup(
        cardName,
        rect
    ) {

        removeSelectionPopup();

        const lists =
            getLists();

        const names =
            Object.keys(lists);

        if (!names.length) {
            return;
        }

        const popup =
            document.createElement(
                'div'
            );

        popup.id =
            'mtgcc-selection-popup';

        popup.appendChild(
            createText(
                'div',
                cardName,
                'mtgcc-popup-header'
            )
        );

        const status =
            getCardStatus(
                cardName
            );

        function addRows(
            items,
            type
        ) {

            for (
                const item of items
            ) {

                const row =
                    document.createElement(
                        'div'
                    );

                row.className =
                    'mtgcc-popup-row';

                row.appendChild(
                    createText(
                        'span',
                        item.name,
                        'mtgcc-popup-name'
                    )
                );

                const value =
                    document.createElement(
                        'span'
                    );

                value.className =
                    'mtgcc-popup-value';

                if (item.result) {

                    if (
                        type ===
                        'collection'
                    ) {

                        value.textContent =
                            String(
                                item.result.quantity
                            );

                        value.classList.add(
                            'mtgcc-popup-owned'
                        );

                    } else if (
                        type ===
                        'shopping'
                    ) {

                        value.textContent =
                            String(
                                item.result.quantity
                            );

                        value.classList.add(
                            'mtgcc-popup-shopping'
                        );

                    } else {

                        value.textContent =
                            '✓';

                        value.classList.add(
                            'mtgcc-popup-reference'
                        );
                    }

                } else {

                    value.textContent =
                        '—';

                    value.classList.add(
                        'mtgcc-popup-absent'
                    );
                }

                row.appendChild(
                    value
                );

                popup.appendChild(
                    row
                );
            }
        }

        addRows(
            status.collection,
            'collection'
        );

        addRows(
            status.shopping,
            'shopping'
        );

        addRows(
            status.reference,
            'reference'
        );

        document.body.appendChild(
            popup
        );

        const popupRect =
            popup.getBoundingClientRect();

        const margin = 6;

        let left =
            rect.left;

        let top =
            rect.bottom +
            margin;

        if (
            left +
            popupRect.width >
            window.innerWidth -
            margin
        ) {

            left =
                window.innerWidth -
                popupRect.width -
                margin;
        }

        if (left < margin) {
            left = margin;
        }

        if (
            top +
            popupRect.height >
            window.innerHeight -
            margin
        ) {

            top =
                rect.top -
                popupRect.height -
                margin;
        }

        if (top < margin) {
            top = margin;
        }

        popup.style.left =
            `${Math.round(left)}px`;

        popup.style.top =
            `${Math.round(top)}px`;
    }

    let selectionTimer = null;

    let lastSelection = '';

    document.addEventListener(
        'mouseup',
        () => {

            clearTimeout(
                selectionTimer
            );

            selectionTimer =
                setTimeout(
                    () => {

                        const text =
                            getSelectionText();

                        if (
                            !isPotentialCardName(
                                text
                            )
                        ) {

                            removeSelectionPopup();

                            return;
                        }

                        if (
                            text ===
                            lastSelection
                        ) {

                            return;
                        }

                        lastSelection =
                            text;

                        const selection =
                            window.getSelection();

                        if (
                            !selection ||
                            !selection.rangeCount
                        ) {

                            return;
                        }

                        const rect =
                            selection
                                .getRangeAt(0)
                                .getBoundingClientRect();

                        if (
                            rect.width === 0 &&
                            rect.height === 0
                        ) {

                            return;
                        }

                        showSelectionPopup(
                            text,
                            rect
                        );

                    },
                    120
                );
        }
    );

    document.addEventListener(
        'mousedown',
        event => {

            const popup =
                document.getElementById(
                    'mtgcc-selection-popup'
                );

            if (
                popup &&
                popup.contains(
                    event.target
                )
            ) {

                return;
            }

            setTimeout(
                () => {

                    if (
                        !getSelectionText()
                    ) {

                        removeSelectionPopup();

                        lastSelection =
                            '';
                    }

                },
                50
            );
        },
        true
    );

    document.addEventListener(
        'selectionchange',
        () => {

            clearTimeout(
                selectionTimer
            );

            selectionTimer =
                setTimeout(
                    () => {

                        if (
                            !getSelectionText()
                        ) {

                            removeSelectionPopup();

                            lastSelection =
                                '';
                        }

                    },
                    100
                );
        }
    );

    window.addEventListener(
        'scroll',
        () => {

            removeSelectionPopup();

            removeTooltip();

        },
        {
            passive: true
        }
    );

    // ============================================================
    // Scry.cl
    // ============================================================

        function looksLikeProductCardLink(
        anchor
    ) {

        if (!anchor) {
            return false;
        }

        if (
            anchor.dataset.mtgccScanned ===
            '1'
        ) {

            return false;
        }

        const text =
            anchor.textContent
                .replace(/\s+/g, ' ')
                .trim();

        if (
            !isPotentialCardName(text)
        ) {

            return false;
        }

        const ignored = new Set([
            'home',
            'cartas',
            'mazos',
            'carpetas',
            'tiendas',
            'accesorios',
            'sellados',
            'deck builder',
            'wishlist',
            'iniciar sesión',
            'crear cuenta',
            'filtrar',
            'limpiar',
            'siguiente',
            'última',
            'último'
        ]);

        if (
            ignored.has(
                normalizeName(text)
            )
        ) {

            return false;
        }

        let node =
            anchor;

        for (
            let depth = 0;
            depth < 5 && node;
            depth++
        ) {

            const surrounding =
                node.textContent
                    .replace(/\s+/g, ' ')
                    .trim();

            const hasPrice =
                /\$\s*[\d.,]+/.test(
                    surrounding
                );

            const hasStock =
                /\(\s*\d+\s*\)/.test(
                    surrounding
                );

            if (
                hasPrice &&
                hasStock
            ) {

                return true;
            }

            node =
                node.parentElement;
        }

        return false;
    }

    // ============================================================
    // Scry filtering
    // ============================================================
    function findScryProductContainer(anchor) {

        if (!anchor) {
            return null;
        }

        /*
     * Scry.cl structure:
     *
     * .col-xl-2.col-lg-2.col-md-2.col-6
     *   └── .store-listing-card
     *       ├── .store-listing-thumb
     *       │   └── img
     *       └── .store-listing-body
     *           └── .store-listing-title
     *               └── a   <-- anchor
     *
     * The Bootstrap column is the actual grid cell.
     * Hide that cell, not store-listing-body.
     */

        const gridCell =
              anchor.closest(
                  '.col-xl-2.col-lg-2.col-md-2.col-6'
              );

        if (gridCell) {

            /*
         * Safety check:
         * absolutely never hide a page-level container.
         */

            const forbiddenTags = new Set([
                'BODY',
                'HTML',
                'MAIN'
            ]);

            if (
                !forbiddenTags.has(
                    gridCell.tagName
                )
            ) {

                return gridCell;
            }
        }

        /*
     * Fallback:
     * If the Bootstrap class changes in the future,
     * use the product card itself.
     */

        const card =
              anchor.closest(
                  '.store-listing-card'
              );

        if (card) {
            return card;
        }

        /*
     * IMPORTANT:
     * Never walk arbitrarily higher than this.
     * Returning null is safer than hiding the entire page.
     */

        return null;
    }

    function shouldKeepScryCard(
        cardName,
        settings
    ) {

        /*
         * No filters enabled:
         * show everything.
         */

        if (
            !settings.shopping &&
            !settings.reference
        ) {

            return true;
        }

        const status =
            getCardStatus(
                cardName
            );

        /*
         * Collection cards are deliberately NOT kept
         * when filtering is active.
         *
         * User wants to scan cards they don't already own.
         */


        /*
         * Shopping filter.
         */

        if (
            settings.shopping &&
            status.wanted
        ) {

            return true;
        }

        /*
         * Reference filter.
         */

        if (
            settings.reference &&
            status.referenced
        ) {

            return true;
        }

        return false;
    }

    // ============================================================
    // Site adapters
    // ============================================================

    const SITES = {

        scry: {
            match: () => location.hostname === 'marketplace.scry.cl',
            nameElements: () =>
                Array.from(document.querySelectorAll(
                    '.store-listing-body .store-listing-title a'
                )).filter(looksLikeProductCardLink),
            container: el => findScryProductContainer(el),
            barStyle: { top: '5px', right: '250px' }
        },

        m4e: {
            match: () => /(^|\.)magic4ever\.cl$/.test(location.hostname),
            nameElements: () =>
                document.querySelectorAll(
                    '.m4e-row__name, .m4e-ed-tile__name'
                ),
            container: el => el.closest('.m4e-ed-item'),
            barStyle: {
                top: 'auto',
                right: 'auto',
                bottom: '20px',
                left: '20px'
            }
        }
    };

    function getSite() {
        return Object.values(SITES).find(s => s.match()) || null;
    }

    function isSupportedShop() {
        return !!getSite();
    }

    /*
     * Clear old badges and scanned flags so the page is
     * re-evaluated against updated lists.
     */
    function rescanAll() {

        document
            .querySelectorAll('.mtgcc-card-badge')
            .forEach(b => b.remove());

        document
            .querySelectorAll('[data-mtgcc-scanned]')
            .forEach(el => {
                delete el.dataset.mtgccScanned;
            });

        scheduleScryScan();
    }

    function applyScryFilter() {

        const site = getSite();

        if (!site) {
            return;
        }

        const settings = getFilterSettings();
        const forbidden = new Set(['BODY', 'HTML', 'MAIN']);

        function setHidden(container, hide) {

            const isHidden = container.dataset.mtgccHidden === '1';

            // Only touch the DOM when the state actually changes
            if (isHidden === hide) {
                return;
            }

            if (hide) {
                container.style.setProperty('display', 'none', 'important');
                container.dataset.mtgccHidden = '1';
            } else {
                container.style.removeProperty('display');
                delete container.dataset.mtgccHidden;
            }
        }

        if (!settings.shopping && !settings.reference) {

            document
                .querySelectorAll('[data-mtgcc-hidden="1"]')
                .forEach(c => setHidden(c, false));

            updateFilterCount(0, 0);
            return;
        }

        // One container may hold several name elements (m4e row + tile)
        const decided = new Map();

        document
            .querySelectorAll('[data-mtgcc-scanned="1"]')
            .forEach(el => {

                const cardName = el.dataset.mtgccCardName;

                if (!cardName) {
                    return;
                }

                const container = site.container(el);

                if (!container || forbidden.has(container.tagName)) {
                    return;
                }

                const keep = shouldKeepScryCard(cardName, settings);

                decided.set(
                    container,
                    decided.get(container) || keep
                );
            });

        let visible = 0;
        let hidden = 0;

        for (const [container, keep] of decided) {

            setHidden(container, !keep);

            if (keep) {
                visible++;
            } else {
                hidden++;
            }
        }

        updateFilterCount(visible, hidden);
    }

        function updateFilterCount(
        visible,
        hidden
    ) {

        const count =
            document.getElementById(
                'mtgcc-filter-count'
            );

        if (!count) {
            return;
        }

        const settings =
            getFilterSettings();

        const text =
            (!settings.shopping && !settings.reference)
                ? ''
                : `${visible} shown`;

        // Avoid needless DOM writes (they trigger the MutationObserver)
        if (count.textContent !== text) {
            count.textContent = text;
        }
    }

        // ============================================================
    // Filter UI
    // ============================================================

    function createScryFilterUI() {

        if (
            !isSupportedShop()
        ) {

            return;
        }

        if (
            document.getElementById(
                'mtgcc-scry-filter'
            )
        ) {

            return;
        }

        const settings =
            getFilterSettings();

        const bar =
            document.createElement(
                'div'
            );

        bar.id = 'mtgcc-scry-filter';

        const pos = (getSite() || {}).barStyle || {};

        for (const [k, v] of Object.entries(pos)) {
            bar.style.setProperty(k, v, 'important');
        }

        const shoppingLabel =
            document.createElement(
                'label'
            );

        shoppingLabel.className =
            'mtgcc-filter-label ' +
            'mtgcc-filter-shopping';

        const shoppingCheckbox =
            document.createElement(
                'input'
            );

        shoppingCheckbox.type =
            'checkbox';

        shoppingCheckbox.className =
            'mtgcc-filter-checkbox';

        shoppingCheckbox.checked =
            !!settings.shopping;

        const shoppingText =
            createText(
                'span',
                'Shopping'
            );

        shoppingLabel.appendChild(
            shoppingCheckbox
        );

        shoppingLabel.appendChild(
            shoppingText
        );

        const referenceLabel =
            document.createElement(
                'label'
            );

        referenceLabel.className =
            'mtgcc-filter-label ' +
            'mtgcc-filter-reference';

        const referenceCheckbox =
            document.createElement(
                'input'
            );

        referenceCheckbox.type =
            'checkbox';

        referenceCheckbox.className =
            'mtgcc-filter-checkbox';

        referenceCheckbox.checked =
            !!settings.reference;

        const referenceText =
            createText(
                'span',
                'Reference'
            );

        referenceLabel.appendChild(
            referenceCheckbox
        );

        referenceLabel.appendChild(
            referenceText
        );

        const count =
            createText(
                'span',
                '',
                ''
            );

        count.id =
            'mtgcc-filter-count';

        function updateSettings() {

            const newSettings = {

                shopping:
                    shoppingCheckbox.checked,

                reference:
                    referenceCheckbox.checked

            };

            saveFilterSettings(
                newSettings
            );

            applyScryFilter();
        }

        shoppingCheckbox.addEventListener(
            'change',
            updateSettings
        );

        referenceCheckbox.addEventListener(
            'change',
            updateSettings
        );

        bar.appendChild(
            shoppingLabel
        );

        bar.appendChild(
            referenceLabel
        );

        bar.appendChild(
            count
        );

        document.body.appendChild(
            bar
        );

        updateFilterCount(
            0,
            0
        );
    }

    // ============================================================
    // Scry scan
    // ============================================================

    function scanScryCards() {

        const site = getSite();

        if (!site) {
            return;
        }

        createScryFilterUI();

        let found = 0;

        for (const el of site.nameElements()) {

            if (el.dataset.mtgccScanned === '1') {
                continue;
            }

            const cardName =
                el.dataset.mtgccCardName ||
                el.textContent
                    .replace(/\s+/g, ' ')
                    .trim()
                    .replace(/\s*\[(?:O|✓|△)\]\s*$/u, '')
                    .trim();

            if (!cardName) {
                continue;
            }

            // addBadge appends [O]/[✓]/[△], so store the clean name first
            el.dataset.mtgccCardName = cardName;
            el.dataset.mtgccScanned = '1';

            addBadge(el, cardName);

            found++;
        }

        if (found) {
            applyScryFilter();
            console.log(
                `[MTGCC] ${location.hostname} scanned ${found} new cards.`
            );
        }
    }

        let scryScanTimer = null;

    function scheduleScryScan() {

        if (
            scryScanTimer
        ) {

            clearTimeout(
                scryScanTimer
            );
        }

        scryScanTimer =
            setTimeout(
                () => {

                    scryScanTimer =
                        null;

                    scanScryCards();

                },
                150
            );
    }

    function startScryObserver() {

        if (
            !isSupportedShop()
        ) {

            return;
        }

        scanScryCards();

        const observer =
            new MutationObserver(
                mutations => {

                    let relevant = false;

                    const isOurs = node =>
                        node.nodeType !== 1 ||
                        (
                            node.closest &&
                            node.closest(
                                '[id^="mtgcc-"], .mtgcc-card-badge'
                            )
                        );

                    outer:
                    for (
                        const mutation of mutations
                    ) {

                        for (
                            const node of mutation.addedNodes
                        ) {

                            if (!isOurs(node)) {

                                relevant = true;

                                break outer;
                            }
                        }
                    }

                    if (relevant) {

                        scheduleScryScan();
                    }
                }
            );

        observer.observe(
            document.body,
            {
                childList: true,
                subtree: true
            }
        );

        console.log(
            '[MTGCC] Scry.cl auto scanner enabled.'
        );
    }

    // ============================================================
    // Manage Lists
    // ============================================================

    function manageLists() {

        const old =
            document.getElementById(
                'mtgcc-overlay'
            );

        if (old) {
            old.remove();
        }

        const overlay =
            document.createElement(
                'div'
            );

        overlay.id =
            'mtgcc-overlay';

        const dialog =
            document.createElement(
                'div'
            );

        dialog.id =
            'mtgcc-dialog';

        dialog.appendChild(
            createText(
                'h2',
                '📚 MTG Card Lists',
                'mtgcc-dialog-title'
            )
        );

        dialog.appendChild(
            createText(
                'p',
                'Collection controls [O]. Shopping controls [✓]. Reference controls [△].',
                'mtgcc-dialog-text'
            )
        );

        const container =
            document.createElement(
                'div'
            );

        dialog.appendChild(
            container
        );

        function renderLists() {

            container.replaceChildren();

            const lists =
                getLists();

            const names =
                Object.keys(lists);

            if (!names.length) {

                container.appendChild(
                    createText(
                        'div',
                        'No lists imported yet.',
                        'mtgcc-dialog-text'
                    )
                );

                return;
            }

            for (
                const name of names
            ) {

                const list =
                    lists[name];

                const row =
                    document.createElement(
                        'div'
                    );

                row.className =
                    'mtgcc-managed-list';

                const info =
                    document.createElement(
                        'div'
                    );

                info.className =
                    'mtgcc-managed-info';

                info.appendChild(
                    createText(
                        'div',
                        list.name,
                        'mtgcc-managed-name'
                    )
                );

                info.appendChild(
                    createText(
                        'div',
                        `${list.uniqueCards} unique · ` +
                        `${list.totalQuantity} total · ` +
                        `${list.source || ''}`,
                        'mtgcc-managed-meta'
                    )
                );

                const controls =
                    document.createElement(
                        'div'
                    );

                const label =
                    createText(
                        'span',
                        'Type',
                        'mtgcc-type-label'
                    );

                const select =
                    document.createElement(
                        'select'
                    );

                select.className =
                    'mtgcc-type-select';

                const options = [
                    [
                        'collection',
                        'Collection'
                    ],
                    [
                        'shopping',
                        'Shopping'
                    ],
                    [
                        'reference',
                        'Reference'
                    ]
                ];

                for (
                    const [
                        value,
                        labelText
                    ] of options
                ) {

                    const option =
                        document.createElement(
                            'option'
                        );

                    option.value =
                        value;

                    option.textContent =
                        labelText;

                    if (
                        list.type ===
                        value
                    ) {

                        option.selected =
                            true;
                    }

                    select.appendChild(
                        option
                    );
                }

                select.addEventListener(
                    'change',
                    () => {

                        const updated =
                            getLists();

                        if (
                            updated[name]
                        ) {

                            updated[name].type =
                                select.value;

                            saveLists(
                                updated
                            );

                            if (isSupportedShop()) { rescanAll(); }
                        }
                    }
                );

                const deleteButton =
                    createText(
                        'button',
                        'Delete',
                        'mtgcc-button mtgcc-danger'
                    );

                deleteButton.addEventListener(
                    'click',
                    () => {

                        if (
                            !confirm(
                                `Delete "${name}"?`
                            )
                        ) {

                            return;
                        }

                        const updated =
                            getLists();

                        delete updated[name];

                        saveLists(
                            updated
                        );

                        renderLists();

                        if (isSupportedShop()) { rescanAll(); }
                    }
                );

                controls.appendChild(
                    label
                );

                controls.appendChild(
                    select
                );

                controls.appendChild(
                    deleteButton
                );

                row.appendChild(
                    info
                );

                row.appendChild(
                    controls
                );

                container.appendChild(
                    row
                );
            }
        }

        renderLists();

        const footer =
            document.createElement(
                'div'
            );

        footer.style.marginTop =
            '15px';

        const importButton =
            createText(
                'button',
                '📥 Import New List',
                'mtgcc-button mtgcc-primary'
            );

        const closeButton =
            createText(
                'button',
                'Close',
                'mtgcc-button'
            );

        importButton.addEventListener(
            'click',
            () => {

                overlay.remove();

                importList();
            }
        );

        closeButton.addEventListener(
            'click',
            () => {

                overlay.remove();

            }
        );

        footer.appendChild(
            importButton
        );

        footer.appendChild(
            closeButton
        );

        dialog.appendChild(
            footer
        );

        overlay.appendChild(
            dialog
        );

        document.body.appendChild(
            overlay
        );
    }

    // ============================================================
    // Toast
    // ============================================================

    function showToast(
        message,
        duration = 3000
    ) {

        const old =
            document.getElementById(
                'mtgcc-toast'
            );

        if (old) {
            old.remove();
        }

        const toast =
            createText(
                'div',
                message
            );

        toast.id =
            'mtgcc-toast';

        document.body.appendChild(
            toast
        );

        setTimeout(
            () => {

                toast.remove();

            },
            duration
        );
    }

    // ============================================================
    // Tampermonkey menu
    // ============================================================

    GM_registerMenuCommand(
        '📥 Import Card List CSV',
        () => {

            manageLists();
        }
    );

    GM_registerMenuCommand(
        '📚 Manage Card Lists',
        manageLists
    );

    // ============================================================
    // Keyboard shortcut
    // ============================================================

    document.addEventListener(
        'keydown',
        event => {

            if (
                event.ctrlKey &&
                event.shiftKey &&
                event.key.toLowerCase() ===
                'm'
            ) {

                event.preventDefault();

                const selection =
                    window.getSelection();

                if (
                    !selection ||
                    !selection.rangeCount
                ) {

                    return;
                }

                const text =
                    getSelectionText();

                if (
                    !isPotentialCardName(
                        text
                    )
                ) {

                    return;
                }

                showSelectionPopup(
                    text,
                    selection
                        .getRangeAt(0)
                        .getBoundingClientRect()
                );
            }
        }
    );

    // ============================================================
    // Startup
    // ============================================================

    console.log(
        '[MTGCC] MTG Collection Checker v0.3.2 loaded.'
    );

    if (
        isSupportedShop()
    ) {

        setTimeout(
            startScryObserver,
            800
        );
    }

})();