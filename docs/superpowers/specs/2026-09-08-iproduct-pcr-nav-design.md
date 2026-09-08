# iProduct ↔ PCR Workbench 双向导航

**日期：** 2026-09-08  
**状态：** 已确认  
**范围：** 原型演示用同标签页跳转，不改 PCR 业务逻辑

## 1. 目标

| 方向 | 操作 | 结果 |
|------|------|------|
| 前进 | iProduct Workspace 点击 **Product Ops** 卡片 | 同标签页打开 PCR Workbench **Overview** |
| 回退 | PCR 顶栏点击品牌 **iProduct** | 同标签页回到 iProduct 首页（Workspace） |

非目标：其它 Workbench 卡片仍走现有内部 chat；不合并两套应用架构；不引入路由框架到 PCR。

## 2. 架构（方案：静态资源挂载）

```
iProduct_Project (Vite :5173/5174)
  public/workbench/pcr-workbench-proto.html  ← 由同步脚本从 PCRworkbench_Project 复制
        │
        │  Product Ops → location.assign('/workbench/pcr-workbench-proto.html')
        ▼
  PCR 单页（同源）Overview
        │
        │  logo「iProduct」→ location.assign('/')
        ▼
  iProduct 首页
```

- 同源：回跳路径固定为 `/`，不依赖端口或 `file://`。
- 本地只需启动 iProduct 的 `npm run dev`。

## 3. 资源同步

- **源文件：** `PCRworkbench_Project/pcr-workbench-proto.html`
- **目标：** `iProduct_Project/public/workbench/pcr-workbench-proto.html`
- **时机：** `predev` / `prebuild`（或独立 `npm run sync:workbench`，并由 pre 钩子调用）
- **实现：** 小脚本（Node `fs.copyFile`）复制单文件；目录不存在则创建
- PCR 源码仍只在 `PCRworkbench_Project/src` 维护；改完后先 `node build.mjs`，再开 iProduct（predev 会带上最新 HTML）

## 4. iProduct 改动

### 4.1 数据（推荐）

在 `Agent` 类型增加可选字段：

```ts
externalUrl?: string; // 若存在，点击卡片外跳而非 openDraft
```

`product-ops` 配置：

```ts
externalUrl: '/workbench/pcr-workbench-proto.html'
```

### 4.2 UI

`WorkspaceView.handleWorkbenchClick`：

- 若 `agent.externalUrl` 有值 → `window.location.assign(agent.externalUrl)`
- 否则保持现有：`openDraft(agent.id)` + `NAVIGATE` 到 chat

## 5. PCR 改动

- 文件：`src/shell/shell-before.html`（必要时 `shell.css`）
- 将 `.logo` 内品牌区（`brand-mark` + `brand-name`「iProduct」）改为可点击控件（`<a href="/">` 或等价 `button` + `assign('/')`）
- `brand-sub`「Ops Workbench」与 `crumb` 保持不可点
- 视觉：默认外观不变；`cursor:pointer`；轻微 hover（颜色/透明度）
- 落地后重新 `build.mjs`，再经同步脚本进入 `public/workbench/`

Overview 默认态：现有 shell 进入即为 Overview，**本需求不强制** query；若后续需要可加 `?view=home`，本次不做。

## 6. 验收

1. 仅启动 iProduct dev：点 Product Ops → 同页进入 PCR Overview（可见 Overview 工作区内容）
2. 点左上角 **iProduct** → 回到 iProduct Workspace 首页
3. 其余 5 张 Workbench 卡片仍打开内部 draft chat
4. `npm run build`（iProduct）会先同步 workbench HTML，产物含 `/workbench/pcr-workbench-proto.html`
5. 浏览器后退：从 PCR 后退应能回到 iProduct（`assign` 进入历史栈）

## 7. 风险与约束

- `public/workbench` 中的 HTML 为生成副本，勿手改；改 PCR 源后需 build + sync
- 若有人单独用 `file://` 打开 PCR HTML，logo 链到 `/` 无效——原型约定只通过 iProduct 入口访问
- 不把 PCR 拆进 React；保持单文件原型
