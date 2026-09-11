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

