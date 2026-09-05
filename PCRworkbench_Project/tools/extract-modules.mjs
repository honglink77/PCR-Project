/**
 * 一次性切分：把 pcr-workbench-proto.html 拆到 src/
 * 原则：按标记剪切，不改内容；build.mjs 再拼回。
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const srcFile = path.join(root, 'pcr-workbench-proto.html');
const html = fs.readFileSync(srcFile, 'utf8');

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}
function write(rel, content) {
  const full = path.join(root, rel);
  ensureDir(path.dirname(full));
  fs.writeFileSync(full, content, 'utf8');
  console.log('wrote', rel, `(${content.length} chars)`);
}

// --- split style ---
const styleOpen = html.indexOf('<style>');
const styleClose = html.indexOf('</style>');
if (styleOpen < 0 || styleClose < 0) throw new Error('style tags not found');
const styleBody = html.slice(styleOpen + '<style>'.length, styleClose);

const rootMatch = styleBody.match(/:root\s*\{[\s\S]*?\n\s*\}/);
if (!rootMatch) throw new Error(':root block not found');
const tokensCss = rootMatch[0].trim() + '\n';
const afterRoot = styleBody.slice(rootMatch.index + rootMatch[0].length);

// Split remaining CSS into mytasks vs rest by rule blocks
function splitCssRules(css) {
  const mytasks = [];
  const rest = [];
  let i = 0;
  const n = css.length;
  while (i < n) {
    // skip whitespace / comments
    if (/\s/.test(css[i])) {
      let j = i;
      while (j < n && /\s/.test(css[j])) j++;
      const ws = css.slice(i, j);
      // attach whitespace to whichever bucket gets next rule; hold temporarily
      i = j;
      // peek next
      if (i >= n) break;
      // comment
      if (css.startsWith('/*', i)) {
        const end = css.indexOf('*/', i + 2);
        const block = css.slice(i, end < 0 ? n : end + 2);
        const target = /view-task|taskwrap|taskview/.test(block) ? mytasks : rest;
        // include preceding ws with this block
        target.push(ws + block);
        i = end < 0 ? n : end + 2;
        continue;
      }
      // find selector until {
      const brace = css.indexOf('{', i);
      if (brace < 0) {
        rest.push(ws + css.slice(i));
        break;
      }
      let depth = 0;
      let k = brace;
      for (; k < n; k++) {
        if (css[k] === '{') depth++;
        else if (css[k] === '}') {
          depth--;
          if (depth === 0) {
            k++;
            break;
          }
        }
      }
      const block = css.slice(i, k);
      const head = css.slice(i, brace);
      const isMy =
        /\.view-task\b|\.taskwrap\b|body\.taskview\b/.test(head) ||
        /\.view-task\b|\.taskwrap\b|body\.taskview\b/.test(block.slice(0, 200));
      (isMy ? mytasks : rest).push(ws + block);
      i = k;
      continue;
    }
    // no leading ws path — same as above without ws
    if (css.startsWith('/*', i)) {
      const end = css.indexOf('*/', i + 2);
      const block = css.slice(i, end < 0 ? n : end + 2);
      const target = /view-task|taskwrap|taskview/.test(block) ? mytasks : rest;
      target.push(block);
      i = end < 0 ? n : end + 2;
      continue;
    }
    const brace = css.indexOf('{', i);
    if (brace < 0) {
      rest.push(css.slice(i));
      break;
    }
    let depth = 0;
    let k = brace;
    for (; k < n; k++) {
      if (css[k] === '{') depth++;
      else if (css[k] === '}') {
        depth--;
        if (depth === 0) {
          k++;
          break;
        }
      }
    }
    const block = css.slice(i, k);
    const head = css.slice(i, brace);
    const isMy = /\.view-task\b|\.taskwrap\b|body\.taskview\b/.test(head);
    (isMy ? mytasks : rest).push(block);
    i = k;
  }
  return { mytasks: mytasks.join('').trim() + '\n', rest: rest.join('').trim() + '\n' };
}

const { mytasks: mytasksCss, rest: restCss } = splitCssRules(afterRoot);

// Further split rest into overview vs shell by keywords
function splitOverviewShell(css) {
  const overview = [];
  const shell = [];
  let i = 0;
  const n = css.length;
  const isOverviewHead = (head) =>
    /body\.parsing|\.askwrap|\.ask\b|\.parse-|\.plist|\.pstep|\.fill-|\.type-|\.sim-|\.submit-dock|\.homeStack|#homeStack|\.brief|\.kpi|\.page\b|\.greet|\.watch|\.feed|\.mods|\.matrix|\.health|\.load\b|\.detect|\.guide|\.chips|\.bub\b|\.tl-|\.parse-ai|\.parse-sep|\.btn-force|\.btn-teal/.test(
      head
    );

  while (i < n) {
    if (/\s/.test(css[i])) {
      let j = i;
      while (j < n && /\s/.test(css[j])) j++;
      const ws = css.slice(i, j);
      i = j;
      if (i >= n) break;
      if (css.startsWith('/*', i)) {
        const end = css.indexOf('*/', i + 2);
        const block = css.slice(i, end < 0 ? n : end + 2);
        const ov = /parse|ask|fill|brief|kpi|Create PCR|首页|一键/.test(block);
        (ov ? overview : shell).push(ws + block);
        i = end < 0 ? n : end + 2;
        continue;
      }
      const brace = css.indexOf('{', i);
      if (brace < 0) {
        shell.push(ws + css.slice(i));
        break;
      }
      let depth = 0;
      let k = brace;
      for (; k < n; k++) {
        if (css[k] === '{') depth++;
        else if (css[k] === '}') {
          depth--;
          if (depth === 0) {
            k++;
            break;
          }
        }
      }
      const block = css.slice(i, k);
      const head = css.slice(i, brace);
      (isOverviewHead(head) ? overview : shell).push(ws + block);
      i = k;
      continue;
    }
    if (css.startsWith('/*', i)) {
      const end = css.indexOf('*/', i + 2);
      const block = css.slice(i, end < 0 ? n : end + 2);
      const ov = /parse|ask|fill|brief|kpi/.test(block);
      (ov ? overview : shell).push(block);
      i = end < 0 ? n : end + 2;
      continue;
    }
    const brace = css.indexOf('{', i);
    if (brace < 0) {
      shell.push(css.slice(i));
      break;
    }
    let depth = 0;
    let k = brace;
    for (; k < n; k++) {
      if (css[k] === '{') depth++;
      else if (css[k] === '}') {
        depth--;
        if (depth === 0) {
          k++;
          break;
        }
      }
    }
    const block = css.slice(i, k);
    const head = css.slice(i, brace);
    (isOverviewHead(head) ? overview : shell).push(block);
    i = k;
  }
  return {
    overview: overview.join('').trim() + '\n',
    shell: shell.join('').trim() + '\n',
  };
}

const { overview: overviewCss, shell: shellCss } = splitOverviewShell(restCss);

write('src/shared/tokens.css', '/* shared design tokens */\n' + tokensCss);
write('src/shell/shell.css', '/* shell: layout / rail / topbar / tip / modal */\n' + shellCss);
write('src/overview/overview.css', '/* overview: home + create PCR */\n' + overviewCss);
write('src/mytasks/mytasks.css', '/* mytasks: task list + task detail */\n' + mytasksCss);

// --- HTML body parts ---
const bodyStart = html.indexOf('<body>');
const scriptStart = html.indexOf('<script>');
const head = html.slice(0, styleOpen); // includes <!DOCTYPE> ... <style> opener not included

const bodyInner = html.slice(bodyStart + '<body>'.length, scriptStart);

const viewHomeStart = bodyInner.indexOf('<div id="view-home">');
const viewTaskStart = bodyInner.indexOf('<div id="view-task"');
const viewTaskEndMarker = '</div>\n    </div>\n\n    <!-- ASK BAR -->';
// find end of view-task: after view-task block closes before askwrap
const askIdx = bodyInner.indexOf('<!-- ASK BAR -->');
if (viewHomeStart < 0 || viewTaskStart < 0 || askIdx < 0) {
  throw new Error('HTML view markers not found');
}

// view-home ends where view-task starts
const overviewHtml = bodyInner.slice(viewHomeStart, viewTaskStart).trim() + '\n';
// view-task ends at ask bar
const mytasksHtml = bodyInner.slice(viewTaskStart, askIdx).trim() + '\n';

const shellBefore = bodyInner.slice(0, viewHomeStart);
const shellAfter = bodyInner.slice(askIdx);

write('src/overview/overview.html', overviewHtml);
write('src/mytasks/mytasks.html', mytasksHtml);
write('src/shell/shell-before.html', shellBefore);
write('src/shell/shell-after.html', shellAfter);
write(
  'src/shell/head-prefix.html',
  head + '<style>\n/* built by build.mjs — do not edit assembled file by hand for module work */\n'
);

// --- JS ---
const scriptEnd = html.lastIndexOf('</script>');
const js = html.slice(scriptStart + '<script>'.length, scriptEnd);

const tasksMarker = '\n/* ══════════ 任务视图渲染逻辑 ══════════ */\n';
const pcrMarker = '\n/* ══════════ 创建 PCR ══════════ */\n';
const ti = js.indexOf(tasksMarker);
const pi = js.indexOf(pcrMarker);
if (ti < 0 || pi < 0) throw new Error('JS markers not found');

const shellJs = js.slice(0, ti).trim() + '\n';
const mytasksNs = `

/* MyTasks namespace for parallel ownership */
window.MyTasks = {
  ensureInit() {
    if (!window.__taskInit) {
      window.__taskInit = 1;
      renderTaskAll();
    }
  },
  renderAll: typeof renderTaskAll === 'function' ? renderTaskAll : function () {}
};
window.renderTaskAll = renderTaskAll;
`;
const mytasksJs = js.slice(ti, pi).trim() + mytasksNs;

let overviewJs = js.slice(pi).trim() + '\n';
overviewJs += `
window.Overview = {
  startParse: typeof startParse === 'function' ? startParse : null,
  resumeParse: typeof resumeParse === 'function' ? resumeParse : null,
  suspendParse: typeof suspendParse === 'function' ? suspendParse : null
};
`;

let shellJsPatched = shellJs.replace(
  "if(v==='task'&&!window.__taskInit){window.__taskInit=1;renderTaskAll();}",
  "if(v==='task'){ if(window.MyTasks&&MyTasks.ensureInit) MyTasks.ensureInit(); else if(!window.__taskInit){window.__taskInit=1;renderTaskAll();} }"
);

write('src/shell/shell.js', '/* shell: navigation, tips, mode, shared chrome */\n' + shellJsPatched);
write('src/mytasks/mytasks.js', '/* mytasks: task list + detail workspace */\n' + mytasksJs);
write('src/overview/overview.js', '/* overview: home dashboard + create PCR */\n' + overviewJs);

write('src/shell/tail.html', '</script>\n</body>\n</html>\n');

console.log('\nExtract done. Run: node build.mjs');
