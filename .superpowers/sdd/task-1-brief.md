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

