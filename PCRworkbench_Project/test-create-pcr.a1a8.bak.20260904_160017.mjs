/**
 * 创建 PCR 验收（对照 创建PCR_需求补齐 + 既有 UI 约束）
 * 运行：node test-create-pcr.mjs
 */
import fs from 'fs';
import path from 'path';
import { pathToFileURL, fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, 'pcr-workbench-proto.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const results = [];
function check(name, pass, detail) {
  results.push({ name, pass: !!pass, detail: detail || '' });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
}

check('仍为单文件无外部库', !/<script\s+src=/i.test(html) && !/<link[^>]+rel=["']stylesheet/i.test(html));
check('导航仍仅 Overview / My Tasks', (html.match(/class="navitem[^"]*"[^>]*>[\s\S]*?(Overview|My Tasks)/g) || []).length >= 2);
check('解析结构含 parseUser + sticky + chat', html.includes('id="parseUser"') && html.includes('id="parseSticky"') && html.includes('id="parseChat"'));
check('含 STEP_RULES.sSim', /sSim\s*:/.test(html));
check('TIP 44–57 键存在', ['sugPanel','sugLock','typeConfirm','simClosed','draftSave','sevFour','fillPreview','withdrawTip'].every(k => html.includes(k + ':')));

const require = createRequire(path.join(__dirname, '.pcr-test', 'package.json'));
const puppeteer = require('puppeteer-core');
const chrome = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
].find(p => fs.existsSync(p));
if (!chrome) { check('Chrome', false); printSummary(); process.exit(1); }

const browser = await puppeteer.launch({ executablePath: chrome, headless: 'new', args: ['--allow-file-access-from-files'] });
const page = await browser.newPage();
page.setDefaultTimeout(15000);
page.on('pageerror', e => console.error('PAGEERROR', e.message));

try {
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#askin');

  const nav = await page.$$eval('.nav > .navitem', els => els.map(e => e.textContent.replace(/\s+/g, ' ').trim()));
  check('导航两项', nav.length === 2 && nav[0].includes('Overview') && nav[1].includes('My Tasks'));

  await page.evaluate(() => { startParse(DEMO_MAIL); skipParse(); });
  await page.waitForFunction(() => document.body.classList.contains('parsing') && document.querySelector('.sug-panel'));

  const layout = await page.evaluate(() => {
    const user = document.getElementById('parseUser');
    const chat = document.getElementById('parseChat');
    const me = user.querySelector('.bub.me');
    const ai = chat.querySelector('.parse-ai');
    const us = getComputedStyle(user);
    const openCount = PARSE.steps.filter(s => s.open).length;
    return {
      userAlign: us.alignItems,
      meRight: me && getComputedStyle(me).alignSelf === 'flex-end',
      meBg: me && getComputedStyle(me).backgroundColor,
      aiLeft: !!ai,
      openCount
    };
  });
  check('执行完成后步骤全部收起', layout.openCount === 0, String(layout.openCount));
  check('用户内容靠右', layout.userAlign === 'flex-end' && layout.meRight);
  check('AI 内容靠左容器', layout.aiLeft);

  const order = await page.evaluate(() => {
    const layer = document.getElementById('parseLayer');
    const kids = [...layer.children].map(el => el.id);
    const userText = document.getElementById('parseUser').innerText;
    const processBubbles = [...document.querySelectorAll('#parseChat .bub.ai')].filter(b =>
      /正在从描述|已将本次识别|产品匹配到|建议：/.test(b.innerText) && !b.querySelector('.sug-panel')
    ).length;
    return { kids, userText: userText.slice(0, 40), hasSug: !!document.querySelector('.sug-panel'), processBubbles };
  });
  check('对话顺序：用户原文 → 清单 → AI结论', order.kids[0] === 'parseUser' && order.kids[1] === 'parseSticky' && order.kids[2] === 'parseChat');
  check('用户原文在顶部', /Hi team|Per confirmed/.test(order.userText));
  check('无过程性重复气泡', order.processBubbles === 0, String(order.processBubbles));
  check('AI 字段建议面板为主结果', await page.evaluate(() => {
    return !!document.querySelector('.parse-sep') && !!document.querySelector('.sug-panel') &&
      document.querySelectorAll('.sug-item').length >= 6 &&
      /AI 字段建议/.test(document.getElementById('parseChat').innerText) &&
      !document.querySelector('.ai-head') && !document.querySelector('.think-pill');
  }));
  check('五步摘要左靠不撑满', await page.evaluate(() => {
    const plist = document.getElementById('plist');
    const row = document.querySelector('.pstep-h');
    if (!plist || !row) return false;
    const pw = plist.getBoundingClientRect().width;
    const rw = row.getBoundingClientRect().width;
    const ptt = row.querySelector('.ptt');
    const psum = row.querySelector('.psum');
    if (!ptt || !psum) return false;
    const gap = psum.getBoundingClientRect().left - ptt.getBoundingClientRect().right;
    return pw <= 540 && rw < pw * 0.95 && gap >= 4 && gap <= 40;
  }));
  check('提示态为黄底叹号非红色', await page.evaluate(() => {
    const warnPico = document.querySelector('.pstep.warn .pico, .pstep.warn-step .pico');
    const bypassIc = document.querySelector('.sug-ic.bypass');
    const hardIc = document.querySelector('.sug-ic.hard, .sug-ic.lock');
    if (!warnPico) return false;
    const y = (el) => {
      const bg = getComputedStyle(el).backgroundColor;
      const m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (!m) return false;
      const [, r, g, b] = m.map(Number);
      return r > 180 && g > 140 && b < 80;
    };
    return warnPico.textContent.trim() === '!' && y(warnPico) &&
      (!bypassIc || (bypassIc.textContent.trim() === '⊘' && y(bypassIc)));
  }));
  check('AI 结果列左靠不撑满', await page.evaluate(() => {
    const wrap = document.querySelector('.parse-ai');
    const panel = document.querySelector('.sug-panel');
    if (!wrap || !panel) return false;
    const ww = wrap.getBoundingClientRect().width;
    return ww <= 540 && panel.getBoundingClientRect().width <= ww + 1;
  }));
  check('仅总览行 sticky，五步行可滚动', await page.evaluate(() => {
    const bar = getComputedStyle(document.getElementById('parseBar'));
    const flow = getComputedStyle(document.getElementById('parseSticky'));
    return bar.position === 'sticky' && flow.position !== 'sticky';
  }));

  const sug = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('.sug-item')];
    return {
      n: rows.length,
      titles: rows.map(r => r.querySelector('.sug-name')?.textContent.trim()),
      hasAdopt: /全部采纳/.test(document.getElementById('sugPanel')?.innerText || '')
    };
  });
  check('字段建议至少 6 项', sug.n >= 6, JSON.stringify(sug.titles));
  check('面板含全部采纳', sug.hasAdopt);

  const status = await page.evaluate(() => {
    const steps = PARSE.steps.map(s => ({ id: s.id, st: s.st, sum: s.sum, icon: document.querySelector(`.pstep[data-id="${s.id}"] .pico`)?.textContent }));
    const bad = steps.filter(s => s.st === 'done' && /还差|分析中|待前置|核对中/.test(s.sum || ''));
    const head = document.querySelector('.plist-h .pcnt')?.textContent;
    const ids = steps.map(s => s.id);
    const u = steps.find(s => s.id === 'u');
    return {
      steps, bad, head, total: PARSE.steps.length, ids,
      hasSim: ids.includes('sim'),
      typePending: !PARSE.typeConfirmed && u?.sum === '待确认' && u?.st === 'warn',
      orderOk: ids.join(',').startsWith('u,p,f,sim') && ids.includes('v') && ids.includes('s')
    };
  });
  check('无 ✓ 配未完成文案', status.bad.length === 0, JSON.stringify(status.bad));
  check('头部计数分母=实际步骤数', status.head.includes('/' + status.total), status.head);
  check('基础 6 步或含拆分 7 步', status.total === 6 || status.total === 7, String(status.total));
  check('含相似 PCR 步骤', status.hasSim);
  check('步骤顺序含 u,p,f,sim', status.orderOk, status.ids.join(','));
  check('Type 未确认前待确认', status.typePending);
  check('含动态拆分步骤', status.steps.some(s => s.id === 'split'));

  // expand split
  await page.evaluate(() => { clickStep('split'); });
  const splitOpen = await page.evaluate(() => {
    const row = document.querySelector('.pstep[data-id="split"]');
    const body = row?.querySelector('.pstep-b')?.innerText || '';
    return {
      open: row?.classList.contains('open'),
      hasBasis: /判定依据/.test(body),
      hasActs: /拆分为两条/.test(body) && /不拆分/.test(body) && /稍后决定/.test(body)
    };
  });
  check('拆分步骤可展开', splitOpen.open && splitOpen.hasBasis && splitOpen.hasActs, JSON.stringify(splitOpen));

  await page.evaluate(() => decideSplit('split'));
  const afterSplit = await page.evaluate(() => {
    const sp = PARSE.steps.find(s => s.id === 'split');
    return { st: sp.st, sum: sp.sum };
  });
  check('拆分为两条后变 ✓', afterSplit.st === 'done' && /已拆分/.test(afterSplit.sum), JSON.stringify(afterSplit));

  // type confirm
  await page.evaluate(() => confirmType('Hardware/SBB'));
  check('确认 Type 后生效', await page.evaluate(() => PARSE.typeConfirmed && PARSE.pcrType === 'Hardware/SBB'));

  // must/suggest grouping
  await page.evaluate(() => { PARSE.steps.forEach(s => s.open = s.id === 'f'); renderPlist(); });
  const groups = await page.evaluate(() => {
    const f = document.querySelector('.pstep[data-id="f"] .pstep-b');
    const text = f?.innerText || '';
    const bars = f?.querySelectorAll('.pbar').length || 0;
    const sum = PARSE.steps.find(s => s.id === 'f')?.sum || '';
    const mustM = text.match(/必须补充\s*(\d+)\/(\d+)/);
    const sugM = text.match(/建议补充\s*(\d+)\/(\d+)/);
    return {
      hasMust: /必须项/.test(text),
      hasSug: /建议项/.test(text),
      bars,
      mustOk: mustM && mustM[1] === '2' && mustM[2] === '5',
      sugOk: sugM && Number(sugM[1]) >= 1 && Number(sugM[2]) >= 3,
      sumSpecific: /Geo|目标日|Business Case/.test(sum)
    };
  });
  check('必须/建议分组显示', groups.hasMust && groups.hasSug);
  check('双进度条', groups.bars >= 2, String(groups.bars));
  check('必须项计数 2/5', groups.mustOk);
  check('建议项有进度', groups.sugOk);
  check('摘要写明缺哪几项', groups.sumSpecific, status.steps.find(s => s.id === 'f')?.sum);

  // submit step s: no duplicate check
  await page.evaluate(() => { PARSE.steps.forEach(s => s.open = s.id === 's'); fillAllStepBodies(extractFields(PARSE.text)); renderPlist(); });
  check('提交验证无重复性检查', await page.evaluate(() => {
    const body = document.querySelector('.pstep[data-id="s"] .pstep-b')?.innerText || '';
    return !/重复性检查/.test(body) && /Type 合理性|必填字段完整性|逻辑一致性|拆分建议/.test(body);
  }));

  // sim step
  await page.evaluate(() => { clickStep('sim'); });
  check('相似 PCR 含 Duplicate+Similar', await page.evaluate(() => {
    const body = document.querySelector('.pstep[data-id="sim"] .pstep-b')?.innerText || '';
    return /Duplicate/.test(body) && /Similar|相似案例/.test(body) && /91%/.test(body) && /Return/.test(body);
  }));

  // stage1 dock
  const beforeSubmit = await page.evaluate(() => {
    const chat = document.getElementById('parseChat')?.innerText || '';
    const sticky = document.getElementById('parseSticky')?.innerText || '';
    return {
      inSticky: /提交至 PACE/.test(sticky),
      hasPaceSubmit: /提交至 PACE/.test(chat) && !!document.querySelector('#submitDock .btn-primary') &&
        [...document.querySelectorAll('#submitDock .btn-primary')].some(b => /提交至 PACE/.test(b.textContent)),
      hasFill: /一键填写/.test(chat),
      hasDraft: /保存草稿/.test(chat),
      dockHint: /完成必填项后可提交/.test(chat)
    };
  });
  check('必须项未齐时提交不在 sticky', !beforeSubmit.inSticky);
  check('阶段一显示一键填写与草稿', beforeSubmit.hasFill && beforeSubmit.hasDraft && beforeSubmit.dockHint && !beforeSubmit.hasPaceSubmit);

  // draft save
  await page.evaluate(() => saveDraft());
  check('草稿保存更新历史', await page.evaluate(() => {
    const meta = document.getElementById('parseHistMeta')?.textContent || '';
    return PARSE.draftSaved && /草稿/.test(meta) && /完成度/.test(meta);
  }));

  // resolve issues via API
  await page.evaluate(() => {
    resolveIssue('bc', 'adopt');
    resolveIssue('geo', 'ww');
    resolveIssue('target', 'ai');
    resolveIssue('nre', 'write');
  });

  const afterFix = await page.evaluate(() => {
    const f = PARSE.fields;
    const stepF = PARSE.steps.find(s => s.id === 'f');
    const dock = document.querySelector('#parseChat #submitDock');
    const paceBtn = dock && [...dock.querySelectorAll('.btn-primary')].find(b => /提交至 PACE/.test(b.textContent));
    return {
      mustOk: mustAllOk(),
      bc: f.bc.k, geo: f.geo.val, target: f.target.val,
      fSt: stepF.st, fSum: stepF.sum,
      hasDock: !!paceBtn,
      forceIsLink: !!(dock && dock.querySelector('.btn-force')),
      dockInChat: !!dock,
      dockInSticky: !!document.querySelector('#parseSticky #submitDock'),
      head: document.querySelector('.plist-h .pcnt')?.textContent
    };
  });
  check('操作后字段与清单同步', afterFix.mustOk && afterFix.bc === 'ok' && afterFix.geo === 'WW', JSON.stringify(afterFix));
  check('补全后步骤 3 变为 ✓ 结论摘要', afterFix.fSt === 'done' && !/还差/.test(afterFix.fSum), afterFix.fSum);
  check('提交按钮出现在对话区末尾', afterFix.hasDock && afterFix.dockInChat && !afterFix.dockInSticky);
  check('Force Submit 弱化为文字链', afterFix.forceIsLink);

  // Force Submit requires reason
  await page.evaluate(() => openPcrForce());
  await page.waitForSelector('#pcrForceReason');
  await page.click('[data-ok]');
  const blocked = await page.evaluate(() => document.getElementById('scrim').classList.contains('show') && !PARSE.forceReason);
  check('Force Submit 未填理由不可提交', blocked);
  await page.type('#pcrForceReason', '演示强制提交留痕');
  await page.click('[data-ok]');
  check('Force Submit 填理由后可提交', await page.evaluate(() => !!PARSE.forceReason && PARSE.submitted && PARSE.pcrId === 'SP20260904_0007'));

  // withdraw
  await page.evaluate(() => { PARSE.reviewStarted = false; openWithdraw(); });
  await page.waitForSelector('#withdrawReason');
  await page.click('[data-ok]');
  check('撤销未填原因不可确认', await page.evaluate(() => document.getElementById('scrim').classList.contains('show')));
  await page.type('#withdrawReason', '演示撤回');
  await page.click('[data-ok]');
  check('撤销成功回 Draft', await page.evaluate(() => !PARSE.submitted && PARSE.status === 'Draft'));

  // reopen parse for collapsed expand
  await page.evaluate(() => { startParse(DEMO_MAIL); skipParse(); confirmType('Hardware/SBB'); });
  await page.evaluate(() => {
    PARSE.steps.forEach(s => s.open = false);
    renderPlist();
    clickStep('u');
  });
  const reexpand = await page.evaluate(() => {
    const row = document.querySelector('.pstep[data-id="u"]');
    return row?.classList.contains('open') && !!row.querySelector('.prule');
  });
  check('收起步骤可点击重新展开', reexpand);

  // 左侧历史对话可返回提交 PCR 视图
  await page.evaluate(() => switchView('home'));
  const leftOverview = await page.evaluate(() => ({
    active: PARSE.active,
    suspended: PARSE.suspended,
    parsing: document.body.classList.contains('parsing'),
    hist: document.getElementById('parseHistItem').style.display !== 'none'
  }));
  check('点 Overview 后会话挂起且历史仍在', !leftOverview.active && leftOverview.suspended && !leftOverview.parsing && leftOverview.hist, JSON.stringify(leftOverview));
  await page.click('#parseHistItem');
  const resumed = await page.evaluate(() => ({
    active: PARSE.active,
    parsing: document.body.classList.contains('parsing'),
    homeHidden: getComputedStyle(document.getElementById('homeStack')).display === 'none',
    steps: document.querySelectorAll('#plist .pstep').length,
    sugs: document.querySelectorAll('.sug-item').length,
    user: !!document.querySelector('#parseUser .bub')
  }));
  check('点左侧进行中对话可回到提交 PCR', resumed.active && resumed.parsing && resumed.homeHidden && resumed.steps >= 6 && resumed.sugs >= 6 && resumed.user, JSON.stringify(resumed));

  await page.click('#parseBar');
  const backOv = await page.evaluate(() => ({
    active: PARSE.active,
    suspended: PARSE.suspended,
    parsing: document.body.classList.contains('parsing'),
    homeShown: getComputedStyle(document.getElementById('homeStack')).display !== 'none',
    hist: document.getElementById('parseHistItem').style.display !== 'none'
  }));
  check('点←总览条可返回总览页', !backOv.active && backOv.suspended && !backOv.parsing && backOv.homeShown && backOv.hist, JSON.stringify(backOv));
  await page.click('#parseHistItem');
  check('从总览再点历史可恢复', await page.evaluate(() => PARSE.active && document.body.classList.contains('parsing')));

  await page.evaluate(() => setMode('demo'));
  check('演示模式隐藏 TIP', await page.evaluate(() => [...document.querySelectorAll('.tipdot')].every(x => getComputedStyle(x).display === 'none')));
  await page.evaluate(() => setMode('discuss'));
  check('讨论模式显示 TIP', await page.evaluate(() => getComputedStyle(document.querySelector('.tipdot')).display !== 'none'));

  await page.click('.navitem[data-view="task"]');
  check('My Tasks 可切换', await page.evaluate(() => document.body.classList.contains('taskview')));
  check('My Tasks 仍可见进行中会话', await page.evaluate(() => {
    const hist = document.getElementById('parseHistItem');
    return document.body.classList.contains('has-parse-session') && hist && getComputedStyle(hist).display !== 'none';
  }));
  await page.evaluate(() => resumeParse());
  check('从 My Tasks 点回可恢复解析', await page.evaluate(() => PARSE.active && document.body.classList.contains('parsing') && !document.body.classList.contains('taskview')));
  await page.click('.navitem[data-view="home"]');

  // tip numbers 44+
  check('tipNum(sugPanel)=44', await page.evaluate(() => tipNum('sugPanel') === 44));
  check('tipNum(withdrawTip)=57', await page.evaluate(() => tipNum('withdrawTip') === 57));

} catch (e) {
  check('测试未抛异常', false, e.message);
} finally {
  await browser.close();
}
printSummary();

function printSummary() {
  const fail = results.filter(r => !r.pass);
  console.log('\n—— 修复验收汇总 ——');
  console.log(`通过 ${results.filter(r => r.pass).length} / ${results.length}，失败 ${fail.length}`);
  fail.forEach(f => console.log('  × ' + f.name + (f.detail ? ' | ' + f.detail : '')));
  if (fail.length) process.exitCode = 1;
}
