# PCR Workbench 源码结构（并行开发）

开发请改 `src/` 下对应包，再执行 `node build.mjs` 生成单文件 `pcr-workbench-proto.html`。

## 目录

| 路径 | 职责 | 并行改动时 |
|---|---|---|
| `src/shared/tokens.css` | 设计变量 | 主题色 |
| `src/shell/` | 顶栏、导航、设置、TIP、模式、弹窗壳 | 导航/会话桥 |
| `src/overview/` | Overview 主区 + **左侧会话历史/钉住** | Overview 功能 |
| `src/mytasks/` | My Tasks 主区 + **左侧任务列表** | My Tasks 功能 |
| `build.mjs` | 拼装单文件 | — |
| `tools/extract-modules.mjs` | 从单文件再切分（慎用） | 仅迁移/修复 |

### 左侧栏归属

| 区块 | 文件 |
|---|---|
| New Chat / Overview·My Tasks 导航 / 设置 | `src/shell/shell-before.html` |
| 任务筛选 + 任务列表（`.taskwrap`） | `src/mytasks/mytasks-rail.html` + `mytasks.css` / `mytasks.js` |
| 会话历史 + Pinned（`.histwrap` / `.pinned`） | `src/overview/overview-rail.html` + `overview.css` |

改 My Tasks 左侧列表 → **只动 `src/mytasks/*`**，不会改到 Overview 历史侧栏源文件。

## 命令

```bash
node build.mjs              # 拼装 → pcr-workbench-proto.html
node test-create-pcr.mjs    # 验收（测的是拼装后的单文件）
```

## 规则

1. My Tasks 侧栏/主区样式用 `.taskwrap` / `#view-task` / `.view-task` 前缀。
2. Overview 侧栏改 `overview-rail.html`；主区改 `overview.html` / `overview.css` / `overview.js`。
3. 业务 JS 通过 `window.Overview` / `window.MyTasks` 暴露；跨页只经壳（如 `switchView`、PARSE 会话全局函数）。
4. **不要**直接手改 `pcr-workbench-proto.html` 作为长期源；改 `src/` 后 build。
5. PR 尽量只动一个包（overview / mytasks / shell）。
