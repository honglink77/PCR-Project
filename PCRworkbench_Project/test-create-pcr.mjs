/**
 * 创建 PCR 修复验收（对照 创建PCR_问题修复提示词.md）
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
  await page.evaluate(() => { window.__DM_DISABLE = true; });

  const nav = await page.$$eval('.nav > .navitem', els => els.map(e => e.textContent.replace(/\s+/g, ' ').trim()));
  check('导航两项', nav.length === 2 && nav[0].includes('Overview') && nav[1].includes('My Tasks'));

  await page.evaluate(() => { startParse(DEMO_MAIL); skipParse(); });
  await page.waitForFunction(() => document.body.classList.contains('parsing') && document.querySelector('.tl-item'));

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
      /正在从描述|已将本次识别|产品匹配到|建议：/.test(b.innerText) && !b.querySelector('.iss-card')
    ).length;
    return { kids, userText: userText.slice(0, 40), hasIssues: !!document.querySelector('.iss-card'), processBubbles };
  });
  check('对话顺序：用户原文 → 清单 → AI结论', order.kids[0] === 'parseUser' && order.kids[1] === 'parseSticky' && order.kids[2] === 'parseChat');
  check('用户原文在顶部', /Hi team|Per confirmed/.test(order.userText));
  check('无过程性重复气泡', order.processBubbles === 0, String(order.processBubbles));
  check('AI 为时间线简约样式', await page.evaluate(() => {
    return !!document.querySelector('.parse-sep') && !!document.querySelector('.tl') &&
      document.querySelectorAll('.tl-item').length === 4 && !!document.querySelector('.tl-expandall') &&
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
    const warnDot = document.querySelector('.tl-item.warn .tl-dot');
    const errDot = document.querySelector('.tl-item.err .tl-dot');
    if (!warnPico || !warnDot || !errDot) return false;
    const y = (el) => {
      const bg = getComputedStyle(el).backgroundColor;
      const m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (!m) return false;
      const [, r, g, b] = m.map(Number);
      return r > 180 && g > 140 && b < 80; // 黄色系
    };
    const red = (el) => {
      const bg = getComputedStyle(el).backgroundColor;
      const m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (!m) return false;
      const [, r, g, b] = m.map(Number);
      return r > 150 && g < 100 && b < 80;
    };
    return warnPico.textContent.trim() === '!' && warnDot.textContent.trim() === '!' &&
      y(warnPico) && y(warnDot) && red(errDot) && errDot.textContent.trim() === '✗';
  }));
  check('AI 结果列左靠不撑满', await page.evaluate(() => {
    const wrap = document.querySelector('.parse-ai');
    const h = document.querySelector('.tl-item .tl-h');
    if (!wrap || !h) return false;
    const ww = wrap.getBoundingClientRect().width;
    const hw = h.getBoundingClientRect().width;
    const t = h.querySelector('.tl-t');
    const c = h.querySelector('.tl-chev');
    if (!t || !c) return false;
    const gap = c.getBoundingClientRect().left - t.getBoundingClientRect().right;
    return ww <= 540 && hw < ww * 0.92 && gap >= 4 && gap <= 36;
  }));
  check('仅总览行 sticky，五步行可滚动', await page.evaluate(() => {
    const bar = getComputedStyle(document.getElementById('parseBar'));
    const flow = getComputedStyle(document.getElementById('parseSticky'));
    return bar.position === 'sticky' && flow.position !== 'sticky';
  }));

  const issues = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('.tl-item')];
    return {
      n: rows.length,
      titles: rows.map(r => r.querySelector('.tl-t')?.textContent.trim()),
      hasBtns: rows.every(r => r.querySelectorAll('.iact button').length >= 1)
    };
  });
  check('四个真实问题独立条目', issues.n === 4, JSON.stringify(issues.titles));
  check('每条含操作按钮', issues.hasBtns);

  const status = await page.evaluate(() => {
    const steps = PARSE.steps.map(s => ({ id: s.id, st: s.st, sum: s.sum, icon: document.querySelector(`.pstep[data-id="${s.id}"] .pico`)?.textContent }));
    const bad = steps.filter(s => s.st === 'done' && /还差|分析中|待前置|核对中/.test(s.sum || ''));
    const spinningWithDone = steps.filter(s => s.st === 'run' && /提交至 PACE|可提交/.test(s.sum || ''));
    const head = document.querySelector('.plist-h .pcnt')?.textContent;
    return { steps, bad, spinningWithDone, head, total: PARSE.steps.length };
  });
  check('无 ✓ 配未完成文案', status.bad.length === 0, JSON.stringify(status.bad));
  check('头部计数分母=实际步骤数', status.head.includes('/' + status.total), status.head);
  check('含动态拆分步骤', status.steps.some(s => s.id === 'split'));

  // A2: PCR Type 推荐与确认
  const typePending = await page.evaluate(() => {
    const u = PARSE.steps.find(s => s.id === 'u');
    const icon = document.querySelector('.pstep[data-id="u"] .pico')?.textContent.trim();
    clickStep('u');
    const body = document.querySelector('.pstep[data-id="u"] .pstep-b')?.innerText || '';
    const opts = document.querySelectorAll('.pstep[data-id="u"] .type-opt').length;
    return {
      st: u.st, sum: u.sum, icon, opts,
      hasPre: /预选的类型/.test(body) && /未预选/.test(body),
      hasWarn: /加载对应模板并重新执行校验/.test(body),
      hasConfirm: /确认为/.test(body),
      hasOther: /选择其他类型/.test(body),
      hasBasis: /依据：/.test(body),
      hasConf: /置信度/.test(body),
      tipKeys: ['pcrTypeConfirm','pcrTypeCandidates','pcrTypeRerun'].every(k => !!TIPS_HOME[k]),
      tipNums: ['pcrTypeConfirm','pcrTypeCandidates','pcrTypeRerun'].map(k => tipNum(k))
    };
  });
  check('Type 确认前为 ◇ 待确认', typePending.st === 'pending' && typePending.sum === '待确认' && typePending.icon === '◇', JSON.stringify(typePending));
  check('Type 至少 2 候选+依据+置信度', typePending.opts >= 2 && typePending.hasBasis && typePending.hasConf, JSON.stringify(typePending));
  check('Type 含预选对照与切换预警', typePending.hasPre && typePending.hasWarn && typePending.hasConfirm && typePending.hasOther);
  check('TIP 44–46 存在且编号正确', typePending.tipKeys && typePending.tipNums.join(',') === '44,45,46', JSON.stringify(typePending.tipNums));

  const afterType = await page.evaluate(() => {
    confirmPcrType('Hardware/SBB');
    const u = PARSE.steps.find(s => s.id === 'u');
    const icon = document.querySelector('.pstep[data-id="u"] .pico')?.textContent.trim();
    const body = document.querySelector('.pstep[data-id="u"] .pstep-b')?.innerText || '';
    const v = PARSE.steps.find(s => s.id === 'v');
    return {
      confirmed: PARSE.typeConfirmed, type: PARSE.pcrType,
      st: u.st, sum: u.sum, icon,
      hasMap: /保留 \d+ 个可映射字段/.test(body) && /不兼容/.test(body),
      vText: v?.body || ''
    };
  });
  check('确认后 Type 为 ✓ 并显示名称', afterType.confirmed && afterType.st === 'done' && afterType.sum === 'Hardware/SBB' && afterType.icon === '✓', JSON.stringify(afterType));
  check('确认后提示模板切换影响', afterType.hasMap);
  check('确认后可行性随 Type 重算', /已检索 3 条参考/.test(afterType.vText) && /18 天/.test(afterType.vText), afterType.vText.slice(0, 120));

  await page.evaluate(() => { toggleTypeMapDetail(); });
  check('查看详情可展开字段映射', await page.evaluate(() => /字段映射详情/.test(document.querySelector('.pstep[data-id="u"] .pstep-b')?.innerText || '')));

  await page.evaluate(() => confirmPcrType('Cost Reduction'));
  check('切换 Cost Reduction 后下游重算', await page.evaluate(() => {
    const v = PARSE.steps.find(s => s.id === 'v');
    const sim = PARSE.steps.find(s => s.id === 'sim');
    return PARSE.pcrType === 'Cost Reduction' && PARSE.simCases.length === 5 &&
      /已检索 5 条参考/.test(v.body) && /12 天/.test(v.body) && /找到 5 条参考/.test(sim.sum);
  }));

  await page.evaluate(() => openTypePicker());
  check('选择其他类型弹出完整列表', await page.evaluate(() => {
    const txt = document.getElementById('modalHost')?.innerText || '';
    return /Hardware\/SBB/.test(txt) && /Software/.test(txt) && /Cost Reduction/.test(txt) && /Certification/.test(txt);
  }));
  await page.evaluate(() => closeModal());
  await page.evaluate(() => confirmPcrType('Hardware/SBB')); // 恢复默认 Type 便于后续用例

  // A3: 相似 PCR 检查
  const simStep = await page.evaluate(() => {
    const ids = PARSE.steps.map(s => s.id);
    const sm = PARSE.steps.find(s => s.id === 'sim');
    const fIdx = ids.indexOf('f');
    const simIdx = ids.indexOf('sim');
    const vIdx = ids.indexOf('v');
    clickStep('sim');
    const body = document.querySelector('.pstep[data-id="sim"] .pstep-b')?.innerText || '';
    const icon = document.querySelector('.pstep[data-id="sim"] .pico')?.textContent.trim();
    const sBody = PARSE.steps.find(s => s.id === 's')?.body || '';
    return {
      ids, st: sm.st, sum: sm.sum, icon, n: PARSE.simCases.length,
      orderOk: fIdx >= 0 && simIdx === fIdx + 1 + (ids[fIdx + 1] === 'split' ? 1 : 0) && vIdx > simIdx,
      hasDupSec: /重复性检查/.test(body) && /检索范围/.test(body),
      hasSimSec: /相似案例参考/.test(body),
      hasReturn: /曾被 Return/.test(body) && /退回原因/.test(body) && /建议本次/.test(body),
      hasRefs: /Comment 参考/.test(body) && /Cost 参考/.test(body) && /Assessment/.test(body),
      hasNote: /Closed 不等于方案成功/.test(body),
      hasActs: /查看完整对比/.test(body) && /确认已参考/.test(body),
      noDupInSubmit: !/<b>重复性检查<\/b>/.test(sBody) && !/未发现相同在途 PCR/.test(sBody),
      submitHasLogic: /字段间逻辑一致性/.test(sBody) && /拆分建议确认状态/.test(sBody),
      tipNums: ['pcrSimDupVsSim','pcrSimReturn','pcrSimClosed'].map(k => tipNum(k))
    };
  });
  check('相似 PCR 为独立步骤且位于补全之后', simStep.orderOk && simStep.ids.includes('sim'), JSON.stringify(simStep.ids));
  check('基础步骤含 sim 且头部按实际步数计数', await page.evaluate(() => {
    const total = PARSE.steps.length;
    const head = document.querySelector('.plist-h .pcnt')?.textContent || '';
    return total >= 6 && head.includes('/' + total) && PARSE.steps.some(s => s.id === 'sim');
  }));
  check('相似步骤未确认前为 ◇', simStep.st === 'pending' && simStep.icon === '◇' && simStep.n === 3, JSON.stringify({st:simStep.st,icon:simStep.icon,n:simStep.n,sum:simStep.sum}));
  check('相似步骤分 Duplicate/Similar 两块', simStep.hasDupSec && simStep.hasSimSec);
  check('Return 案例含事实原因建议', simStep.hasReturn);
  check('可参考内容入口齐全', simStep.hasRefs);
  check('可比性提示与确认动作', simStep.hasNote && simStep.hasActs);
  check('提交验证已去掉重复性检查', simStep.noDupInSubmit && simStep.submitHasLogic);
  check('TIP 47–49 编号正确', simStep.tipNums.join(',') === '47,48,49', JSON.stringify(simStep.tipNums));

  await page.evaluate(() => toggleSimRef('SP20250612_0031', 'comment'));
  check('Comment 参考可就地展开', await page.evaluate(() => /LM 要求补充认证矩阵/.test(document.querySelector('.pstep[data-id="sim"] .pstep-b')?.innerText || '')));
  await page.evaluate(() => toggleSimCompare());
  check('查看完整对比可展开', await page.evaluate(() => !!document.querySelector('.sim-cmp table')));
  await page.evaluate(() => confirmSimRef());
  check('确认已参考后变 ✓', await page.evaluate(() => {
    const sm = PARSE.steps.find(s => s.id === 'sim');
    const icon = document.querySelector('.pstep[data-id="sim"] .pico')?.textContent.trim();
    return PARSE.simConfirmed && sm.st === 'done' && /已参考 3 条/.test(sm.sum) && icon === '✓';
  }));

  await page.evaluate(() => { setSimDuplicate(true); });
  check('发现完全重复时硬阻断 ✗', await page.evaluate(() => {
    const sm = PARSE.steps.find(s => s.id === 'sim');
    const body = document.querySelector('.pstep[data-id="sim"] .pstep-b')?.innerText || '';
    const icon = document.querySelector('.pstep[data-id="sim"] .pico')?.textContent.trim();
    return sm.st === 'err' && icon === '✗' && /硬阻断/.test(body) && /SP20260812_0044/.test(body);
  }));
  await page.evaluate(() => { setSimDuplicate(false); confirmSimRef(); });

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

  // must/suggest grouping
  await page.evaluate(() => { PARSE.steps.forEach(s => s.open = s.id === 'f'); renderPlist(); });
  const groups = await page.evaluate(() => {
    const f = document.querySelector('.pstep[data-id="f"] .pstep-b');
    const text = f?.innerText || '';
    const bars = f?.querySelectorAll('.pbar').length || 0;
    const sum = PARSE.steps.find(s => s.id === 'f')?.sum || '';
    return {
      hasMust: /必须项/.test(text),
      hasSug: /建议项/.test(text),
      bars,
      count: /必须补充\s*2\/5/.test(text) && /建议补充\s*1\/3/.test(text),
      sumSpecific: /Geo|目标日|Business Case/.test(sum)
    };
  });
  check('必须/建议分组显示', groups.hasMust && groups.hasSug);
  check('双进度条', groups.bars >= 2, String(groups.bars));
  check('必须项计数 2/5、建议 1/3', groups.count);
  check('摘要写明缺哪几项', groups.sumSpecific, status.steps.find(s => s.id === 'f')?.sum);

  // submit not in sticky before must ok
  const beforeSubmit = await page.evaluate(() => {
    const sticky = document.getElementById('parseSticky')?.innerText || '';
    return {
      inSticky: /提交至 PACE|Force Submit/.test(sticky),
      inChat: !!document.querySelector('#submitDock .btn-primary'),
      dockHint: /必须项全部通过后/.test(document.getElementById('parseChat').innerText)
    };
  });
  check('必须项未齐时提交不在 sticky', !beforeSubmit.inSticky);
  check('必须项未齐时无提交按钮提示', !beforeSubmit.inChat && beforeSubmit.dockHint);

  // resolve issues via API (same as UI handlers)
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
    return {
      mustOk: mustAllOk(),
      bc: f.bc.k, geo: f.geo.val, target: f.target.val,
      fSt: stepF.st, fSum: stepF.sum,
      hasDock: !!(dock && dock.querySelector('.btn-primary')),
      forceIsLink: !!(dock && dock.querySelector('.btn-force')),
      dockInChat: !!dock,
      dockInSticky: !!document.querySelector('#parseSticky #submitDock'),
      head: document.querySelector('.plist-h .pcnt')?.textContent
    };
  });
  check('操作后字段与清单同步', afterFix.mustOk && afterFix.bc === 'ok' && afterFix.geo === 'WW', JSON.stringify(afterFix));
  check('补全后步骤 3 变为 ✓ 结论摘要', afterFix.fSt === 'done' && !/还差/.test(afterFix.fSum), afterFix.fSum);
  check('提交区在对话末尾且主按钮为一键填写', await page.evaluate(() => {
    const dock = document.querySelector('#parseChat #submitDock');
    const primary = dock?.querySelector('.btn-primary');
    return !!(dock && primary && /一键填写/.test(primary.textContent) &&
      /存草稿/.test(dock.innerText) && dock.querySelector('.btn-force') &&
      !/提交至 PACE/.test([...dock.querySelectorAll('.pact .btn')].map(b => b.textContent).join('|')));
  }));
  check('Force Submit 弱化为文字链', afterFix.forceIsLink);

  // 一键填写弹窗
  await page.evaluate(() => openFillModal());
  const fillUi = await page.evaluate(() => {
    const m = document.querySelector('.fill-modal');
    const txt = m?.innerText || '';
    return {
      open: !!m && document.getElementById('scrim').classList.contains('show'),
      hasBasic: /基础信息/.test(txt) && /PCR Number/.test(txt),
      hasCr: /Change Request/.test(txt) && /背景/.test(txt) && /变更原因/.test(txt) && /变更请求/.test(txt) && /影响说明/.test(txt),
      hasOther: /其他信息/.test(txt) && /Geo Impact/.test(txt),
      hasBtns: /存草稿/.test(txt) && /提交至 PACE/.test(txt) && /修改并提交/.test(txt),
      crStyled: !!document.querySelector('.fill-cr')
    };
  });
  check('一键填写弹窗结构完整', fillUi.open && fillUi.hasBasic && fillUi.hasCr && fillUi.hasOther && fillUi.hasBtns && fillUi.crStyled, JSON.stringify(fillUi));
  check('弹窗标题为 Confirm Content 且无横向溢出', await page.evaluate(() => {
    const m = document.querySelector('.fill-modal');
    const b = m?.querySelector('.fm-b');
    if (!m || !b) return false;
    const titleOk = /Confirm Content/.test(m.querySelector('h3')?.textContent || '');
    const noHScroll = b.scrollWidth <= b.clientWidth + 1;
    return titleOk && noHScroll;
  }));

  await page.evaluate(() => {
    document.querySelector('.fill-modal [data-edit]')?.click();
  });
  check('修改并提交进入可编辑态', await page.evaluate(() => {
    const m = document.querySelector('.fill-modal');
    return PARSE.fillEditing && !!m?.querySelector('textarea[data-f="bg"]') &&
      /取消修改/.test(m.innerText) && /保存并提交/.test(m.innerText);
  }));
  await page.evaluate(() => {
    document.querySelector('.fill-modal [data-cancel-edit]')?.click();
  });
  check('取消修改退回只读预览', await page.evaluate(() => !PARSE.fillEditing && !!document.querySelector('.fill-modal [data-submit]')));

  await page.evaluate(() => submitFromFill(false));
  const afterSubmit = await page.evaluate(() => {
    const dock = document.getElementById('submitDock');
    const hist = document.getElementById('parseHistItem')?.innerText || '';
    return {
      submitted: PARSE.submitted,
      parsing: document.body.classList.contains('parsing'),
      hasDone: /已提交至 PACE/.test(dock?.innerText || ''),
      hasWithdraw: /撤销提交/.test(dock?.innerText || ''),
      histOk: /已提交/.test(hist)
    };
  });
  check('提交后底部显示状态且可撤销', afterSubmit.submitted && afterSubmit.parsing && afterSubmit.hasDone && afterSubmit.hasWithdraw && afterSubmit.histOk, JSON.stringify(afterSubmit));

  await page.evaluate(() => openWithdrawModal());
  check('撤销原因未填时确认禁用', await page.evaluate(() => {
    const ok = document.querySelector('#modalHost [data-ok]');
    return ok && ok.disabled;
  }));
  await page.type('#withdrawReason', '演示撤回');
  await page.click('#modalHost [data-ok]');
  check('撤销后恢复按钮区', await page.evaluate(() => {
    const dock = document.getElementById('submitDock');
    return !PARSE.submitted && /一键填写/.test(dock?.innerText || '') && /已撤回/.test(document.getElementById('parseHistItem')?.innerText || '');
  }));

  // Force Submit requires reason
  await page.evaluate(() => openPcrForce());
  await page.waitForSelector('#pcrForceReason');
  await page.click('[data-ok]');
  const blocked = await page.evaluate(() => document.getElementById('scrim').classList.contains('show') && !PARSE.forceReason);
  check('Force Submit 未填理由不可提交', blocked);
  await page.type('#pcrForceReason', '演示强制提交留痕');
  await page.click('[data-ok]');
  check('Force Submit 填理由后可提交', await page.evaluate(() => !!PARSE.forceReason && !document.body.classList.contains('parsing')));

  // reopen parse for collapsed expand
  await page.evaluate(() => { startParse(DEMO_MAIL); skipParse(); });
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
    issues: document.querySelectorAll('.tl-item').length,
    user: !!document.querySelector('#parseUser .bub')
  }));
  check('点左侧进行中对话可回到提交 PCR', resumed.active && resumed.parsing && resumed.homeHidden && resumed.steps >= 6 && resumed.issues === 4 && resumed.user, JSON.stringify(resumed));

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

  // ── 顶部栏会话操作（对照 顶部栏会话操作_提示词）──
  const sess = await page.evaluate(() => {
    const chip = document.getElementById('sesschip');
    const caret = document.getElementById('sessCaret');
    const title = document.getElementById('sessTitle');
    const wrap = document.getElementById('sesswrap');
    const afterLogo = chip && chip.closest('.topbar') &&
      [...document.querySelector('.topbar').children].findIndex(x => x.id === 'sesswrap') >
      [...document.querySelector('.topbar').children].findIndex(x => x.classList.contains('logo'));
    const beforeSel = chip && [...document.querySelector('.topbar').children].findIndex(x => x.id === 'sesswrap') <
      [...document.querySelector('.topbar').querySelectorAll('.sel')].map(s =>
        [...document.querySelector('.topbar').children].indexOf(s.parentElement || s)
      )[0];
    // simpler position: sesswrap appears before .sp
    const kids = [...document.querySelector('.topbar').children].map(el => el.id || el.className || el.tagName);
    const iSess = kids.findIndex(k => String(k).includes('sesswrap'));
    const iSp = kids.findIndex(k => k === 'sp' || String(k).split(/\s+/).includes('sp'));
    const iSel = [...document.querySelector('.topbar').children].findIndex(el => el.classList?.contains('sel'));
    return {
      hasChip: !!chip,
      empty: chip.classList.contains('empty'),
      title: title?.textContent,
      caretHidden: !!caret?.hidden,
      posOk: iSess >= 0 && iSp >= 0 && iSp < iSess && (iSel < 0 || iSess < iSel),
      tips: !!(window.TIPS_HOME && TIPS_HOME.sessTop && TIPS_HOME.sessTask && TIPS_HOME.sessDone),
      tipDots: [...document.querySelectorAll('.tipdot')].some(t => t.textContent.trim() === '50')
    };
  });
  check('顶栏有当前会话区域且靠右紧挨筛选器', sess.hasChip && sess.posOk);
  // 当前仍在解析会话中
  check('有会话时显示标题与下拉箭头', await page.evaluate(() => {
    const chip = document.getElementById('sesschip');
    return !chip.classList.contains('empty') && !document.getElementById('sessCaret').hidden &&
      /CPU SKU|解析/.test(document.getElementById('sessTitle').textContent);
  }));
  check('TIP 50–52 已写入', sess.tips && sess.tipDots);

  await page.evaluate(() => {
    document.getElementById('sesschip').click();
  });
  check('会话菜单含 Pin/Rename/Delete', await page.evaluate(() => {
    const m = document.getElementById('sessmenu');
    const t = m?.innerText || '';
    return !m.hidden && /Pin/.test(t) && /Rename/.test(t) && /Delete/.test(t);
  }));
  await page.evaluate(() => Sessions.closeMenu());

  await page.evaluate(() => newChatSession());
  check('New Chat 后顶栏回到新会话占位', await page.evaluate(() => {
    const chip = document.getElementById('sesschip');
    return chip.classList.contains('empty') && document.getElementById('sessTitle').textContent === '新会话' &&
      document.getElementById('sessCaret').hidden;
  }));
  check('占位无下拉箭头', await page.evaluate(() => document.getElementById('sessCaret').hidden));

  await page.click('.navitem[data-view="task"]');
  check('My Tasks 仍有会话芯片', await page.evaluate(() => !!document.getElementById('sesschip')));
  await page.evaluate(() => {
    state.t1.done = true;
    cur = 't1';
    renderTaskAll();
  });
  check('任务完成后会话标记已完成且只读', await page.evaluate(() => {
    const s = Sessions.byId('task-t1');
    const body = document.getElementById('centerBody')?.innerText || '';
    return s && s.status === 'done' && /已完成|只读/.test(body) && !/确认并写回/.test(body);
  }));
  await page.evaluate(() => {
    Sessions.upsert({ id: 'ask-pin', kind: 'ask', title: '钉住测试会话', meta: '刚刚', group: 'today', pinned: false });
    Sessions.setCurrent('ask-pin');
    Sessions.items.find(x => x.id === 'ask-pin').pinned = true;
    Sessions.renderHist();
  });
  check('Pin 后左栏置顶显示标记', await page.evaluate(() => {
    const first = document.querySelector('#overview-rail-hist .hitem');
    return first && first.dataset.sid === 'ask-pin' && !!first.querySelector('.pinmark');
  }));

  // My Tasks 中间区对话化
  await page.click('.navitem[data-view="task"]');
  await page.evaluate(() => {
    state.t1.done = false;
    state.t1.chat = [];
    state.t1.comment = null;
    state.t1.vote = null;
    cur = 't1';
    if (window.MyTasks) MyTasks.ensureInit();
    renderTaskAll();
  });
  const taskUi = await page.evaluate(() => {
    const bar = document.querySelector('.task-bar .tb-t');
    const askHome = document.getElementById('askbox');
    const askTask = document.getElementById('taskAskbox');
    const action = document.getElementById('actionbar');
    const dock = document.querySelector('#centerBody .submit-dock');
    const force = document.querySelector('#centerBody .btn-force');
    const primary = document.querySelector('#centerBody .btn-primary');
    const thread = document.getElementById('taskThread');
    const sameAsk = askHome && askTask &&
      getComputedStyle(askHome).borderRadius === getComputedStyle(askTask).borderRadius &&
      getComputedStyle(askHome.querySelector('.plusbtn')).backgroundColor === getComputedStyle(askTask.querySelector('.plusbtn')).backgroundColor;
    return {
      narrowBar: !!bar && /VOTE|EVAL|OTM|REVIEW|WORK/i.test(bar.textContent) && !/目标实施日/.test(document.getElementById('centerHead').innerText),
      noActionbar: !action || getComputedStyle(action).display === 'none',
      dockInChat: !!dock && !!primary,
      forceLink: !!force && getComputedStyle(force).textDecorationLine.includes('underline'),
      hasTaskAsk: !!document.getElementById('taskAskin'),
      sameAsk,
      hasThread: !!thread,
      tips: !!(TIPS_TASK.taskChat && TIPS_TASK.askOne && TIPS_TASK.flowVsSess)
    };
  });
  check('任务标题收为窄条', taskUi.narrowBar);
  check('无底部固定动作条', taskUi.noActionbar);
  check('动作按钮在对话内容中', taskUi.dockInChat, JSON.stringify(taskUi));
  check('Force Submit 为文字链', taskUi.forceLink);
  check('任务区有共用样式输入框', taskUi.hasTaskAsk && taskUi.sameAsk);
  check('TIP 53+ 任务对话说明存在', taskUi.tips);
  await page.evaluate(() => {
    const inp = document.getElementById('taskAskin');
    inp.value = '把 Comment 改得更严谨一点';
    sendTaskAsk();
  });
  check('追问可更新 Comment 草稿', await page.evaluate(() => {
    const s = state[cur];
    return /建议 Agree|验证范围/.test(s.comment || '') && (s.chat || []).some(m => m.role === 'user');
  }));

  // ── 批量任务合并处理 ──
  await page.evaluate(() => { if (typeof exitBatchMode === 'function') exitBatchMode(); batchDismissed = false; });
  await page.evaluate(() => switchView('home'));
  check('Overview 批量 Vote 标签可点', await page.evaluate(() => {
    const tag = document.getElementById('batchVoteTag');
    return !!tag && /批量 Vote 4/.test(tag.textContent) && tag.classList.contains('batch');
  }));
  check('批量提示未进首页 AI 判断三件事', await page.evaluate(() => {
    const brief = document.querySelector('.brief, .ai-brief, .home-brief') || document.querySelector('.scroll');
    const txt = document.body.innerText;
    const inJudgment = [...document.querySelectorAll('.bt,.ai-line,.brief')].some(el =>
      /批量 Vote|合并处理|Cost Vote/.test(el.textContent || '')
    );
    return !inJudgment;
  }));
  await page.evaluate(() => openBatchVote());
  await page.waitForFunction(() => !!document.querySelector('.batch-card'));
  check('Overview 点击批量 Vote 直达批量视图', await page.evaluate(() =>
    batchMode && VIEW === 'task' && !!document.querySelector('.batch-card') &&
    /批量处理 · 4 条 Cost Vote/.test(document.getElementById('centerHead')?.innerText || '')
  ));
  check('AI 说明可合并与不可合并', await page.evaluate(() => {
    const txt = document.getElementById('centerBody')?.innerText || '';
    return /CPU SKU|同封装/.test(txt) && /DDR5|单独处理/.test(txt);
  }));
  check('第 4 条默认不勾选且标注单独处理', await page.evaluate(() => {
    const chk = document.querySelector('[data-bchk="bv4"]');
    const row = document.querySelector('tr[data-bid="bv4"]');
    return chk && !chk.checked && /建议单独处理/.test(row?.innerText || '') &&
      batchState.selected.bv1 && batchState.selected.bv2 && batchState.selected.bv3;
  }));
  check('已选数量 3/4', await page.evaluate(() => /已选 3 \/ 4/.test(document.querySelector('.bc-sel')?.textContent || '')));
  check('规则示例标注存在', await page.evaluate(() =>
    /原型阶段规则示例/.test(document.querySelector('.bc-rule')?.textContent || '')
  ));
  check('底部有逐条处理入口', await page.evaluate(() => !!document.getElementById('batchToSingle')));
  check('TIP 58–61 存在', await page.evaluate(() =>
    !!(TIPS_TASK.batchJudge && TIPS_TASK.batchIndep && TIPS_TASK.batchExit && TIPS_TASK.batchVsRisk)
  ));

  await page.evaluate(() => {
    document.querySelector('[data-bvote="bv1"]').value = 'ni';
    document.querySelector('[data-bvote="bv1"]').dispatchEvent(new Event('change'));
  });
  check('人工改立场有「已修改」标记', await page.evaluate(() =>
    batchState.edited.bv1 && /已修改/.test(document.querySelector('tr[data-bid="bv1"]')?.innerText || '')
  ));

  await page.click('#batchSubmit');
  await page.waitForFunction(() => document.querySelector('.batch-result'));
  check('提交显示逐条结果', await page.evaluate(() => {
    const rows = [...document.querySelectorAll('.br-row')];
    return rows.length === 3 && rows.some(r => r.classList.contains('ok')) && rows.some(r => r.classList.contains('fail'));
  }));
  check('失败行可重试且保留输入', await page.evaluate(() => {
    const fail = batchState.results.find(r => !r.ok);
    return fail && fail.id === 'bv3' && !!document.querySelector('[data-bretry="bv3"]') &&
      !!batchState.comments.bv3;
  }));
  await page.click('[data-bretry="bv3"]');
  check('单行重试成功', await page.evaluate(() => batchState.results.every(r => r.ok)));

  await page.click('#batchToSingle');
  check('可退回逐条模式', await page.evaluate(() => !batchMode && !document.querySelector('.batch-card')));

  await page.evaluate(() => { batchDismissed = false; switchView('task'); });
  await page.waitForFunction(() => document.getElementById('batchSuggest') && !document.getElementById('batchSuggest').hidden);
  check('My Tasks 左侧有 AI 批量建议', await page.evaluate(() => {
    const el = document.getElementById('batchSuggest');
    return el && /Cost Vote|合并处理|CPU SKU/.test(el.innerText);
  }));
  await page.click('#batchIgnoreBtn');
  check('忽略后本次会话不再提示', await page.evaluate(() =>
    batchDismissed && document.getElementById('batchSuggest')?.hidden
  ));

  // ── Approval History Tab ──
  await page.evaluate(() => {
    if (typeof exitBatchMode === 'function') exitBatchMode();
    reviewMode = null;
    cur = 't4';
    ctxTab = 'detail';
    switchView('task');
    renderTaskAll();
  });
  check('右侧有 Approval History Tab', await page.evaluate(() =>
    [...document.querySelectorAll('.ctx-tab')].some(t => t.dataset.t === 'approval' && /Approval History/.test(t.textContent))
  ));
  check('中间 AI 有未解决问题提醒', await page.evaluate(() =>
    !!document.querySelector('.ah-alert') && /认证影响|尚未/.test(document.querySelector('.ah-alert')?.innerText || '')
  ));
  await page.click('[data-ahgo]');
  check('查看审批历史可切 Tab 并定位', await page.evaluate(() =>
    ctxTab === 'approval' && !!document.querySelector('.ah-tl') &&
    !!document.querySelector('[data-ahstep="tpm"]')
  ));
  check('时间线含 Return/跳过/进行中/未开始', await page.evaluate(() => {
    const txt = document.getElementById('ctxBody')?.innerText || '';
    return /Return|重新提交|已跳过|Sponsor|进行中|Benefit Tracking|Vote \/ Evaluation/.test(txt);
  }));
  check('竖线样式存在', await page.evaluate(() =>
    !!document.querySelector('.ah-line.solid') && !!document.querySelector('.ah-line.dash')
  ));
  check('未解决标记在右侧', await page.evaluate(() =>
    /问题尚未解决|认证影响/.test(document.querySelector('.ah-issue')?.innerText || document.getElementById('ctxBody')?.innerText || '')
  ));
  check('当前环节标注（你）', await page.evaluate(() =>
    /（你）/.test(document.querySelector('[data-ahstep="otm_assess"]')?.innerText || '')
  ));
  await page.evaluate(() => {
    const btn = document.querySelector('[data-ahtoggle="tpm"]');
    if (btn) btn.click();
  });
  check('Comment 可展开', await page.evaluate(() => !!ahExpanded.tpm));
  await page.click('[data-ahvotes]');
  check('Vote 分组可展开且 Disagree 突出', await page.evaluate(() =>
    ahVoteOpen && !!document.querySelector('.ah-vrow.dis')
  ));
  check('TIP 62–65 存在', await page.evaluate(() =>
    !!(TIPS_TASK.ahSplit && TIPS_TASK.ahConcern && TIPS_TASK.ahSkip && TIPS_TASK.ahReturn)
  ));
  await page.evaluate(() => {
    cur = 't1';
    renderTaskAll();
    ctxTab = 'approval';
    renderCtx();
  });
  check('同 PCR 切换任务时（你）移到 Vote', await page.evaluate(() =>
    /（你）/.test(document.querySelector('[data-ahstep="votes"]')?.innerText || '') &&
    !/（你）/.test(document.querySelector('[data-ahstep="otm_assess"]')?.innerText || '')
  ));
  await page.evaluate(() => {
    cur = 't4';
    ctxTab = 'approval';
    renderTaskAll();
  });
  await page.evaluate(() => {
    const el = document.querySelector('[data-ahjump="tScr"]');
    if (el) el.click();
  });
  check('本人环节可回看只读', await page.evaluate(() =>
    cur === 'tScr' && !!reviewMode && /回看/.test(document.getElementById('centerHead')?.innerText || '') &&
    !!document.querySelector('.sd-done')
  ));

  // ── DialogueMotion ──
  await page.evaluate(() => { window.__DM_DISABLE = false; });
  check('DialogueMotion 通用模块存在', await page.evaluate(() =>
    !!(window.DialogueMotion && DialogueMotion.playAssistant && DialogueMotion.streamText && DialogueMotion.skip)
  ));
  check('TIP 66–69 对话动画说明存在', await page.evaluate(() =>
    !!(TIPS_TASK.dmStream && TIPS_TASK.dmWarnLast && TIPS_TASK.dmScroll && TIPS_TASK.dmSkip)
  ));
  await page.evaluate(() => {
    reviewMode = null;
    cur = 't1';
    state.t1.done = false;
    state.t1.chat = [];
    switchView('task');
    renderTaskAll();
  });
  await page.evaluate(async () => {
    const inp = document.getElementById('taskAskin');
    inp.value = '历史上同类换代有没有出过 BIOS 兼容问题';
    sendTaskAsk();
    await new Promise(r => setTimeout(r, 220));
  });
  check('发送后出现思考三点（无文字）', await page.evaluate(() => {
    const think = document.querySelector('.dm-think');
    return !!think && !!think.querySelector('.dm-dots') && !/正在思考/.test(think.innerText || '');
  }));
  await page.evaluate(async () => {
    DialogueMotion.skip();
    await new Promise(r => setTimeout(r, 500));
  });
  check('点击跳过后完整呈现', await page.evaluate(() => {
    const turn = document.querySelector('.dm-ai-turn .txt');
    const txt = turn?.textContent || '';
    return !!turn && /G12|BIOS|Similar|案例/.test(txt) && !document.querySelector('.dm-think');
  }));
  check('追问状态已写入 chat', await page.evaluate(() =>
    (state.t1.chat || []).some(m => m.role === 'user') && (state.t1.chat || []).some(m => m.role === 'ai')
  ));
  await page.evaluate(() => { window.__DM_DISABLE = true; });

  // ── HomePins 钉到首页 ──
  await page.evaluate(() => { switchView('home'); window.__DM_DISABLE = true; });
  check('HomePins 模块存在', await page.evaluate(() =>
    !!(window.HomePins && HomePins.pin && HomePins.runAnalysis && HomePins.PIN_MAX === 4)
  ));
  check('首页「我钉住的」有 3 张演示卡片', await page.evaluate(() => {
    const sec = document.getElementById('homePinsSection');
    return !sec.hidden && document.querySelectorAll('#homePinsGrid .hp-card').length === 3;
  }));
  check('左栏 Pinned 可点击且为图钉图标', await page.evaluate(() => {
    const list = document.querySelectorAll('#overview-rail-pinned .pitem');
    const pinSvg = document.querySelector('#overview-rail-pinned .pin-ico');
    return list.length === 3 && !!pinSvg;
  }));
  check('卡片含实时与快照标注', await page.evaluate(() => {
    const t = document.getElementById('homePinsSection')?.innerText || '';
    return /实时/.test(t) && /快照/.test(t) && /3 \/ 4/.test(t);
  }));
  check('TIP 70–73 存在', await page.evaluate(() =>
    !!(TIPS_HOME.pinCustom && TIPS_HOME.pinVsHist && TIPS_HOME.pinLive && TIPS_HOME.pinLimit)
  ));
  await page.evaluate(() => {
    HomePins.unpin('m90q-cost');
  });
  check('取消钉住后首页与左栏同步', await page.evaluate(() =>
    document.querySelectorAll('#homePinsGrid .hp-card').length === 2 &&
    document.querySelectorAll('#overview-rail-pinned .pitem').length === 2 &&
    !HomePins.isPinned('m90q-cost')
  ));
  await page.evaluate(async () => {
    await HomePins.runAnalysis('M90q 二供成本对比');
  });
  check('分析对话出现钉到首页按钮', await page.evaluate(() => {
    const btn = document.querySelector('#homeAnalysis [data-pinid="m90q-cost"]');
    return !!btn && /钉到首页/.test(btn.textContent || '');
  }));
  await page.evaluate(() => {
    HomePins.pin('m90q-cost');
    HomePins.pin('cert-backlog');
  });
  check('可钉满至上限 4', await page.evaluate(() =>
    HomePins.pins.length === 4 && /4 \/ 4/.test(document.getElementById('homePinsCount')?.textContent || '')
  ));
  check('达上限再钉弹出替换框', await page.evaluate(() => {
    HomePins.CATALOG['tmp-fifth'] = {
      id: 'tmp-fifth', title: '临时第五', live: true, query: '临时', keywords: [],
      rowsHtml: () => '', insight: '', full: '',
    };
    HomePins.pin('tmp-fifth');
    const ok = /已达钉住上限/.test(document.querySelector('#modalHost .modal')?.innerText || '');
    delete HomePins.CATALOG['tmp-fifth'];
    document.getElementById('scrim')?.classList.remove('show');
    document.getElementById('modalHost').innerHTML = '';
    return ok;
  }));

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
