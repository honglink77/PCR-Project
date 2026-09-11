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

