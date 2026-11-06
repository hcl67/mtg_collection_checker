# MTG Collection Checker

A Tampermonkey userscript for Magic: The Gathering shoppers. Import your card lists from CSV, then see at a glance, right on the store page, which cards you already own, which are on your shopping list, and which appear in a reference list (staples, a meta deck, a trade binder, and so on). It can also filter a store's card grid down to just the cards you care about.

**Current version: 0.4.0**

## Features

- **Multiple card lists from CSV.** Import as many lists as you like and assign each one a type.
- **Import straight from an Archidekt collection URL**, and refresh it later with one click.
- **Three list types with inline badges** next to card names:

  | Type | Badge | Colour | Meaning |
  |------|-------|--------|---------|
  | Collection | `[O]` | Green | Cards you own |
  | Shopping | `[✓]` | Yellow | Cards you want to buy |
  | Reference | `[△]` | Blue | Any other list you want to check against |

- **Hover tooltip** on a badge showing, for every list, whether the card is in it and in what quantity.
- **Grid filter** on supported stores: show only cards from your Shopping lists and/or Reference lists, and hide everything else. A counter shows how many cards remain visible.
- **Selection popup on any website.** Select a card name anywhere on the web, and a small popup shows its status in all of your lists (also available with `Ctrl+Shift+M`).
- **Smart name matching**: case-insensitive, normalises quotes and extra whitespace, understands double-faced cards (`A // B` or `A / B`), and ignores variant suffixes such as `(Showcase)` or `(Extended Art)`.
- **Everything stays local.** Lists are stored in Tampermonkey storage on your machine. Nothing is uploaded anywhere. The only network request the script makes is the Archidekt download you start yourself.

## Supported stores

Badges and the grid filter currently work on:

| Store | Domain |
|-------|--------|
| Scry | `marketplace.scry.cl` |
| Magic4Ever | `magic4ever.cl` |

The selection popup is not limited to these sites. It works on any page.

## Installation

1. Install the [Tampermonkey](https://www.tampermonkey.net/) browser extension.
2. Open `mtg-collection-checker.user.js` from this repository (use the **Raw** button) and click **Install** when Tampermonkey prompts you.
3. Reload the store page.

## Usage

### Importing a list

1. Click the Tampermonkey icon, then choose **📚 Manage Card Lists** (or **📥 Import Card List CSV**).
2. Click **📥 Import New List** and pick a `.csv` file.
3. Enter a name for the list and choose its type: `collection`, `shopping` or `reference`.
4. If a list with the same name already exists, you will be asked whether to replace it.

Open pages are refreshed right after an import, a type change or a deletion.

### Importing from Archidekt

1. Choose **🔗 Import from Archidekt URL** from the Tampermonkey menu (or the button in Manage Card Lists).
2. Paste a public collection URL, for example `https://archidekt.com/collection/v2/749265`. A `?collectionGame=` parameter in the URL is respected; otherwise the paper collection is used.
3. Enter a name and type as with a CSV import.

The script calls the same export endpoint as Archidekt's **Export** button, fetching only quantity and card name. Lists imported this way show a **Refresh** button in Manage Card Lists that re-downloads the collection and keeps the list's name and type.

**Type auto-detection.** The default type is guessed from the list name:

- names containing `collection`, `binder`, `owned` or `my cards` → collection
- names containing `shopping`, `want`, `buy`, `missing` or `wishlist` → shopping
- anything else → reference

You can change a list's type at any time from the Manage Card Lists dialog.

### CSV format

The first row must be a header. Only two columns are used:

| Purpose | Accepted header names (case-insensitive) | Required |
|---------|-------------------------------------------|----------|
| Card name | `Name`, `Card Name`, `CardName` | Yes |
| Quantity | `Quantity`, `Qty`, `Count` | No (defaults to 1 per row) |

Other columns are ignored. Duplicate names are merged and their quantities summed. Example:

```csv
Name,Quantity
Lightning Bolt,4
"Fang of Shigeki",2
Arachne, Psionic Weaver,1
```

### Badge priority

When a card appears in several lists, a single badge is shown, chosen in this order:

1. `[✓]` Shopping, if the card is in any shopping list
2. `[△]` Reference, if it is in a reference list and not in a shopping list
3. `[O]` Owned, if it is in a collection list

Hover over the badge to see the full per-list breakdown.

### Filtering the card grid

On a supported store, a small filter bar appears on the page:

- **Shopping**: show only cards that are in a shopping list.
- **Reference**: show only cards that are in a reference list (and not in a shopping list).
- Enabling both shows the union of the two.
- With neither enabled, everything is shown.

Cards that are only in a collection list are deliberately hidden while a filter is active. The filter is meant for finding cards you do **not** already own. Your filter choices are remembered between visits.

### Selection popup

Select a card name on any page, and a popup lists every list with the quantity found (`—` means not present). `Ctrl+Shift+M` re-opens it for the current selection.

## Adding support for another store

Store support is defined by small adapters in the `SITES` object near the filter code:

```js
const SITES = {
    myshop: {
        // Which pages this adapter applies to
        match: () => location.hostname === 'www.example.com',

        // Elements whose text is the card name
        nameElements: () => document.querySelectorAll('.card-name'),

        // The element that should be hidden when the card is filtered out
        container: el => el.closest('.card-cell'),

        // CSS position for the filter bar
        barStyle: { top: '5px', right: '20px' }
    }
};
```

If a container holds several name elements (for example a list row and a tile view), the card is kept when any of them matches. Pull requests for new stores are welcome.

## Known limitations

- Names must match the language of your CSV. Cards shown with Spanish names will not match an English list.
- Variant suffixes are stripped from the **page** name, not from the **CSV** name. A list entry named `Card (Showcase)` will not match a page showing plain `Card`.
- Matching is by card name only. Set, finish and condition are not considered.
- The page structure of each store is read from its HTML, so a store redesign can break its adapter until it is updated.

## Changelog

### 0.4.0
- Import a public Archidekt collection directly from its URL, and refresh it later from Manage Card Lists.

### 0.3.2
- Variant suffixes like `(Showcase)` on the page no longer prevent a match with the base card.

### 0.3.1
- Fixed a feedback loop that kept the page rescanning forever and caused sustained high CPU usage after enabling a filter.
- The observer now ignores the script's own DOM changes, and filtering only updates elements whose state actually changed.

### 0.3.0
- Added support for magic4ever.cl through a site-adapter system.
- Imports, type changes and deletions now immediately refresh badges on open pages.
- Double-faced cards match with both `//` and `/` separators.

### 0.2.4
- Scry marketplace support: badges, tooltip and grid filter.

## Author

Djinn
