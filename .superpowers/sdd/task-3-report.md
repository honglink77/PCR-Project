# Task 3 Report: PCR 顶栏回退到 iProduct

**Status:** DONE

**Commit:** `12805f4` — `feat: PCR 顶栏 iProduct 回退到门户首页`

## Changes

| File | Change |
|------|--------|
| `PCRworkbench_Project/src/shell/shell-before.html` | Logo wrapped in `<a class="logo-home" href="/">`; `brand-sub` moved outside link |
| `PCRworkbench_Project/src/shell/shell.css` | Added `.logo-home` + hover rules; removed obsolete `.logo .brand-text` |
| `PCRworkbench_Project/pcr-workbench-proto.html` | Rebuilt via `node build.mjs` |
| `iProduct_Project/public/workbench/pcr-workbench-proto.html` | Synced via `npm run sync:workbench` (411390 bytes) |

## Verification

- **Build:** `node build.mjs` — pass (374338 chars)
- **Sync:** `npm run sync:workbench` — pass (411390 bytes)
- **Static check:** Both proto files contain `.logo-home` with `href="/"` and hover CSS
- **Browser hand-test:** Not run in this session; link target is same-origin `/`

## Self-Review

- HTML/CSS match brief verbatim; no iProduct React changes
- `.logo .brand-mark` / `.logo .brand-name` selectors still apply inside `.logo-home`
- Removed only the now-unused `.logo .brand-text` rule
- Scope limited to Task 3 files; no unrelated edits

## Concerns

None. Recommend manual click-test: iProduct → Product Ops → PCR → click iP/iProduct → `/`; browser back should return to iProduct.
