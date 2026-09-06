/**
 * 从 src/ 拼装 pcr-workbench-proto.html（演示/验收用单文件）
 * 开发请改 src/overview | src/mytasks | src/shell，再运行本脚本。
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = __dirname;

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

let shellBefore = read('src/shell/shell-before.html');
shellBefore = shellBefore
  .replace('<!--RAIL_MYTASKS-->', read('src/mytasks/mytasks-rail.html').trimEnd())
  .replace('<!--RAIL_OVERVIEW-->', read('src/overview/overview-rail.html').trimEnd());

const parts = [
  read('src/shell/head-prefix.html'),
  read('src/shared/tokens.css'),
  '\n',
  read('src/shell/shell.css'),
  '\n',
  read('src/overview/overview.css'),
  '\n',
  read('src/mytasks/mytasks.css'),
  '</style>\n</head>\n<body>\n',
  shellBefore,
  read('src/overview/overview.html'),
  read('src/mytasks/mytasks.html'),
  read('src/shell/shell-after.html'),
  '<script>\n',
  read('src/shell/shell.js'),
  '\n',
  read('src/mytasks/mytasks.js'),
  '\n',
  read('src/mytasks/batch.js'),
  '\n',
  read('src/overview/overview.js'),
  read('src/shell/tail.html'),
];

const out = parts.join('');
const outPath = path.join(root, 'pcr-workbench-proto.html');
fs.writeFileSync(outPath, out, 'utf8');
console.log('built', outPath, `(${out.length} chars)`);
