# iProduct ↔ PCR 双向导航 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 iProduct 点击 Product Ops 同页进入 PCR Overview；在 PCR 点击顶栏「iProduct」回到 iProduct 首页。

**Architecture:** 将 `pcr-workbench-proto.html` 同步到 `iProduct_Project/public/workbench/`，同源静态挂载；Product Ops 用 `location.assign` 外跳；PCR logo 链回 `/`。

**Tech Stack:** Vite/React (iProduct)、单文件 HTML 原型 (PCR)、Node 复制脚本

**Spec:** `docs/superpowers/specs/2026-09-08-iproduct-pcr-nav-design.md`

## Global Constraints

- 同标签页跳转（`location.assign`），不新开标签
- 仅 `product-ops` 外跳；其它 Workbench 卡片行为不变
- PCR 业务逻辑不改；源码仍在 `PCRworkbench_Project`，`public/workbench` 仅为副本
- Overview 不强制 query；进入 PCR 默认 Overview 即可
- 回复与提交信息可用中文，与仓库近期风格一致

## File Map

| 文件 | 职责 |
|------|------|
| `iProduct_Project/scripts/sync-workbench.mjs` | 复制 PCR HTML → `public/workbench/` |
| `iProduct_Project/package.json` | `sync:workbench` + `predev` / `prebuild` |
| `iProduct_Project/src/types/agent.ts` | `externalUrl?: string` |
| `iProduct_Project/src/data/agents.ts` | `product-ops.externalUrl` |
| `iProduct_Project/src/components/workspace/WorkspaceView.tsx` | 有 `externalUrl` 则外跳 |
| `PCRworkbench_Project/src/shell/shell-before.html` | logo 品牌区可点回 `/` |
| `PCRworkbench_Project/src/shell/shell.css` | logo 链接样式 |
| `PCRworkbench_Project/pcr-workbench-proto.html` | `build.mjs` 产物（再被 sync） |

---

### Task 1: Workbench 同步脚本

**Files:**
- Create: `iProduct_Project/scripts/sync-workbench.mjs`
- Modify: `iProduct_Project/package.json`

**Interfaces:**
- Produces: npm script `sync:workbench`；副作用写出 `iProduct_Project/public/workbench/pcr-workbench-proto.html`
- Consumes: `PCRworkbench_Project/pcr-workbench-proto.html`（须已存在；若缺失则脚本 exit 1）

- [ ] **Step 1: 创建同步脚本**

```js
// iProduct_Project/scripts/sync-workbench.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');          // iProduct_Project
const repo = path.resolve(root, '..');               // project/
const src = path.join(repo, 'PCRworkbench_Project', 'pcr-workbench-proto.html');
const destDir = path.join(root, 'public', 'workbench');
const dest = path.join(destDir, 'pcr-workbench-proto.html');

if (!fs.existsSync(src)) {
  console.error('Missing source:', src);
  console.error('Run: cd PCRworkbench_Project && node build.mjs');
  process.exit(1);
}
fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(src, dest);
console.log('synced', path.relative(root, dest), `(${fs.statSync(dest).size} bytes)`);
```

- [ ] **Step 2: 挂到 package.json scripts**

在 `iProduct_Project/package.json` 的 `scripts` 中增加（保留现有脚本）：

```json
"sync:workbench": "node scripts/sync-workbench.mjs",
"predev": "npm run sync:workbench",
"prebuild": "npm run sync:workbench",
"dev": "vite",
"build": "vite build"
```

- [ ] **Step 3: 跑同步并确认文件存在**

```powershell
Set-Location "d:\02work\02联想\【14】iProduct\【01】Aether\project\iProduct_Project"
npm run sync:workbench
Test-Path "public\workbench\pcr-workbench-proto.html"
```

Expected: 打印 `synced public\workbench\pcr-workbench-proto.html (... bytes)`；`Test-Path` 为 `True`

- [ ] **Step 4: Commit**

```bash
git add iProduct_Project/scripts/sync-workbench.mjs iProduct_Project/package.json iProduct_Project/public/workbench/pcr-workbench-proto.html
git commit -m "chore: 同步 PCR workbench HTML 到 iProduct public"
```

---

### Task 2: Product Ops 外跳

**Files:**
- Modify: `iProduct_Project/src/types/agent.ts`
- Modify: `iProduct_Project/src/data/agents.ts`
- Modify: `iProduct_Project/src/components/workspace/WorkspaceView.tsx`

**Interfaces:**
- Consumes: Task 1 提供的 URL 路径 `/workbench/pcr-workbench-proto.html`
- Produces: `Agent.externalUrl?: string`；点击有该字段的卡片时 `window.location.assign(externalUrl)`

- [ ] **Step 1: 扩展 Agent 类型**

在 `iProduct_Project/src/types/agent.ts` 的 `Agent` 接口增加：

```ts
externalUrl?: string; // 若存在，Workbench 卡片外跳而非 openDraft
```

- [ ] **Step 2: 配置 product-ops**

在 `iProduct_Project/src/data/agents.ts` 的 `id: 'product-ops'` 对象上增加：

```ts
externalUrl: '/workbench/pcr-workbench-proto.html',
```

- [ ] **Step 3: 改点击逻辑**

将 `WorkspaceView.tsx` 中：

```ts
function handleWorkbenchClick(agent: Agent) {
  openDraft(agent.id);
  appDispatch({ type: 'NAVIGATE', view: 'chat' });
}
```

改为：

```ts
function handleWorkbenchClick(agent: Agent) {
  if (agent.externalUrl) {
    window.location.assign(agent.externalUrl);
    return;
  }
  openDraft(agent.id);
  appDispatch({ type: 'NAVIGATE', view: 'chat' });
}
```

- [ ] **Step 4: 手测（dev）**

```powershell
# 若已有 dev 在跑可刷新；否则：
npm run dev
```

浏览器打开 Vite Local URL → Workspace → 点 **Product Ops** → 应进入 PCR Overview（可见问候/工作区或甘特入口等 Overview 内容）。点其它卡片（如 Portfolio Planning）仍进内部 chat。

- [ ] **Step 5: Commit**

```bash
git add iProduct_Project/src/types/agent.ts iProduct_Project/src/data/agents.ts iProduct_Project/src/components/workspace/WorkspaceView.tsx
git commit -m "feat: Product Ops 卡片跳转 PCR Workbench"
```

---

### Task 3: PCR 顶栏回退到 iProduct

**Files:**
- Modify: `PCRworkbench_Project/src/shell/shell-before.html`
- Modify: `PCRworkbench_Project/src/shell/shell.css`
- Run: `PCRworkbench_Project/build.mjs`
- Sync: `iProduct_Project` `npm run sync:workbench`

**Interfaces:**
- Consumes: 同源首页路径 `/`
- Produces: 可点击品牌链接 `.logo-home` → `/`

- [ ] **Step 1: 改 shell-before.html logo**

将：

```html
<div class="logo">
  <span class="brand-mark" aria-hidden="true">iP</span>
  <span class="brand-text">
    <span class="brand-name">iProduct</span>
    <span class="brand-sub">Ops Workbench</span>
  </span>
  <small id="crumb">Overview</small>
</div>
```

改为：

```html
<div class="logo">
  <a class="logo-home" href="/" title="返回 iProduct">
    <span class="brand-mark" aria-hidden="true">iP</span>
    <span class="brand-name">iProduct</span>
  </a>
  <span class="brand-sub">Ops Workbench</span>
  <small id="crumb">Overview</small>
</div>
```

- [ ] **Step 2: 补 CSS**

在 `shell.css` 的 `.logo` 相关规则旁增加（保留原 `.logo .brand-mark` / `.brand-name` 尺寸色值，作用到链接内）：

```css
.logo-home{display:flex;align-items:center;gap:8px;min-width:0;text-decoration:none;color:inherit;border-radius:8px}
.logo-home:hover .brand-name{color:var(--accent-ink)}
.logo-home:hover .brand-mark{filter:brightness(1.06)}
.logo .brand-sub{font-size:12px;font-weight:400;color:var(--ink-3);white-space:nowrap}
```

若原 `.logo .brand-text` 规则因结构变化不再需要，可删除该条；确保 `.logo .brand-mark` / `.logo .brand-name` 仍生效（选择器仍匹配 `.logo-home` 内子元素）。

- [ ] **Step 3: 重建并同步**

```powershell
Set-Location "d:\02work\02联想\【14】iProduct\【01】Aether\project\PCRworkbench_Project"
node build.mjs
Set-Location "..\iProduct_Project"
npm run sync:workbench
```

Expected: build 成功；sync 打印字节数

- [ ] **Step 4: 手测回退**

从 iProduct 点 Product Ops 进入 PCR → 点左上角 **iProduct**（或 iP 标）→ 回到 iProduct Workspace。浏览器后退从 PCR 也应能回到 iProduct。

- [ ] **Step 5: Commit**

```bash
git add PCRworkbench_Project/src/shell/shell-before.html PCRworkbench_Project/src/shell/shell.css PCRworkbench_Project/pcr-workbench-proto.html iProduct_Project/public/workbench/pcr-workbench-proto.html
git commit -m "feat: PCR 顶栏 iProduct 回退到门户首页"
```

---

### Task 4: 验收收尾

**Files:** 无新文件（回归检查）

- [ ] **Step 1: 核对验收清单（对照 spec §6）**

1. 仅启 iProduct：Product Ops → PCR Overview  
2. 点 iProduct logo → 回门户  
3. 其它 5 张卡片仍内部 chat  
4. `npm run build`（在 `iProduct_Project`）会跑 `prebuild` 同步，且 `dist` 或 build 过程无缺文件报错；确认 `public/workbench/pcr-workbench-proto.html` 存在  
5. 历史栈：`assign` 前进后可用浏览器后退  

- [ ] **Step 2:（可选）推送 Aether**

仅在用户明确要求时：

```bash
git push origin Aether
```

---

## Spec coverage check

| Spec 项 | Task |
|---------|------|
| public 挂载 + sync 脚本 / predev / prebuild | Task 1 |
| Agent.externalUrl + product-ops 配置 | Task 2 |
| WorkspaceView 外跳 | Task 2 |
| PCR logo → `/` | Task 3 |
| build + sync 副本 | Task 3 |
| 验收 1–5 | Task 4 |
| 不改其它卡片 / 不强制 query | Task 2/3 明确保持 |

## Placeholder scan

无 TBD/TODO；路径与代码均为可执行内容。
