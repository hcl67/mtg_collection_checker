# MTG Collection Checker

一个 Tampermonkey / Violentmonkey 用户脚本：导入你自己的 CSV 卡表，在任意网页上快速查询一张万智牌（MTG）是否已拥有、在购物清单里，或在参考列表中；并在 [Scry.cl Marketplace](https://marketplace.scry.cl) 上自动给卡牌打标记、按清单过滤。

> 当前版本：**0.2.4**

---

## 功能

- **导入 CSV 卡表**：支持多个列表，每个列表可设置类型。
- **三种列表类型**
  | 类型 | 标记 | 含义 |
  |------|------|------|
  | `collection` | `[O]` | 你已拥有的卡 |
  | `shopping` | `[✓]` | 你想买的卡（购物清单 / wishlist） |
  | `reference` | `[△]` | 参考列表（staples、环境热门、某套牌等） |
- **划词查询**：在任意网页选中卡名，弹出小窗显示该卡在各个列表中的数量。
- **Scry.cl 自动标记**：自动扫描商品卡片，在卡名后追加 `[O]` / `[✓]` / `[△]` 徽章，鼠标悬停显示详细 tooltip（各列表中的数量）。
- **Scry.cl 过滤栏**：勾选 *Shopping* / *Reference* 后，只显示购物清单 / 参考列表中的卡，其余商品隐藏（已拥有的卡也会被隐藏，方便只看「还没有的」）。
- **双面牌支持**：名称含 `//` 的卡会拆分后分别匹配。
- **完全本地存储**：数据保存在 Tampermonkey 的本地存储中，不会上传到任何地方。

---

## 安装

1. 安装用户脚本管理器：[Tampermonkey](https://www.tampermonkey.net/) 或 Violentmonkey。
2. 新建脚本，将本仓库中的脚本文件内容粘贴进去并保存（或在 GitHub 上点击 *Raw* 让管理器自动安装）。
3. 刷新页面即可使用。

脚本所需权限：`GM_getValue`、`GM_setValue`、`GM_registerMenuCommand`、`GM_addStyle`。

> ⚠️ 脚本的 `@match` 为 `*://*/*`，因此划词查询功能会在所有网站生效；Scry.cl 的自动标记与过滤只在 `marketplace.scry.cl` 上启用。如果你只想在特定网站使用，可以自行修改 `@match`。

---

## 使用方法

### 1. 导入卡表

点击浏览器中 Tampermonkey 图标 → 本脚本菜单：

- **📥 Import Card List CSV**
- **📚 Manage Card Lists**

（两者都会打开管理窗口，在窗口里点击 **📥 Import New List** 选择 CSV 文件。）

导入时会依次询问：

1. **列表名称**（默认取文件名）。
2. **列表类型**：`collection` / `shopping` / `reference`。

如果同名列表已存在，会询问是否覆盖。

### 2. CSV 格式

CSV 第一行必须是表头，至少包含卡名列：

| 用途 | 可识别的列名（不区分大小写） |
|------|------|
| 卡名（必需） | `Name` / `Card Name` / `CardName` |
| 数量（可选） | `Quantity` / `Qty` / `Count` |

没有数量列时，每行按 1 张计算；同名卡会自动累加。

示例：

```csv
Name,Quantity
Sol Ring,1
Lightning Bolt,4
Fable of the Mirror-Breaker,2
```

大多数收藏管理工具（Moxfield、Archidekt、ManaBox 等）导出的 CSV 只要含上述列名即可使用。

### 3. 列表类型的自动推断

如果你在导入时没有手动指定，类型会根据列表名称关键字自动推断：

- 含 `collection` / `binder` / `owned` / `my cards` → `collection`
- 含 `shopping` / `want` / `buy` / `missing` / `wishlist` → `shopping`
- 其他 → `reference`

随时可以在 **Manage Card Lists** 窗口中通过下拉框修改类型，或删除列表。

### 4. 划词查询

在任意网页上用鼠标选中一个卡名（2–100 个字符、不超过 12 个单词），会在选区附近弹出小窗，列出每个列表中的数量：

- 绿色数字：Collection 中的拥有数量
- 黄色数字：Shopping 中的需求数量
- 蓝色 ✓：在 Reference 中
- 灰色 —：该列表中没有

也可以选中文字后按 **Ctrl + Shift + M** 手动触发。

### 5. Scry.cl 标记与过滤

打开 `marketplace.scry.cl` 后，脚本会自动：

- 给商品卡名追加徽章。徽章优先级：`[✓]` Shopping > `[△]` Reference > `[O]` Owned。
  （Reference 徽章仅在该卡不在购物清单时显示。）
- 在页面右上角显示过滤栏，勾选后只保留对应列表的卡，并显示当前展示数量。
- 监听页面变化，翻页 / 无限滚动加载的新商品也会被自动处理。

过滤选项会被记住，下次访问自动恢复。

---

## 注意事项 / 已知限制

- 卡名匹配基于**英文名的规范化比较**（忽略大小写、多余空格、弯引号），请确保 CSV 与网站上的卡名语言一致。
- Scry.cl 的过滤依赖其当前的页面结构（Bootstrap 栅格 `.col-xl-2.col-lg-2.col-md-2.col-6` 与 `.store-listing-card`）。如果网站改版，过滤功能可能需要更新选择器。
- 脚本对页面级容器（`body` / `html` / `main`）做了保护，不会误隐藏整个页面。
- 目前只支持 CSV 导入，不支持直接粘贴文本卡表。

---

## 数据存储

所有列表与过滤设置通过 `GM_setValue` 存储在本地：

- `mtgcc_lists_v2`：已导入的列表
- `mtgcc_scry_filter_v1`：Scry.cl 过滤栏设置

卸载脚本或清除脚本存储即可删除全部数据。

---

## 更新日志

### 0.2.4
- Scry.cl 过滤改为隐藏整个栅格单元，避免留下空白。
- 修复徽章追加后读取卡名不准确的问题（缓存干净卡名）。
- 加入多重安全检查，防止误隐藏页面级容器。

---

## License

MIT（可按需修改）

## Author

Djinn
