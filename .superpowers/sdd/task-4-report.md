# Task 4 Acceptance

1. Product Ops URL reachable: HTTP 200 on /workbench/pcr-workbench-proto.html (verified earlier)
2. logo-home href=/ present in served HTML; brand-sub outside link: True
3. Only one externalUrl in agents.ts (product-ops)
4. npm run build runs prebuild sync + vite build OK; dist/workbench present: see Test-Path
5. History: assign + a href=/ both push history (code-level)

Minor ledger from prior reviews: preview without pre-sync; empty string externalUrl edge; cursor:pointer implicit on a.
