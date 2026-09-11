import fs from 'fs';

const planPath = process.argv[2];
const n = process.argv[3];
const outPath = process.argv[4] || `.superpowers/sdd/task-${n}-brief.md`;

const plan = fs.readFileSync(planPath, 'utf8');
const lines = plan.split(/\r?\n/);
let out = [];
let intask = false;
let fence = false;
const heading = new RegExp(`^#+\\s+Task\\s+${n}([^0-9]|$)`);

for (const line of lines) {
  if (line.startsWith('```')) fence = !fence;
  if (!fence && /^#+\s+Task\s+\d+/.test(line)) {
    intask = heading.test(line);
  }
  if (intask) out.push(line);
}

if (!out.length) {
  console.error(`task ${n} not found in ${planPath}`);
  process.exit(3);
}

fs.mkdirSync(outPath.replace(/[/\\][^/\\]+$/, ''), { recursive: true });
fs.writeFileSync(outPath, out.join('\n') + '\n');
console.log(`wrote ${outPath}: ${out.length} lines`);
