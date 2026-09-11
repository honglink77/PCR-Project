import { execSync } from 'child_process';
import fs from 'fs';

const base = process.argv[2];
const head = process.argv[3];
const out = process.argv[4] || `.superpowers/sdd/review-${base.slice(0, 7)}..${head.slice(0, 7)}.diff`;

const body = [
  `# Review package: ${base}..${head}`,
  '',
  '## Commits',
  execSync(`git log --oneline ${base}..${head}`, { encoding: 'utf8' }).trim(),
  '',
  '## Files changed',
  execSync(`git diff --stat ${base}..${head}`, { encoding: 'utf8' }).trim(),
  '',
  '## Diff',
  execSync(`git diff -U10 ${base}..${head}`, { encoding: 'utf8' }),
].join('\n');

fs.mkdirSync(out.replace(/[/\\][^/\\]+$/, ''), { recursive: true });
fs.writeFileSync(out, body);
const commits = execSync(`git rev-list --count ${base}..${head}`, { encoding: 'utf8' }).trim();
console.log(`wrote ${out}: ${commits} commit(s), ${Buffer.byteLength(body)} bytes`);
