// iProduct_Project/scripts/sync-workbench.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');          // iProduct_Project
const repo = path.resolve(root, '..');               // project/
const src = path.join(repo, 'PCRworkbench_Project', 'pcr-workbench-proto.html');
const specSrc = path.join(repo, 'PCRworkbench_Project', 'specialist');
const destDir = path.join(root, 'public', 'workbench');
const dest = path.join(destDir, 'pcr-workbench-proto.html');
const specDest = path.join(destDir, 'specialist');

if (!fs.existsSync(src)) {
  console.error('Missing source:', src);
  console.error('Run: cd PCRworkbench_Project && node build.mjs');
  process.exit(1);
}
fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(src, dest);
console.log('synced', path.relative(root, dest), `(${fs.statSync(dest).size} bytes)`);

if (!fs.existsSync(specSrc)) {
  console.warn('Missing specialist dir:', specSrc);
} else {
  fs.rmSync(specDest, { recursive: true, force: true });
  fs.cpSync(specSrc, specDest, { recursive: true });
  console.log('synced', path.relative(root, specDest));
}
