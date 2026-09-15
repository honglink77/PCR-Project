/* Vote Task v2：全新独立实现（前缀 vt2_ / VoteV2），不改现有 voteCards */
(function () {
  const VT2_ID = 'vt2';
  const VT2_RULE_FOOT = '⚠ 原型阶段规则示例，实际规则待业务确认';
  const VT2_TIP = (k, n) => `<span class="tipdot" onclick="showTip(event,'${k}',${n})">${n}</span>`;
  const vt2Dm = () => window.DialogueMotion;

  const VT2_COMMENT = `【HW Impact】
Board & Power: 同封装 pin-to-pin 替代，主板布局与供电无需改动，PCBA 数量不变。
Thermal: TDP 保持 15W，散热方案沿用现有方案，无需更新风扇曲线。

【SW / BIOS Impact】
需新增 microcode 0x12A 支持，BIOS 发布需与 C/P 对齐（约 3 周）。

【Control Run】
（待补充）

【Validation Plan】
计划验证散热与 BIOS 兼容性，目标在 C/P 后 4 周完成。`;

  const VT2_COMMENT_V1 = `【HW Impact】
同封装替代，主板无改动。

【SW / BIOS Impact】
需评估 BIOS 影响。

【Control Run】
（待补充）

【Validation Plan】
计划验证散热。`;

  const VT2_PARAS = [
    { title: '【HW Impact】', body: 'Board & Power: 同封装 pin-to-pin 替代，主板布局与供电无需改动，PCBA 数量不变。\nThermal: TDP 保持 15W，散热方案沿用现有方案，无需更新风扇曲线。' },
    { title: '【SW / BIOS Impact】', body: '需新增 microcode 0x12A 支持，BIOS 发布需与 C/P 对齐（约 3 周）。' },
    { title: '【Control Run】', body: '（待补充）', pause: true },
    { title: '【Validation Plan】', body: '计划验证散热与 BIOS 兼容性，目标在 C/P 后 4 周完成。' },
  ];

  const VT2_FILL = {
    bios2: { para: 'sw', text: '2 个已认证 MTM 受影响，需评估重新送测范围。', ids: ['bios2'] },
    cr1: { para: 'cr', text: '本次变更需执行 Control Run。计划 50pcs 于 MFG 产线执行，BIOS 就绪后 2 周内完成。', ids: ['cr1', 'cr2'] },
    cr2: { para: 'cr', text: '本次变更需执行 Control Run。计划 50pcs 于 MFG 产线执行，BIOS 就绪后 2 周内完成。', ids: ['cr1', 'cr2'] },
    vp2: { para: 'vp', text: '样机 20pcs，来源 ODM。', ids: ['vp2'] },
  };

  const VT2_GROUPS = [
    { id: 'bp', title: 'HW Impact · Board & Power', ids: ['bp1', 'bp2'] },
    { id: 'th', title: 'HW Impact · Thermal & Acoustics', ids: ['th1', 'th2'] },
    { id: 'bios', title: 'SW / BIOS Impact · BIOS & Microcode', ids: ['bios1', 'bios2', 'bios3'] },
    { id: 'vp', title: 'Validation Plan', ids: ['vp1', 'vp2', 'vp3'] },
    { id: 'cr', title: 'Control Run', ids: ['cr1', 'cr2'] },
  ];
  const VT2_META = {
    bp1: { ok: true }, bp2: { ok: true }, th1: { ok: true }, th2: { ok: true },
    bios1: { ok: true }, bios2: { ok: false, gap: '未说明对已认证 MTM 的影响', fill: 'bios2' }, bios3: { ok: true },
    vp1: { ok: true }, vp2: { ok: false, gap: '未给出样机数量与来源', fill: 'vp2' }, vp3: { ok: true },
    cr1: { ok: false, gap: '未确认是否需要 Control Run', fill: 'cr1' },
    cr2: { ok: false, gap: '未说明 Run 范围与排期', fill: 'cr2' },
  };
  const VT2_ANIM = ['bp1', 'bp2', 'th1', 'th2', 'bios1', 'bios2', 'bios3', 'vp1', 'vp2', 'vp3', 'cr1', 'cr2'];

  const VT2_SIMS = [
    { pcr: 'SP-2025-11880', n: 'T14p Gen5 CPU SKU Root PCR', s: '96%', c: '100%', match: 'Root / Branch', kind: 'root', tag: 'Root', excerpt: 'Board & Power: 同封装替代；Control Run 50pcs 已执行。', low: false },
    { pcr: 'CP-2024-09815', n: 'T14s CPU 换代', s: '81%', c: '45%', match: 'Commodity 一致', kind: 'commodity', excerpt: '仅写了 BIOS 待评估。', low: true },
    { pcr: 'SP-2025-03340', n: 'T 系列 U 系列 CPU 换代', s: '78%', c: '85%', match: 'LLM 语义匹配', kind: 'llm', excerpt: 'Thermal 无影响，BIOS 需新 microcode。', low: false },
  ];

  const VT2_WI_SEED = [
    { id: 'vt2_w1', name: 'Control Run', desc: '执行 Control Run 验证，50pcs 于 MFG 产线', date: 'PCR approved 后 3 周', dateMode: 'rel', ft: 'Development', owner: 'test@lenovo.com', src: '【Control Run】', status: 'Draft', ai: true },
    { id: 'vt2_w2', name: 'SW / BIOS Impact', desc: 'BIOS microcode 0x12A 兼容性验证', date: '2026-10-25', dateMode: 'abs', ft: 'Development', owner: 'test29@lenovo.com', src: '【SW / BIOS Impact】', status: 'Draft', ai: true },
    { id: 'vt2_w3', name: 'SW / BIOS Impact', desc: '已认证 MTM 重新送测影响评估', date: '2026-10-30', dateMode: 'abs', ft: 'Development', owner: 'yac@lenovo.com', src: '【SW / BIOS Impact】', status: 'Draft', ai: true },
  ];

  const VT2_INFO = {
    vote: { t: '步骤 ① · 选择投票结果', b: '投票结果是第一步，决定后续分支。Agree 进入维度化 Comment、校验与 Work Item；Disagree / No Impact 为简化路径（填理由后提交）。AI 不预选、不代投。' },
    comment: { t: '步骤 ② · 生成 Comments', b: '按 ThinkPad_Commercial × Hardware/SBB_CPU × Development 维度模板生成富文本草稿。维度是内容要求，不是多个输入框。模板更新只影响新建 PCR。' },
    comp: { t: 'Comments 完整性检查', b: '按维度模板检查点计分（已覆盖 / 总检查点）。必填 Dimension 未完成时本步为橙色警告，仅在提交 Agree 时硬阻断。可在本步「让 AI 补写」。' },
    missing: { t: 'Missing Points Check', b: '按维度模板列出缺失信息点。可返回修改 Comments，或 Ignore 后继续。缺失点不硬阻断提交。' },
    cr: { t: 'Control Run Validation', b: '根据 PCR Type 与 Change Request 判断是否需要 Control Run，再核对 Comments 结论是否一致。不匹配只展示，不自动阻断。' },
    review: { t: '查看检查结果', b: '四行总览：必填维度、缺失点、Control Run、完整度。点「继续」后才进入 Work Item。' },
    wi: { t: '确认 Comments 并生成 Work Item', b: '校验后由用户确认 Comment，才一次生成多条草稿。Work Item 名称取产生 Required Action 的上级 Dimension。草稿只提交 OTM，不直接创建。' },
    reason: { t: '步骤 ② · 填写理由', b: 'Disagree / No Impact 不做维度化。延伸设计：仍校验理由完整性，避免只有反对结果没有依据。待业务确认是否采纳。' },
    submit: { t: '提交 Vote Task', b: 'Agree 先查必填维度，再查三项是否已执行。Force Submit 必填理由，并明示将出现在 OTM 汇总异常区。' },
  };

  function vt2Esc(t) {
    return String(t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  }

  function vt2Default() {
    return {
      vote: null, reason: '',
      comment: VT2_COMMENT, covered: { bp1: true, bp2: true, th1: true, th2: true, bios1: true, bios2: false, bios3: true, vp1: true, vp2: false, vp3: true, cr1: false, cr2: false },
      mode: 'similar', ver: 2,
      hist: [
        { v: 1, at: '11-12 14:30', text: VT2_COMMENT_V1, pct: 50, n: 6 },
        { v: 2, at: '当前', text: VT2_COMMENT, pct: 67, n: 8 },
      ],
      showDiff: false, diffA: 1, diffB: 2,
      ignoreMissing: false, missingDone: false, crDone: false, reviewed: false,
      commentReady: false, checkReady: false, compReady: false, commentDirty: false,
      wiOpen: false, wis: [], wiDirty: false, confirmedText: '', editWi: null, wiFold: {},
      forceNote: '', openId: 'vote', playedIntro: false,
      simOpen: true, rootOpen: true,
    };
  }

  function vt2St() {
    const s = state[VT2_ID];
    if (!s.vt2) s.vt2 = vt2Default();
    if (s.vt2.compReady == null) s.vt2.compReady = !!s.vt2.checkReady;
    if (!s.vt2.wiFold) s.vt2.wiFold = {};
    return s.vt2;
  }
  function vt2Order() {
    return vt2IsDis() ? ['vote', 'reason', 'submit'] : ['vote', 'comment', 'comp', 'missing', 'cr', 'review', 'wi', 'submit'];
  }

  function vt2CoveredN(map) { return Object.keys(VT2_META).filter((k) => map[k]).length; }
  function vt2Pct(map) { return Math.round((vt2CoveredN(map) / 12) * 100); }
  function vt2ReqMiss(map) {
    const m = [];
    if (!map.cr1 || !map.cr2) m.push('Control Run');
    if (!map.vp1 || !map.vp2 || !map.vp3) m.push('Validation Plan');
    return m;
  }
  function vt2Gaps(map) { return Object.keys(VT2_META).filter((k) => !map[k]); }
  function vt2CrBad(map) { return !(map.cr1 && map.cr2); }
  function vt2HasCheckIssues(map) {
    const m = map || vt2St().covered;
    if (vt2ReqMiss(m).length) return true;
    if (vt2CrBad(m)) return true;
    if (vt2Gaps(m).length && !vt2St().ignoreMissing) return true;
    return false;
  }
  function vt2CheckSum(map) {
    const m = map || vt2St().covered;
    const parts = [];
    const req = vt2ReqMiss(m);
    if (req.length) parts.push(req.length + ' 项必填未完成');
    if (vt2CrBad(m)) parts.push('Control Run 不匹配');
    const g = vt2Gaps(m);
    if (g.length && !vt2St().ignoreMissing) parts.push(g.length + ' 个缺失点');
    return parts.join('、') || '有未通过项';
  }
  function vt2DraftTag() {
    const st = vt2St();
    const done = !!(typeof state !== 'undefined' && state[VT2_ID] && state[VT2_ID].done);
    if (done) return `<span class="to-conf hi">✓ 已提交 · v${st.ver}</span>`;
    return `<span class="to-conf mid">● AI 草稿 · 未提交 · v${st.ver}</span>`;
  }
  function vt2Cmt() {
    const s = state[VT2_ID];
    return (s.comment != null && s.comment !== '') ? s.comment : vt2St().comment;
  }
  function vt2IsDis() { const v = vt2St().vote; return v === 'dis' || v === 'ni'; }
  function vt2VoteLabel() { return { agree: 'Agree', dis: 'Disagree', ni: 'No Impact' }[vt2St().vote] || ''; }

  function vt2ChangeText() {
    return (typeof PCR_CR_DETAIL !== 'undefined' && PCR_CR_DETAIL) || (window.PCR_CR_DETAIL || '');
  }
  function vt2EnsureTask() {
    if (typeof TASKS === 'undefined') return;
    const change = vt2ChangeText();
    if (TASKS[VT2_ID]) {
      if (change) TASKS[VT2_ID].change = change;
      return;
    }
    TASKS[VT2_ID] = {
      type: 'vote', tt: 'VOTE', voteV2: true,
      ttl: 'CPU SKU 替换 · Development Vote',
      pcr: 'SP-2026-13077', status: 'Under_Assessment',
      product: 'ThinkPad T14p Gen 5 / T14p Gen 5 AMD',
      func: 'Development', mandatory: true, critical: false,
      due: '2026-11-20', late: false,
      change,
      name: 'T14p Gen5 CPU SKU Replacement (Ultra 7 155U → 165U)',
      geo: 'WW', date: '2026-11-20', stage: 'Assessment', progress: 42, risk: 'mid',
      pcrType: 'Hardware/SBB_CPU', category: 'ThinkPad_Commercial',
      impact: 'ThinkPad T14p Gen 5、T14p Gen 5 AMD',
    };
    if (typeof ORDER !== 'undefined' && !ORDER.includes(VT2_ID)) ORDER.push(VT2_ID);
    if (typeof state !== 'undefined' && !state[VT2_ID]) {
      state[VT2_ID] = { vote: null, path: null, done: false, chat: [], comment: VT2_COMMENT, vt2: vt2Default() };
    }
    if (typeof SIM !== 'undefined') {
      SIM[VT2_ID] = VT2_SIMS.map((x) => ({ pcr: x.pcr, n: x.n, s: x.s, m: [x.match, 'Development', '完整度 ' + x.c] }));
    }
    if (typeof EVI !== 'undefined') {
      EVI[VT2_ID] = [
        { t: '维度模板：ThinkPad_Commercial × Hardware/SBB_CPU × Development，12 个检查点。', s: '规则库 · Vote 维度模板（示例）' },
        { t: 'Hardware/SBB_CPU 类变更需执行 Control Run。', s: '示例校验规则' },
        { t: '相似 Root PCR SP-2025-11880 同一 Function Team Development Comment。', s: 'Historical Case' },
      ];
    }
    if (typeof APPROVAL_HISTORY !== 'undefined' && !APPROVAL_HISTORY['SP-2026-13077']) {
      APPROVAL_HISTORY['SP-2026-13077'] = {
        pcr: 'SP-2026-13077', simulated: true,
        steps: [
          { id: 'submit', title: 'Submit', status: 'done', actor: 'test@lenovo.com', time: '09-01 10:12' },
          { id: 'lm', title: 'Line Manager Review', status: 'done', action: 'Approve', actor: 'test29@lenovo.com', time: '09-02 15:40', duration: '1 天', comment: '同意进入 Assessment，请 Development 按 Hardware/SBB_CPU 完成 Vote。' },
          { id: 'vote', title: 'Function Vote · Development', status: 'current', actor: 'JC', time: '进行中', note: 'Under_Assessment' },
        ],
      };
    }
  }

  let vt2Playing = false;
  let vt2Gen = 0;
  let vt2Debounce = 0;

  function vt2Model() {
    const st = vt2St();
    const defs = vt2IsDis()
      ? [
        { id: 'vote', title: '选择投票结果', info: 'vote' },
        { id: 'reason', title: '填写理由', info: 'reason' },
        { id: 'submit', title: '提交 Vote Task', info: 'submit' },
      ]
      : [
        { id: 'vote', title: '选择投票结果', info: 'vote' },
        { id: 'comment', title: '生成 Comments', info: 'comment' },
        { id: 'comp', title: 'Comments 完整性检查', info: 'comp' },
        { id: 'missing', title: 'Missing Points Check', info: 'missing' },
        { id: 'cr', title: 'Control Run Validation', info: 'cr' },
        { id: 'review', title: '查看检查结果', info: 'review' },
        { id: 'wi', title: '确认 Comments 并生成 Work Item', info: 'wi' },
        { id: 'submit', title: '提交 Vote Task', info: 'submit' },
      ];
    const cur = vt2CurrentId();
    return defs.map((d) => {
      const stt = vt2StepState(d.id, cur);
      return { ...d, st: stt.st, sum: stt.sum, open: st.openId === d.id };
    });
  }

  function vt2CurrentId() {
    const st = vt2St();
    if (!st.vote) return 'vote';
    if (vt2IsDis()) {
      if (!String(st.reason || '').trim()) return 'reason';
      return 'submit';
    }
    if (!st.commentReady) return 'comment';
    if (!st.compReady) return 'comp';
    if (!st.missingDone) return 'missing';
    if (!st.crDone) return 'cr';
    if (!st.reviewed) return 'review';
    if (!st.wiOpen) return 'wi';
    return 'submit';
  }

  function vt2StepState(id, cur) {
    const st = vt2St();
    const order = vt2Order();
    const idx = order.indexOf(id);
    const curIdx = order.indexOf(cur);
    const req = vt2ReqMiss(st.covered);
    const mp = vt2Gaps(st.covered);
    const crBad = vt2CrBad(st.covered);
    if (id === 'comp' && st.compReady && req.length) {
      return { st: 'warn', sum: req.length + ' 项必填未完成' };
    }
    if (id === 'missing' && st.missingDone && mp.length && !st.ignoreMissing) {
      return { st: 'warn', sum: mp.length + ' 个缺失点' };
    }
    if (id === 'cr' && st.crDone && crBad) {
      return { st: 'warn', sum: '不匹配' };
    }
    const done = {
      vote: !!st.vote,
      reason: !!(st.reason && st.reason.trim()),
      comment: !!st.commentReady,
      comp: !!st.compReady && !req.length,
      missing: !!st.missingDone && (!mp.length || !!st.ignoreMissing),
      cr: !!st.crDone && !crBad,
      review: !!st.reviewed,
      wi: !!st.wiOpen,
      submit: !!state[VT2_ID].done,
    };
    if (done[id] || (id === 'submit' && state[VT2_ID].done)) {
      let sum = '已完成';
      if (id === 'vote') sum = vt2VoteLabel();
      if (id === 'reason') sum = '已填写理由';
      if (id === 'comment') sum = '已生成草稿';
      if (id === 'comp') sum = vt2Pct(st.covered) + '%';
      if (id === 'missing') sum = st.ignoreMissing && mp.length ? '已 Ignore' : '无缺失点';
      if (id === 'cr') sum = '已匹配';
      if (id === 'review') sum = '已查看';
      if (id === 'wi') sum = st.wis.filter((w) => !w.draftNew).length ? st.wis.filter((w) => !w.draftNew).length + ' 条草稿' : '已确认';
      return { st: 'done', sum };
    }
    if (id === 'submit' && !state[VT2_ID].done && idx <= curIdx) {
      return { st: 'pending', sum: '待提交' };
    }
    if (idx > curIdx) return { st: 'wait', sum: '待前置完成' };
    if (id === 'vote' || id === 'review' || id === 'wi') return { st: 'pending', sum: '待确认' };
    if (id === 'reason') return { st: 'run', sum: '还差理由说明' };
    if (id === 'comp') return { st: 'run', sum: '检查中' };
    if (id === 'missing') return { st: 'run', sum: '检查中' };
    if (id === 'cr') return { st: 'run', sum: '校验中' };
    return { st: 'run', sum: '进行中' };
  }

  function vt2RuleBox(title, items) {
    return `<div class="prule"><div class="prule-t">${title}</div><ul>${items.map((x) => `<li>${x}</li>`).join('')}</ul></div><div class="rule-note">${VT2_RULE_FOOT}</div>`;
  }

  function vt2CompHtml(map, revealed) {
    const ids = revealed != null ? VT2_ANIM.slice(0, revealed) : VT2_ANIM;
    const showN = ids.filter((k) => map[k]).length;
    const pct = Math.round((showN / 12) * 100);
    let rows = '';
    VT2_GROUPS.forEach((g) => {
      if (revealed != null && g.ids.every((id) => VT2_ANIM.indexOf(id) >= revealed)) return;
      const shown = revealed != null ? g.ids.filter((id) => VT2_ANIM.indexOf(id) < revealed) : g.ids;
      const ok = shown.filter((id) => map[id]).length;
      const cls = ok === g.ids.length ? 'ok' : ok === 0 ? 'bad' : 'part';
      const ic = cls === 'ok' ? '✓' : cls === 'bad' ? '✗' : '◐';
      rows += `<div class="pcheck ${cls === 'ok' ? 'ok' : cls === 'bad' ? 'err' : 'warn'} in" data-vt2-g="${g.id}"><span class="ck">${ic}</span><div><b>${g.title}</b>　${ok}/${g.ids.length}</div></div>`;
      shown.forEach((id) => {
        const m = VT2_META[id];
        if (!m.gap || map[id]) return;
        rows += `<div class="pcheck err in vt2-gap"><span class="ck">✗</span><div><b>${m.gap}</b>　<button type="button" class="btn btn-ghost" style="padding:2px 8px;font-size:12px" data-vt2-fill="${m.fill}">让 AI 补写</button></div></div>`;
      });
    });
    return `<div id="vt2_comp">
      <div class="pfill"><span>完整度检查结果　${showN}/12 检查点 ${VT2_TIP('vt2Dim', 78)}</span><span class="vt2-pfill-r"><span class="pbar"><i id="vt2_bar" style="width:${pct}%"></i></span><span id="vt2_pct">${pct}%</span></span></div>
      <div id="vt2_cklist">${rows}</div>
    </div>`;
  }

  function vt2ReqHtml(map) {
    const req = vt2ReqMiss(map);
    const ok = !req.length;
    return `<div class="pcheck ${ok ? 'ok' : 'err'} in"><span class="ck">${ok ? '✓' : '✗'}</span><div><b>Required Dimension</b>　${ok ? '✓ 已覆盖' : '✗ ' + req.length + ' 项未填'}<div style="margin-top:4px;line-height:1.55;color:var(--ink-2)">${ok ? '必填维度已覆盖' : req.join('、') + '。⚠ 提交 Agree 时硬阻断；Disagree / No Impact 不限'}</div></div></div>`;
  }
  function vt2MissingHtml(map, running) {
    const mp = vt2Gaps(map);
    if (running) return `<div class="pcheck run in"><span class="ck">◐</span><div><b>Missing Points Check</b>　检查中…</div></div>`;
    if (!mp.length) return `<div class="pcheck ok in"><span class="ck">✓</span><div><b>Missing Points Check</b>　✓ 通过<div style="margin-top:4px;line-height:1.55;color:var(--ink-2)">无缺失点</div></div></div>`;
    const gaps = mp.map((id) => `<div class="pcheck err in vt2-gap"><span class="ck">✗</span><div><b>${VT2_META[id].gap}</b></div></div>`).join('');
    return `<div class="pcheck warn in"><span class="ck">⚠</span><div><b>Missing Points Check</b>　⚠ ${mp.length} 个缺失<div style="margin-top:4px;line-height:1.55;color:var(--ink-2)">可返回修改 Comments，或 Ignore 后继续。</div></div></div>${gaps}
      <div class="pact"><button class="btn btn-ghost" type="button" data-vt2="backedit">返回修改</button> <button class="btn btn-ghost" type="button" data-vt2="ignore">${vt2St().ignoreMissing ? '已 Ignore' : 'Ignore 并继续'}</button></div>`;
  }
  function vt2CrHtml(map, running) {
    const cr = vt2CrBad(map);
    if (running) return `<div class="pcheck run in"><span class="ck">◐</span><div><b>Control Run Validation</b>　检查中…</div></div>`;
    return `<div class="pcheck ${cr ? 'err' : 'ok'} in"><span class="ck">${cr ? '✗' : '✓'}</span><div><b>Control Run Validation</b>　${cr ? '✗ 不匹配' : '✓ 匹配'}<div style="margin-top:4px;line-height:1.55;color:var(--ink-2)"><span id="vt2_crtxt">${cr ? '规则判定：Hardware/SBB_CPU 类变更需执行 Control Run。Comment 中未给出结论。不匹配项：Control Run 结论缺失。' : 'Comment 已给出 Control Run 结论，与规则匹配。'}</span></div></div></div>`;
  }

  function vt2SimHtml() {
    const st = vt2St();
    const root = VT2_SIMS.filter((x) => x.kind === 'root');
    const rest = VT2_SIMS.filter((x) => x.kind !== 'root');
    const card = (x) => {
      const pct = String(x.s).replace(/%$/, '');
      return `<div class="sim-card">
      <div class="sc-top"><span class="sc-id">● ${x.pcr}</span><span class="sc-pct">相似度 ${pct}%</span></div>
      <div class="sc-name">${x.n}</div>
      <div class="sc-meta">${x.tag ? x.tag + '　·　' : ''}匹配依据：${x.match}　·　完整度 ${x.c}　·　Development</div>
      <div class="sc-like">「${x.excerpt}」</div>
      ${x.low ? `<div class="sim-ret">⚠ 该 Comment 完整度较低，参考价值有限</div>` : ''}
      <div class="sim-refs"><span class="sr-lab">可参考内容：</span><button type="button" class="btn btn-ghost" style="padding:2px 8px;font-size:12px" data-vt2-ref="${x.pcr}">参考此 Comment</button></div>
    </div>`;
    };
    return vt2RuleBox('相似 PCR 的检索规则', [
      '候选范围：同 Product Category + 状态为 Under Implementation / Pending / Closed + 近 12 个月',
      '匹配顺序：Root/Branch 优先 → PN 匹配 → Commodity 匹配 → LLM 语义匹配',
      '只取同一 Function Team（Development）的 Comment',
      '输出：Top 3，按相似度降序',
    ]) + `<div class="sim-box">
      <div class="sim-sec">
        <button type="button" class="sim-sec-h" data-vt2="toggleroot">Root / Branch PCR</button>
        <div id="vt2_rootfold" class="vt2-sim-body${st.rootOpen ? ' open' : ''}">${root.map(card).join('')}</div>
      </div>
      <div class="sim-sec">
        <button type="button" class="sim-sec-h" data-vt2="togglesim">相似案例参考</button>
        <div id="vt2_simfold" class="vt2-sim-body${st.simOpen ? ' open' : ''}">${rest.map(card).join('')}</div>
      </div>
    </div>`;
  }

  function vt2WiCard(w) {
    const st = vt2St();
    const editing = st.editWi === w.id || w.draftNew;
    if (editing) {
      const canSave = !!(w.name && w.desc && w.date && w.owner);
      return `<div class="vt2-wi" data-vt2-wid="${w.id}">
        <div class="vt2-row"><span class="k">Work Item</span><input data-vt2-f="name" placeholder="请输入" value="${vt2Esc(w.name)}"></div>
        <div class="vt2-row"><span class="k">Description</span><textarea data-vt2-f="desc" rows="2" placeholder="请输入">${vt2Esc(w.desc)}</textarea></div>
        <div class="vt2-row vt2-date-row"><span class="k">Target Date</span>
          <div class="vt2-date-line">
            <input data-vt2-f="date" placeholder="请选择或输入" value="${vt2Esc(w.date)}">
            <label><input type="radio" name="vt2_dm_${w.id}" value="abs" ${w.dateMode === 'abs' ? 'checked' : ''}> Absolute Date</label>
            <label><input type="radio" name="vt2_dm_${w.id}" value="rel" ${w.dateMode === 'rel' ? 'checked' : ''}> Relative Date</label>
          </div>
        </div>
        <div class="vt2-row"><span class="k">Function Team</span><select data-vt2-f="ft"><option>Development</option><option>TPM</option><option>Certification</option></select></div>
        <div class="vt2-row"><span class="k">Task Owner</span><select data-vt2-f="owner"><option value="">请选择</option><option>test@lenovo.com</option><option>test29@lenovo.com</option><option>yac@lenovo.com</option></select></div>
        <div class="vt2-src">来源：${w.draftNew || w.src === '手动添加' ? '手动添加' : 'Comment ' + vt2Esc(w.src) + ' 维度'}</div>
        <div class="type-acts"><button class="btn btn-ghost" type="button" data-vt2-wix="${w.id}">取消</button><button class="btn btn-primary" type="button" data-vt2-wis="${w.id}" ${canSave ? '' : 'disabled'}>保存</button></div>
      </div>`;
    }
    return `<div class="vt2-wi" data-vt2-wid="${w.id}">
      <div class="ops"><button type="button" data-vt2-wie="${w.id}" title="编辑">✎</button><button type="button" data-vt2-widl="${w.id}">✕</button></div>
      <div class="vt2-row"><span class="k">Work Item</span><span>${vt2Esc(w.name)}</span></div>
      <div class="vt2-row"><span class="k">Description</span><span>${vt2Esc(w.desc)}</span></div>
      <div class="vt2-row"><span class="k">Target Date</span><span>${vt2Esc(w.date)}（${w.dateMode === 'rel' ? 'Relative Date' : 'Absolute Date'}）</span></div>
      <div class="vt2-row"><span class="k">Function Team</span><span>${vt2Esc(w.ft)}</span></div>
      <div class="vt2-row"><span class="k">Task Owner</span><span>${vt2Esc(w.owner)}</span></div>
      <div class="vt2-src">来源：Comment ${vt2Esc(w.src)} 维度</div>
    </div>`;
  }

  function vt2SrcLine(w) {
    return (w.draftNew || w.src === '手动添加') ? '手动添加' : 'Comment ' + vt2Esc(w.src) + ' 维度';
  }
  function vt2WiDateCell(w) {
    if (w.dateMode === 'rel') {
      return `${vt2Esc(w.date || '—')}<span class="vt2-di" title="相对时间">ⓘ</span>`;
    }
    return vt2Esc(w.date || '—');
  }
  function vt2WiOps(w) {
    return `<div class="vt2-ops-wrap">
      <button type="button" class="vt2-ico" data-vt2-wie="${w.id}" title="编辑">✎</button>
      <button type="button" class="vt2-ico" data-vt2-widl="${w.id}" title="删除">✕</button>
    </div>`;
  }
  function vt2WiTable() {
    const st = vt2St();
    return `<table class="sumtab vt2-witab"><thead><tr>
      <th></th><th>Work Item</th><th>Description</th><th>Target Date</th><th>Function Team</th><th>Task Owner</th><th>Status</th><th>操作</th>
    </tr></thead><tbody>${st.wis.map((w) => {
      if (st.editWi === w.id || w.draftNew) {
        return `<tr class="bc-detail" data-vt2-wid="${w.id}"><td colspan="8">${vt2WiCard(w)}</td></tr>`;
      }
      const open = !!st.wiFold[w.id];
      const desc = w.desc && String(w.desc).trim() ? vt2Esc(w.desc) : '—（未填写）';
      return `<tr data-vt2-bwi="${w.id}">
        <td class="vt2-exp" data-vt2-bexp="${w.id}">${open ? '▾' : '▸'}</td>
        <td><span class="vt2-gen">${w.ai === false ? '✍️' : '🤖'}</span> ${vt2Esc(w.name)}</td>
        <td>${desc}</td>
        <td>${vt2WiDateCell(w)}</td>
        <td>${vt2Esc(w.ft)}</td>
        <td>${vt2Esc(w.owner)}</td>
        <td>${vt2Esc(w.status || 'Draft')}</td>
        <td class="vt2-ops-cell">${vt2WiOps(w)}</td>
      </tr>${open ? `<tr class="bc-detail"><td colspan="8"><div class="vt2-src" style="border:none;margin:0;padding:0">来源：${vt2SrcLine(w)}</div></td></tr>` : ''}`;
    }).join('')}</tbody></table>`;
  }

  function vt2Body(id) {
    const st = vt2St();
    const s = state[VT2_ID];
    const map = st.covered;
    if (id === 'vote') {
      const on = (k) => st.vote === k ? ' on' : '';
      const radio = (k) => st.vote === k ? '●' : '○';
      return `<div class="type-box">
        <div class="vt2-vote-row">
          <button type="button" class="type-opt agree${on('agree')}" data-vt2-vote="agree">
            <span class="to-radio">${radio('agree')}</span>
            <span class="to-main"><span class="to-row"><span class="to-name">Agree</span></span><div class="to-basis">同意变更</div></span>
          </button>
          <button type="button" class="type-opt dis${on('dis')}" data-vt2-vote="dis">
            <span class="to-radio">${radio('dis')}</span>
            <span class="to-main"><span class="to-row"><span class="to-name">Disagree</span></span><div class="to-basis">存在阻碍</div></span>
          </button>
          <button type="button" class="type-opt ni${on('ni')}" data-vt2-vote="ni">
            <span class="to-radio">${radio('ni')}</span>
            <span class="to-main"><span class="to-row"><span class="to-name">No Impact</span></span><div class="to-basis">无影响</div></span>
          </button>
        </div>
        <div class="type-warn">⚠ 仅支持人工选择，AI 不提供预选、不代为投票 ${VT2_TIP('vt2VoteFirst', 77)}</div>
        <div class="type-warn">Agree 进入完整 Comments 维度化流程；Disagree / No Impact 为简化路径。</div>
      </div>`;
    }
    if (id === 'reason') {
      return `<textarea class="reason" id="vt2_reason" placeholder="说明 Disagree / No Impact 的依据（延伸设计：校验理由完整性，待业务确认）">${vt2Esc(st.reason)}</textarea>
        <div class="type-warn">Disagree 是最影响 OTM 决策的输入，请写清阻碍点或无影响的范围。</div>`;
    }
    if (id === 'comment') {
      return vt2RuleBox('正在按以下规则生成', [
        '维度模板：ThinkPad_Commercial × Hardware/SBB_CPU × Development',
        '共 5 个 Dimension、12 个检查点',
        '生成方式：参考相似 PCR 中同一 Function Team 的历史 Comment，按当前维度模板解析后生成',
        '模板更新只影响新建 PCR，不影响存量 PCR',
      ]) + `<div class="to-row" style="margin:8px 0 4px"><span class="to-name">Comment 草稿</span>${VT2_TIP('vt2Dim', 78)}${VT2_TIP('vt2Rules', 82)}${vt2DraftTag()}</div>
        <div class="type-acts">
          <button type="button" class="btn btn-ghost" data-vt2="regen">⟳ 重新生成</button>
          <button type="button" class="btn btn-ghost" data-vt2="recheck">⟲ 重新校验</button>
          <button type="button" class="btn btn-ghost" data-vt2="dims">ⓘ 维度要求</button>
          <button type="button" class="btn btn-ghost" data-vt2="diff">⇄ 版本对比</button>
          <button type="button" class="btn btn-ghost" data-vt2="xls">📥 Excel 模板</button>
        </div>
        <div class="vt2-cmt" id="vt2_cmt" ${s.done ? '' : 'contenteditable="true"'}>${vt2Esc(vt2Cmt())}</div>
        <div class="vt2-modes">生成方式
          <label><input type="radio" name="vt2mode" value="similar" ${st.mode === 'similar' ? 'checked' : ''}> 参考相似 PCR</label>
          <label><input type="radio" name="vt2mode" value="manual" ${st.mode === 'manual' ? 'checked' : ''}> 人工填写</label>
          <label><input type="radio" name="vt2mode" value="upload" ${st.mode === 'upload' ? 'checked' : ''}> 上传附件/自由输入</label>
          <label><input type="radio" name="vt2mode" value="excel" ${st.mode === 'excel' ? 'checked' : ''}> Excel 模板</label>
        </div>
        <div id="vt2_mode_extra"></div>
        <div id="vt2_diff_slot">${st.showDiff ? vt2DiffHtml() : ''}</div>
        ${vt2SimHtml()}`;
    }
    if (id === 'comp') {
      return vt2RuleBox('完整度检查规则', [
        '按维度模板的检查点计分：完整度 = 已覆盖检查点 / 总检查点',
        '本模板共 5 个 Dimension、12 个检查点',
        'Required Dimension：检查所有标记为必填的 Dimension 是否已填写；仅在提交 Agree 时硬阻断',
      ]) + `${vt2CompHtml(map)}${vt2ReqHtml(map)}`;
    }
    if (id === 'missing') {
      return vt2RuleBox('Missing Points Check 规则', [
        '按维度模板将填写内容与预定义检查标准比对，列出缺失信息点',
        '可返回修改 Comments，或 Ignore 后继续；缺失点不硬阻断提交',
      ]) + `<div id="vt2_missbox">${vt2MissingHtml(map, false)}</div>`;
    }
    if (id === 'cr') {
      return vt2RuleBox('Control Run Validation 规则', [
        '主要针对 Development / TPM。AI 根据 PCR Type 与 Change Request 判断是否需要 Control Run，再检查 Comments 结论是否一致',
        '规则示例：New Technology、部分 Hardware/SBB、Software 通常需要；System Design Change、Tooling/ID、Documentation、Schedule 通常不需要；Label、Certification、Country Scope Change 按变更内容判断',
        '不匹配只展示，不自动阻断',
      ]) + `<div id="vt2_crbox">${vt2CrHtml(map, false)}</div>`;
    }
    if (id === 'review') {
      const req = vt2ReqMiss(map);
      const mp = vt2Gaps(map);
      const reqOk = !req.length;
      const mpOk = !mp.length;
      const crOk = !vt2CrBad(map);
      const pct = vt2Pct(map);
      const mpSum = mpOk ? '无' : (st.ignoreMissing ? mp.length + ' 项（已 Ignore）' : mp.length + ' 项');
      return `<div class="vt2-ov">
        <div class="pcheck ${reqOk ? 'ok' : 'err'} in"><span class="ck">${reqOk ? '✓' : '✗'}</span><div>必填维度　<b>${reqOk ? '已完成' : req.length + ' 项未完成'}</b></div></div>
        <div class="pcheck ${mpOk ? 'ok' : 'warn'} in"><span class="ck">${mpOk ? '✓' : '⚠'}</span><div>缺失信息点　<b>${mpSum}</b></div></div>
        <div class="pcheck ${crOk ? 'ok' : 'err'} in"><span class="ck">${crOk ? '✓' : '✗'}</span><div>Control Run　<b>${crOk ? '已匹配' : '结论缺失'}</b></div></div>
        <div class="pcheck ${pct === 100 ? 'ok' : 'warn'} in"><span class="ck">${pct === 100 ? '✓' : '◐'}</span><div>Comment 完整度　<b>${pct}%</b></div></div>
      </div>
      <div class="pact">
        <button class="btn btn-primary" type="button" data-vt2="reviewed">继续</button>
      </div>`;
    }
    if (id === 'wi') {
      if (!st.wiOpen) {
        return `<div class="sd-note">当前 Comment 完整度 <b>${vt2Pct(map)}%</b>，${vt2ReqMiss(map).length} 项必填维度未完成 ${VT2_TIP('vt2WiAfter', 81)}</div>
          <div class="pact">
            <button class="btn btn-primary" type="button" data-vt2="genwi">确认并生成 Work Item</button>
            <button class="btn btn-ghost" type="button" data-vt2="regen">重新生成</button>
          </div>`;
      }
      return vt2RuleBox('Work Item 生成规则', [
        'Work Item 名称 = 产生 Required Action 的上级 Dimension（例如 Control Run）',
        'Description = 从 Comments 的 Required Action 提取',
        'Proposed Target Date = AI 从 Required Action 解析或计算，支持绝对日期与相对时间',
        'Function Team = 默认取当前 Vote Task 的 FT；Task Owner 按 PACE 逻辑从 Function Team 成员中分配',
        '一个 Dimension 下有多个 Required Action → 生成多条 Work Item',
      ]) + (st.wiDirty ? `<div class="sim-note">Comment 已修改，是否重新生成 Work Item？ <button class="btn btn-ghost" type="button" style="padding:2px 8px;font-size:12px" data-vt2="genwi">重新生成</button></div>` : '')
        + `<div id="vt2_wilead" class="sd-note" style="margin:8px 0">AI 已从确认的 Comment 中识别出 ${st.wis.length} 项待办 ${VT2_TIP('vt2WiName', 80)}</div>
        <div id="vt2_wilist">${vt2WiTable()}</div>
        <div class="pact"><button class="btn btn-ghost" type="button" data-vt2="addwi">+ 手动添加</button></div>
        <div class="rule-note">⚠ 此为草稿，随 Vote 结果提交至 OTM，由 OTM 确认后才创建并分发，不直接创建</div>`;
    }
    const miss = st.vote === 'agree' ? vt2ReqMiss(map) : [];
    if (s.done) {
      return `<div class="submit-dock"><div class="sd-done"><div class="ok">✓ 已提交 · ${vt2VoteLabel()}</div></div></div>`;
    }
    return `<div class="submit-dock">
        <div class="sd-note">
          <div>投票结果　<b>${vt2VoteLabel() || '—'}</b></div>
          ${st.vote === 'agree' ? `<div>Comment 完整度　<b>${vt2Pct(map)}%</b>　·　Work Item　<b>${st.wis.length} 条草稿</b></div><div>校验状态　<b>${miss.length ? '✗ ' + miss.length + ' 项必填未完成' : '可提交'}</b></div>` : `<div>理由　<b>${st.reason.trim() ? '已填写' : '未填写'}</b></div>`}
        </div>
        <div class="pact">
          <button class="btn btn-ghost" type="button" data-vt2="draft">存草稿</button>
          <button class="btn btn-primary" type="button" data-vt2="submit" ${st.vote ? '' : 'disabled'}>确认并写回 Vote</button>
          <button class="btn-force" type="button" data-vt2="force">Force Submit</button>${VT2_TIP('vt2Force', 83)}
        </div>
      </div>`;
  }

  function vt2DiffHtml() {
    const st = vt2St();
    const a = st.hist.find((h) => h.v === st.diffA) || st.hist[0];
    const b = st.hist.find((h) => h.v === st.diffB) || st.hist[st.hist.length - 1];
    const setA = new Set(a.text.split('\n'));
    const setB = new Set(b.text.split('\n'));
    let body = '';
    a.text.split('\n').forEach((ln) => { if (ln.trim() && !setB.has(ln)) body += `<div class="del">- ${vt2Esc(ln)}</div>`; });
    b.text.split('\n').forEach((ln) => { if (ln.trim() && !setA.has(ln)) body += `<div class="add">+ ${vt2Esc(ln)}</div>`; });
    const d = b.pct - a.pct;
    const opts = st.hist.map((h) => `<option value="${h.v}" ${h.v === a.v ? 'selected' : ''}>v${h.v}</option>`).join('');
    const optsB = st.hist.map((h) => `<option value="${h.v}" ${h.v === b.v ? 'selected' : ''}>v${h.v}</option>`).join('');
    return `<div class="vt2-diff" id="vt2_diff"><div style="font-size:12.5px;margin:8px 0">版本对比
      <select id="vt2_diff_a">${opts}</select> → <select id="vt2_diff_b">${optsB}</select></div>
      ${body || '<div class="muted">无行级差异</div>'}
      <div style="margin-top:8px;font-size:13px">完整度 ${a.pct}% → ${b.pct}%　${d >= 0 ? '▲ +' : '▼ '}${d}%　·　检查点 ${a.n}/12 → ${b.n}/12</div></div>`;
  }

  function vt2RenderPlist() {
    const host = document.getElementById('vt2_plist');
    if (!host) return;
    const steps = vt2Model();
    const done = steps.filter((s) => s.st === 'done').length;
    const total = steps.length;
    const anyOpen = steps.some((s) => s.open);
    host.innerHTML = `<div class="plist-h" id="vt2_plist_h">
      <h3>Vote Task · Development</h3>
      <span class="pcnt">${done}/${total} 已完成</span>
      <button type="button" class="plist-toggle" id="vt2_toggle">${anyOpen ? '▴' : '▾'}</button>
      ${VT2_TIP('vt2VoteFirst', 77)}
    </div>`;
    steps.forEach((s, i) => {
      const row = document.createElement('div');
      row.className = 'pstep ' + s.st + (s.open ? ' open' : '') + (i === steps.length - 1 ? ' last' : '');
      row.dataset.vt2Step = s.id;
      const icon = s.st === 'done' ? '✓' : s.st === 'pending' ? '◇' : s.st === 'err' ? '!' : s.st === 'warn' ? '!' : s.st === 'run' ? '' : '○';
      row.innerHTML = `<button class="pstep-h" type="button">
        <span class="pico">${icon}</span><span class="ptt">${s.title}</span>
        <span class="psum">${vt2Esc(s.sum || '')}</span>
        <span class="chev">›</span>
        <span class="iinfo" data-vt2-info="${s.info}">ⓘ</span>
      </button><div class="pstep-b">${s.open ? vt2Body(s.id) : ''}</div>`;
      host.appendChild(row);
    });
    vt2Wire();
  }

  function vt2MountCenter(t, s, isReview) {
    vt2EnsureTask();
    const body = document.getElementById('centerBody');
    const st = vt2St();
    const follow = (s.chat || []).map((m) => m.role === 'user'
      ? `<div class="bub me">${vt2Esc(m.text)}</div>`
      : `<div class="ai-lead task-follow"><div class="ai">AI</div><div class="txt">${m.html || vt2Esc(m.text)}</div></div>`).join('');
    body.innerHTML = `<div class="task-thread" id="taskThread">
      <div class="task-ai">
        <div class="ai-lead vt2-lead"><div class="ai">AI</div><div class="txt" id="vt2_lead">这是 <b>Development</b> 的 Vote Task（PCR Type <b>Hardware/SBB_CPU</b>）。请先选择投票结果，后续流程由立场决定——维度化 Comment 与 Work Item 仅适用于 Agree。${VT2_TIP('vt2VoteFirst', 77)}</div></div>
        <div class="parse-ai"><div class="plist" id="vt2_plist"></div></div>
      </div>
      ${follow}
    </div>`;
    if (!st.vote) st.openId = 'vote';
    vt2RenderPlist();
    if (isReview || s.done) {
      body.querySelectorAll('[contenteditable]').forEach((el) => { el.contentEditable = 'false'; });
    }
  }

  function vt2Open(id) {
    const st = vt2St();
    const curId = vt2CurrentId();
    const order = vt2Order();
    if (order.indexOf(id) > order.indexOf(curId)) { toast('需先完成前置步骤'); return; }
    st.openId = id;
    vt2RenderPlist();
  }

  function vt2SetVote(v) {
    const st = vt2St();
    const s = state[VT2_ID];
    const prev = st.vote;
    st.vote = v;
    s.vote = v;
    if (v !== 'agree') {
      st.commentReady = false; st.checkReady = false; st.compReady = false; st.reviewed = false; st.wiOpen = false; st.wis = [];
      st.missingDone = false; st.crDone = false;
      st.openId = 'reason';
      vt2RenderPlist();
      return;
    }
    if (prev !== 'agree') {
      st.openId = 'comment';
      vt2RenderPlist();
      const reduce = vt2Dm() && vt2Dm().reduced();
      if (st.commentReady || reduce || s.done) {
        st.commentReady = true;
        return;
      }
      vt2PlayAgree();
    } else {
      st.openId = 'comment';
      vt2RenderPlist();
    }
  }

  async function vt2PlayAgree() {
    const dm = vt2Dm();
    const root = document.getElementById('centerBody');
    const st = vt2St();
    vt2Playing = true;
    vt2Gen += 1;
    const gen = vt2Gen;
    const alive = () => vt2Playing && vt2Gen === gen && cur === VT2_ID;
    if (dm) { dm._running = true; dm._skip = false; dm.bindSkip(root); }
    const onSkip = (e) => {
      if (!vt2Playing) return;
      if (e.target.closest('a,button,input,textarea,select,label,.tipdot,.iinfo,.type-opt')) return;
      if (dm) dm.skip();
      vt2FinishPlay();
    };
    if (root._vt2Skip) root.removeEventListener('click', root._vt2Skip);
    root._vt2Skip = onSkip;
    root.addEventListener('click', onSkip);
    try {
      const cmt = document.getElementById('vt2_cmt');
      if (cmt) {
        cmt.textContent = '';
        for (const p of VT2_PARAS) {
          if (!alive()) return;
          cmt.appendChild(document.createTextNode((cmt.textContent ? '\n\n' : '') + p.title + '\n'));
          if (dm) await dm.sleep(dm.isSkipping() ? 0 : 200);
          if (dm) {
            const tmp = document.createElement('span');
            cmt.appendChild(tmp);
            await dm.streamText(tmp, p.body, root);
            tmp.replaceWith(document.createTextNode(p.body));
          } else cmt.appendChild(document.createTextNode(p.body));
          if (p.pause && dm) await dm.sleep(dm.isSkipping() ? 0 : 420);
          else if (dm) await dm.sleep(dm.isSkipping() ? 0 : 300);
        }
        state[VT2_ID].comment = VT2_COMMENT;
        st.comment = VT2_COMMENT;
      }
      st.commentReady = true;
      st.checkReady = false;
      st.compReady = false;
      st.missingDone = false;
      st.crDone = false;
      st.reviewed = false;
      await vt2PlayAllChecks(alive);
    } finally {
      if (vt2Gen === gen) {
        vt2Playing = false;
        if (dm) { dm._running = false; dm._skip = false; }
      }
    }
  }

  async function vt2PlayCheckAnim(alive) {
    const dm = vt2Dm();
    const st = vt2St();
    const go = typeof alive === 'function' ? alive : () => true;
    let revealed = 0;
    const paint = () => {
      const wrap = document.getElementById('vt2_comp');
      if (!wrap) return;
      wrap.outerHTML = vt2CompHtml(st.covered, revealed);
    };
    if (document.getElementById('vt2_comp')) {
      for (let i = 0; i < VT2_ANIM.length; i++) {
        if (!go()) return;
        if (VT2_ANIM[i] === 'cr1' && dm) await dm.sleep(dm.isSkipping() ? 0 : 500);
        revealed = i + 1;
        paint();
        if (dm) await dm.sleep(dm.isSkipping() ? 0 : 180);
      }
    }
  }

  async function vt2PlayMissingAnim(alive) {
    const dm = vt2Dm();
    const go = typeof alive === 'function' ? alive : () => true;
    const box = document.getElementById('vt2_missbox');
    if (!box) return;
    if (!go()) return;
    box.innerHTML = vt2MissingHtml(vt2St().covered, true);
    if (dm) await dm.sleep(dm.isSkipping() ? 0 : 350);
    if (!go()) return;
    box.innerHTML = vt2MissingHtml(vt2St().covered, false);
  }

  async function vt2PlayCrAnim(alive) {
    const dm = vt2Dm();
    const root = document.getElementById('centerBody');
    const go = typeof alive === 'function' ? alive : () => true;
    const box = document.getElementById('vt2_crbox');
    if (!box) return;
    if (!go()) return;
    box.innerHTML = vt2CrHtml(vt2St().covered, true);
    if (dm) await dm.sleep(dm.isSkipping() ? 0 : 350);
    if (!go()) return;
    box.innerHTML = vt2CrHtml(vt2St().covered, false);
    const el = document.getElementById('vt2_crtxt');
    if (el && dm && vt2CrBad(vt2St().covered)) await dm.streamText(el, el.textContent, root);
  }

  async function vt2PlayAllChecks(alive) {
    const st = vt2St();
    const go = typeof alive === 'function' ? alive : () => true;
    st.openId = 'comp';
    vt2RenderPlist();
    await vt2PlayCheckAnim(go);
    if (!go()) return;
    st.compReady = true;
    st.checkReady = true;
    st.openId = 'missing';
    vt2RenderPlist();
    await vt2PlayMissingAnim(go);
    if (!go()) return;
    st.missingDone = true;
    st.openId = 'cr';
    vt2RenderPlist();
    await vt2PlayCrAnim(go);
    if (!go()) return;
    st.crDone = true;
    st.openId = 'review';
    vt2RenderPlist();
  }

  function vt2FinishPlay() {
    if (!vt2Playing) return;
    vt2Playing = false;
    vt2Gen += 1;
    const dm = vt2Dm();
    if (dm) { dm._running = false; dm._skip = false; }
    const st = vt2St();
    st.commentReady = true;
    st.checkReady = true;
    st.compReady = true;
    st.missingDone = true;
    st.crDone = true;
    state[VT2_ID].comment = VT2_COMMENT;
    st.openId = 'review';
    vt2RenderPlist();
  }

  function vt2ApplyFill(key) {
    const spec = VT2_FILL[key];
    if (!spec) return null;
    let text = vt2Cmt();
    if (spec.para === 'cr') text = text.replace(/【Control Run】[\s\S]*?(?=\n【|$)/, `【Control Run】\n${spec.text}\n\n`);
    else if (spec.para === 'sw' && !text.includes('已认证 MTM')) text = text.replace(/(【SW \/ BIOS Impact】\n)([\s\S]*?)(?=\n【|$)/, (_, a, b) => a + b.trimEnd() + '\n' + spec.text + '\n\n');
    else if (spec.para === 'vp' && !text.includes('样机')) text = text.replace(/(【Validation Plan】\n)([\s\S]*?)(?=\n【|$)/, (_, a, b) => a + b.trimEnd() + '\n' + spec.text + '\n\n');
    spec.ids.forEach((id) => { vt2St().covered[id] = true; });
    state[VT2_ID].comment = text.trim();
    vt2St().comment = text.trim();
    if (vt2St().wiOpen) vt2St().wiDirty = true;
    return spec;
  }

  async function vt2AiFill(key) {
    const spec = vt2ApplyFill(key);
    if (!spec) return;
    const st = vt2St();
    st.openId = 'comp';
    const paraLab = spec.para === 'cr' ? '【Control Run】' : spec.para === 'sw' ? '【SW / BIOS Impact】' : '【Validation Plan】';
    toast('已补写至' + paraLab + '段落');
    const from = Math.max(0, vt2Pct(st.covered) - Math.round((spec.ids.length / 12) * 100));
    const to = vt2Pct(st.covered);
    const pctEl = document.getElementById('vt2_pct');
    const bar = document.getElementById('vt2_bar');
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / 600);
      if (pctEl) pctEl.textContent = Math.round(from + (to - from) * p) + '%';
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    if (bar) bar.style.width = to + '%';
    setTimeout(() => {
      st.openId = 'comp';
      vt2RenderPlist();
      spec.ids.forEach((id) => {
        const g = VT2_GROUPS.find((x) => x.ids.includes(id));
        document.querySelector(`[data-vt2-g="${g?.id}"]`)?.classList.add('vt2-flip');
      });
    }, 200);
  }

  function vt2ModeExtra() {
    const box = document.getElementById('vt2_mode_extra');
    if (!box) return;
    const m = vt2St().mode;
    if (m === 'manual') {
      box.innerHTML = `<div class="vt2-hint">人工填写提示：Board & Power（layout / PCBA）；Thermal（TDP / fan curve）；BIOS（microcode、certified MTMs、schedule）；Control Run（是否需要及范围）；Validation（items / sample / date）。</div>`;
    } else if (m === 'upload' || m === 'excel') {
      box.innerHTML = `<div class="type-warn" style="margin-top:8px">${m === 'excel' ? '下载维度模板，线下填写后上传自动回填。' : '上传 PPT / Excel / Word 后按维度总结回填。'}
        <div class="type-acts" style="margin-top:8px">${m === 'excel' ? '<button type="button" class="btn btn-ghost" id="vt2_xls2">📥 下载 Excel 模板</button>' : ''}
        <input type="file" id="vt2_file" accept=".ppt,.pptx,.xls,.xlsx,.doc,.docx,.csv"></div></div>`;
      document.getElementById('vt2_xls2')?.addEventListener('click', vt2DownloadXls);
      document.getElementById('vt2_file')?.addEventListener('change', () => {
        vt2ApplyFill('bios2'); vt2ApplyFill('cr1'); vt2ApplyFill('vp2');
        toast('已按附件/模板总结并回填');
        vt2RenderPlist();
      });
    } else box.innerHTML = `<div class="vt2-hint">将取相似 PCR 中同一 Function Team（Development）的 Vote Comment，按当前维度模板解析后回填。</div>`;
  }

  function vt2RunDebouncedChecks() {
    const st = vt2St();
    if (st.vote !== 'agree' || !st.commentReady) return;
    if (!st.commentDirty) return;
    st.commentDirty = false;
    st.missingDone = true;
    st.crDone = true;
    st.checkReady = true;
    st.compReady = true;
    toast('已按防抖规则触发 Missing Points Check 与 Control Run Validation');
    vt2RenderPlist();
  }

  function vt2ScheduleCheck() {
    clearTimeout(vt2Debounce);
    vt2Debounce = setTimeout(vt2RunDebouncedChecks, 500);
  }

  function vt2Wire() {
    const root = document.getElementById('vt2_plist');
    if (!root) return;
    const st = vt2St();
    const s = state[VT2_ID];
    document.getElementById('vt2_toggle')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const any = vt2Model().some((x) => x.open);
      if (any) st.openId = null;
      else st.openId = vt2CurrentId();
      vt2RenderPlist();
    });
    root.querySelectorAll('.pstep-h').forEach((btn) => {
      btn.onclick = (e) => {
        if (e.target.closest('.iinfo')) return;
        const id = btn.parentElement.dataset.vt2Step;
        if (st.openId === id) { st.openId = null; vt2RenderPlist(); }
        else vt2Open(id);
      };
    });
    root.querySelectorAll('[data-vt2-info]').forEach((el) => {
      el.onclick = (e) => e.stopPropagation();
    });
    root.querySelectorAll('[data-vt2-vote]').forEach((b) => {
      b.onclick = (e) => { e.stopPropagation(); if (!s.done) vt2SetVote(b.dataset.vt2Vote); };
    });
    const reason = document.getElementById('vt2_reason');
    if (reason && !s.done) {
      reason.oninput = () => { st.reason = reason.value; };
      reason.onblur = () => { if (reason.value.trim()) { st.openId = 'submit'; vt2RenderPlist(); } };
    }
    const cmt = document.getElementById('vt2_cmt');
    if (cmt && !s.done) {
      cmt.oninput = () => {
        s.comment = cmt.innerText;
        st.comment = s.comment;
        st.commentDirty = true;
        if (st.wiOpen && st.confirmedText && s.comment !== st.confirmedText) st.wiDirty = true;
      };
      cmt.onblur = () => vt2ScheduleCheck();
      cmt.onfocus = () => clearTimeout(vt2Debounce);
    }
    vt2ModeExtra();
    root.querySelectorAll('input[name=vt2mode]').forEach((r) => { r.onchange = () => { st.mode = r.value; vt2ModeExtra(); }; });
    root.querySelector('[data-vt2=dims]')?.addEventListener('click', vt2OpenDims);
    root.querySelector('[data-vt2=xls]')?.addEventListener('click', vt2DownloadXls);
    root.querySelector('[data-vt2=recheck]')?.addEventListener('click', async (e) => {
      e.stopPropagation();
      clearTimeout(vt2Debounce);
      st.commentDirty = false;
      if (!st.commentReady) { toast('请先生成 Comment'); return; }
      st.compReady = false;
      st.checkReady = false;
      st.missingDone = false;
      st.crDone = false;
      st.reviewed = false;
      document.getElementById('vt2_plist')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      await vt2PlayAllChecks();
    });
    root.querySelector('[data-vt2=togglesim]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      st.simOpen = !st.simOpen;
      document.getElementById('vt2_simfold')?.classList.toggle('open', st.simOpen);
    });
    root.querySelector('[data-vt2=toggleroot]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      st.rootOpen = !st.rootOpen;
      document.getElementById('vt2_rootfold')?.classList.toggle('open', st.rootOpen);
    });
    root.querySelector('[data-vt2=diff]')?.addEventListener('click', () => { st.showDiff = !st.showDiff; vt2RenderPlist(); });
    root.querySelector('[data-vt2=regen]')?.addEventListener('click', () => {
      clearTimeout(vt2Debounce);
      st.commentDirty = false;
      st.hist.push({ v: st.ver, at: '草稿', text: vt2Cmt(), pct: vt2Pct(st.covered), n: vt2CoveredN(st.covered) });
      st.ver += 1; s.comment = VT2_COMMENT; st.comment = VT2_COMMENT; st.showDiff = true;
      toast('已重新生成草稿'); vt2RenderPlist();
    });
    root.querySelectorAll('[data-vt2-fill]').forEach((b) => { b.onclick = () => vt2AiFill(b.dataset.vt2Fill); });
    root.querySelector('[data-vt2=ignore]')?.addEventListener('click', () => { st.ignoreMissing = true; toast('已 Ignore Missing Points'); vt2RenderPlist(); });
    root.querySelector('[data-vt2=backedit]')?.addEventListener('click', () => { st.openId = 'comment'; vt2RenderPlist(); document.getElementById('vt2_cmt')?.focus(); });
    root.querySelector('[data-vt2=backcmt]')?.addEventListener('click', () => { st.openId = 'comment'; vt2RenderPlist(); });
    root.querySelectorAll('[data-vt2-ref]').forEach((b) => {
      b.onclick = () => {
        const item = VT2_SIMS.find((x) => x.pcr === b.dataset.vt2Ref);
        if (item?.low) { toast('完整度较低，未自动回填'); return; }
        vt2ApplyFill('bios2'); toast('已按该 Development Comment 回填建议'); vt2RenderPlist();
      };
    });
    root.querySelector('[data-vt2=reviewed]')?.addEventListener('click', () => { st.reviewed = true; st.openId = 'wi'; vt2RenderPlist(); });
    root.querySelector('[data-vt2=genwi]')?.addEventListener('click', vt2GenWi);
    root.querySelector('[data-vt2=addwi]')?.addEventListener('click', () => {
      const id = 'vt2_w' + Date.now();
      st.wis.push({ id, name: '', desc: '', date: '', dateMode: '', ft: 'Development', owner: '', src: '手动添加', draftNew: true, ai: false, status: 'Draft' });
      st.editWi = id;
      vt2RenderPlist();
    });
    root.querySelectorAll('[data-vt2-bexp]').forEach((td) => {
      td.onclick = (e) => {
        e.stopPropagation();
        const id = td.dataset.vt2Bexp;
        st.wiFold[id] = !st.wiFold[id];
        vt2RenderPlist();
      };
    });
    root.querySelectorAll('[data-vt2-wie]').forEach((b) => { b.onclick = (e) => { e.stopPropagation(); st.editWi = b.dataset.vt2Wie; vt2RenderPlist(); }; });
    root.querySelectorAll('[data-vt2-widl]').forEach((b) => { b.onclick = (e) => { e.stopPropagation(); st.wis = st.wis.filter((w) => w.id !== b.dataset.vt2Widl); vt2RenderPlist(); }; });
    root.querySelectorAll('[data-vt2-wix]').forEach((b) => {
      b.onclick = () => {
        const w = st.wis.find((x) => x.id === b.dataset.vt2Wix);
        if (w && w.draftNew) st.wis = st.wis.filter((x) => x.id !== w.id);
        st.editWi = null;
        vt2RenderPlist();
      };
    });
    root.querySelectorAll('[data-vt2-wis]').forEach((b) => {
      b.onclick = () => {
        const card = b.closest('.vt2-wi');
        const w = st.wis.find((x) => x.id === b.dataset.vt2Wis);
        if (!w || !card || b.disabled) return;
        w.name = card.querySelector('[data-vt2-f=name]').value.trim();
        w.desc = card.querySelector('[data-vt2-f=desc]').value.trim();
        w.date = card.querySelector('[data-vt2-f=date]').value.trim();
        w.ft = card.querySelector('[data-vt2-f=ft]').value;
        w.owner = card.querySelector('[data-vt2-f=owner]').value;
        const mode = card.querySelector('input[type=radio]:checked');
        if (mode) w.dateMode = mode.value;
        if (!w.name || !w.desc || !w.date || !w.owner) return;
        w.draftNew = false;
        st.editWi = null;
        vt2RenderPlist();
      };
    });
    root.querySelectorAll('.vt2-wi[data-vt2-wid]').forEach((card) => {
      const btn = card.querySelector('[data-vt2-wis]');
      if (!btn) return;
      const sync = () => {
        const name = (card.querySelector('[data-vt2-f=name]')?.value || '').trim();
        const desc = (card.querySelector('[data-vt2-f=desc]')?.value || '').trim();
        const date = (card.querySelector('[data-vt2-f=date]')?.value || '').trim();
        const owner = card.querySelector('[data-vt2-f=owner]')?.value || '';
        btn.disabled = !name || !desc || !date || !owner;
      };
      card.querySelectorAll('[data-vt2-f], input[type=radio]').forEach((el) => {
        el.addEventListener('input', sync);
        el.addEventListener('change', sync);
      });
    });
    document.getElementById('vt2_diff_a')?.addEventListener('change', (e) => { st.diffA = +e.target.value; vt2RenderPlist(); });
    document.getElementById('vt2_diff_b')?.addEventListener('change', (e) => { st.diffB = +e.target.value; vt2RenderPlist(); });
    root.querySelector('[data-vt2=draft]')?.addEventListener('click', () => toast('草稿已保存在本会话，未写回 PACE'));
    root.querySelector('[data-vt2=submit]')?.addEventListener('click', vt2Submit);
    root.querySelector('[data-vt2=force]')?.addEventListener('click', vt2Force);
    root.querySelectorAll('.vt2-wi select[data-vt2-f=ft]').forEach((sel) => { const w = st.wis.find((x) => x.id === sel.closest('.vt2-wi')?.dataset.vt2Wid); if (w) sel.value = w.ft; });
    root.querySelectorAll('.vt2-wi select[data-vt2-f=owner]').forEach((sel) => { const w = st.wis.find((x) => x.id === sel.closest('.vt2-wi')?.dataset.vt2Wid); if (w) sel.value = w.owner; });
  }

  async function vt2GenWi() {
    const st = vt2St();
    st.wiOpen = true;
    st.wis = VT2_WI_SEED.map((w) => ({ ...w }));
    st.confirmedText = vt2Cmt();
    st.wiDirty = false;
    st.openId = 'wi';
    vt2RenderPlist();
    const dm = vt2Dm();
    const list = document.getElementById('vt2_wilist');
    const lead = document.getElementById('vt2_wilead');
    if (lead && dm) await dm.streamText(lead, `AI 已从确认的 Comment 中识别出 ${st.wis.length} 项待办…`, document.getElementById('centerBody'));
    if (list) {
      const rows = [...list.querySelectorAll('tbody tr[data-vt2-bwi]')];
      rows.forEach((c) => { c.style.opacity = '0'; });
      for (const c of rows) {
        if (dm) await dm.sleep(dm.isSkipping() ? 0 : 250);
        c.style.transition = 'opacity .3s';
        c.style.opacity = '1';
      }
    }
    st.openId = 'submit';
    vt2RenderPlist();
  }

  function vt2Submit() {
    const st = vt2St();
    const s = state[VT2_ID];
    if (!st.vote) return;
    if (vt2IsDis()) {
      if (!String(st.reason || '').trim()) { toast('请填写 Disagree / No Impact 的理由'); st.openId = 'reason'; vt2RenderPlist(); return; }
      vt2Write(false);
      return;
    }
    const miss = vt2ReqMiss(st.covered);
    if (miss.length) {
      toast('Agree 提交被阻断：请补全必填维度 ' + miss.join('、') + '，或 Force Submit');
      st.openId = 'comp';
      vt2RenderPlist();
      return;
    }
    const gates = [
      { ok: st.compReady, name: 'Comments 完整性检查' },
      { ok: st.missingDone, name: 'Missing Points Check' },
      { ok: st.crDone, name: 'Control Run Validation' },
      { ok: st.wiOpen, name: 'Work Item Generation' },
    ];
    if (gates.some((g) => !g.ok)) {
      st.compReady = true; st.checkReady = true; st.missingDone = true; st.crDone = true;
      if (!st.wiOpen) { st.wiOpen = true; st.wis = VT2_WI_SEED.map((w) => ({ ...w })); }
      if (!st.reviewed) st.reviewed = true;
      st.openId = !st.wiOpen ? 'wi' : 'review';
      vt2RenderPlist();
      vt2Pop(`<h3>提交前需完成以下检查</h3>${gates.map((g) => `<div>${g.ok ? '✓' : '◐'} ${g.name}　${g.ok ? '已完成' : '已触发，请查看结果'}</div>`).join('')}
        <p style="font-size:13px;color:var(--ink-2)">请查看结果后重新提交</p>
        <div class="pact" style="justify-content:flex-end"><button class="btn btn-primary" type="button" id="vt2_pop_ok">知道了</button></div>`);
      document.getElementById('vt2_pop_ok')?.addEventListener('click', vt2HidePop);
      return;
    }
    vt2Write(false);
  }

  function vt2Write(forced) {
    const t = TASKS[VT2_ID]; const s = state[VT2_ID]; const st = vt2St();
    vt2Pop(`<h3>确认写回 PACE</h3><p>${t.pcr} · Vote Task</p>
      <div class="writeback">
        <div class="wl"><span class="k">Vote 结果</span><span class="v">${vt2VoteLabel()}</span></div>
        ${st.vote === 'agree' ? `<div class="wl"><span class="k">Comment</span><span class="v">完整度 ${vt2Pct(st.covered)}%</span></div>
        <div class="wl"><span class="k">Work Item</span><span class="v">${st.wis.length} 条草稿提交 OTM，不直接创建</span></div>` : `<div class="wl"><span class="k">理由</span><span class="v">已填写</span></div>`}
        ${forced ? '<div class="wl"><span class="k">Force</span><span class="v">是 · 将出现在 OTM 异常区</span></div>' : ''}
        <div class="wl"><span class="k">目标系统</span><span class="v mono">PACE</span></div>
      </div>
      <div class="pact" style="justify-content:flex-end;margin-top:12px">
        <button class="btn btn-ghost" type="button" id="vt2_pop_x">取消</button>
        <button class="btn btn-primary" type="button" id="vt2_pop_ok">确认写回</button>
      </div>`);
    document.getElementById('vt2_pop_x')?.addEventListener('click', vt2HidePop);
    document.getElementById('vt2_pop_ok').onclick = () => {
      vt2HidePop();
      s.done = true;
      if (typeof renderTaskAll === 'function') renderTaskAll();
      toast(forced ? '已 Force Submit · 理由已留痕并将出现在 OTM 异常区' : '已写回 PACE · 任务完成');
    };
  }

  function vt2Force() {
    const st = vt2St();
    const map = st.covered;
    const req = vt2ReqMiss(map);
    vt2Pop(`<h3>强制提交</h3>
      <p style="font-size:13px;color:var(--ink-2)">以下校验未通过，强制提交将完整留痕（延伸设计，待业务确认）：</p>
      <div class="writeback" style="border-color:var(--warn-bg);background:var(--warn-bg)">
        ${req.length ? `<div class="wl"><span class="k">必填维度</span><span class="v">✗ ${req.join('、')}</span></div>` : ''}
        ${vt2CrBad(map) ? `<div class="wl"><span class="k">Control Run</span><span class="v">✗ 不匹配</span></div>` : ''}
        <div class="wl"><span class="k">Missing Points</span><span class="v">⚠ ${vt2Gaps(map).length} 项${st.ignoreMissing ? '（已 Ignore）' : ''}</span></div>
        <div class="wl"><span class="k">完整度</span><span class="v">${vt2Pct(map)}%</span></div>
      </div>
      <p style="font-size:12.5px;color:var(--warn);margin:10px 0">⚠ 该记录将在 OTM 汇总的「异常」区中显示</p>
      <div style="font-size:12px;margin-bottom:4px">强制提交理由（必填）</div>
      <textarea class="reason" id="vt2_force_r" placeholder="说明为何在校验未通过时仍要提交…"></textarea>
      <div class="pact" style="justify-content:flex-end;margin-top:12px">
        <button class="btn btn-ghost" type="button" id="vt2_pop_x">取消</button>
        <button class="btn btn-warnghost" type="button" id="vt2_pop_ok">强制提交</button>
      </div>`);
    document.getElementById('vt2_pop_x')?.addEventListener('click', vt2HidePop);
    document.getElementById('vt2_pop_ok').onclick = () => {
      const ta = document.getElementById('vt2_force_r');
      if (!ta.value.trim()) { ta.style.borderColor = 'var(--disagree)'; ta.focus(); return; }
      st.forceNote = ta.value.trim();
      if (!st.vote) st.vote = 'agree';
      vt2HidePop();
      vt2Write(true);
    };
  }

  function vt2OpenDims() {
    vt2Pop(`<h3>维度要求（示例模板）</h3>
      <p style="font-size:12px;color:var(--ink-3)">ThinkPad_Commercial × Hardware/SBB_CPU × Development</p>
      <table class="vt2-dimtbl"><tr><th>Dimension</th><th>Sub</th><th>必填</th><th>检查点</th></tr>
        <tr><td>HW Impact</td><td>Board & Power</td><td>✓</td><td>2</td></tr>
        <tr><td></td><td>Thermal & Acoustics</td><td>✓</td><td>2</td></tr>
        <tr><td>SW / BIOS Impact</td><td>BIOS & Microcode</td><td>✓</td><td>3</td></tr>
        <tr><td>Control Run</td><td>—</td><td>✓</td><td>2</td></tr>
        <tr><td>Validation Plan</td><td>—</td><td>✓</td><td>3</td></tr>
        <tr><td>Others</td><td>—</td><td>—</td><td>—</td></tr>
      </table>
      <div class="rule-note">${VT2_RULE_FOOT}</div>
      <div class="pact" style="justify-content:flex-end;margin-top:12px"><button class="btn btn-primary" type="button" id="vt2_pop_ok">关闭</button></div>`);
    document.getElementById('vt2_pop_ok')?.addEventListener('click', vt2HidePop);
  }

  function vt2DownloadXls() {
    const csv = '\ufeffDimension,Sub-Dimension,Required,Checkpoints,Default Description,Comment\n'
      + 'HW Impact,Board & Power,Yes,2,"Clarify: 1. board/power; 2. PCBA quantity",\n'
      + 'HW Impact,Thermal & Acoustics,Yes,2,"Assess: TDP delta; fan curve",\n'
      + 'SW / BIOS Impact,BIOS & Microcode,Yes,3,"microcode; certified MTMs; BIOS schedule",\n'
      + 'Control Run,—,Yes,2,"if required; scope and schedule",\n'
      + 'Validation Plan,—,Yes,3,"items; sample qty/source; target date",\n';
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'Vote_Dimension_Template_SP-2026-13077.csv';
    a.click();
    toast('已下载 Excel 维度模板（CSV）');
  }

  function vt2Pop(inner) {
    vt2HidePop();
    const el = document.createElement('div');
    el.className = 'vt2-pop';
    el.id = 'vt2_pop';
    el.innerHTML = `<div class="box">${inner}</div>`;
    document.body.appendChild(el);
    el.addEventListener('click', (e) => { if (e.target === el) vt2HidePop(); });
  }
  function vt2HidePop() { document.getElementById('vt2_pop')?.remove(); }

  function vt2RenderCtx() {
    const t = TASKS[VT2_ID];
    const body = document.getElementById('ctxBody');
    if (!body) return false;
    const dlSvg = `<svg class="i" style="width:14px;height:14px"><path d="M8 2v8M5 7.5L8 10.5l3-3M3 13h10"/></svg>`;
    if (ctxTab === 'detail') {
      body.innerHTML = `<div class="sec" data-sec>
          <div class="sec-h"><span class="caret">▾</span>Basic Information</div>
          <div class="sec-c"><dl class="fields">
            <dt>PCR#</dt><dd class="mono">${t.pcr}</dd>
            <dt>Name</dt><dd>${t.name}</dd>
            <dt>Product Category</dt><dd>${t.category}</dd>
            <dt>PCR Type</dt><dd class="mono">${t.pcrType}</dd>
            <dt>Product</dt><dd>${t.product}</dd>
            <dt>Impacted Products</dt><dd>${t.impact}</dd>
            <dt>Function</dt><dd>${t.func}</dd>
            <dt>Target Completion Date</dt><dd>${t.date}</dd>
            <dt>Status</dt><dd>${t.status}</dd>
          </dl></div></div>
        <div class="sec" data-sec>
          <div class="sec-h"><span class="caret">▾</span>Process Progress &amp; Monitoring</div>
          <div class="sec-c">${typeof renderProcessProgress === 'function' ? renderProcessProgress(t) : ''}</div>
        </div>
        <div class="sec" data-sec>
          <div class="sec-h"><span class="caret">▾</span>Change Request in Detail${typeof crFsBtn==='function'?crFsBtn():''}</div>
          <div class="sec-c">${typeof crDetailBlock==='function'?crDetailBlock(t.change):`<div style="font-size:12.5px;line-height:1.6">${t.change}</div>`}</div>
        </div>
        <div class="sec" data-sec>
          <div class="sec-h"><span class="caret">▾</span>Attachments &amp; Reference</div>
          <div class="sec-c">
            <div class="attach"><span class="fx">PDF</span><div><div>T14p Gen5 CPU SKU Replacement.pdf</div><div class="fmeta">980 KB · v1</div></div><span class="fdl">${dlSvg}</span></div>
            <div class="attach"><span class="fx xls">XLS</span><div><div>Impacted MTM List.xlsx</div><div class="fmeta">64 KB</div></div><span class="fdl">${dlSvg}</span></div>
          </div></div>`;
    } else if (ctxTab === 'similar') {
      body.innerHTML = `<div style="font-size:11.5px;color:var(--ink-3);margin-bottom:10px">同 Product Category · Development · Top 3</div>`
        + VT2_SIMS.map((x) => `<div class="simcard"><div class="simcard-top"><span class="mono">${x.pcr}</span><span class="sim%">${x.s}</span></div>
          <h5>${x.n}</h5><div class="sm"><span>· ${x.match}</span><span>· 完整度 ${x.c}</span>${x.low ? '<span>· 参考价值有限</span>' : ''}</div></div>`).join('');
    } else if (ctxTab === 'approval') {
      body.innerHTML = typeof renderApprovalHistoryHtml === 'function' ? renderApprovalHistoryHtml(t) : '<div class="ah-empty">Approval History 未加载</div>';
      if (typeof wireApprovalHistory === 'function') wireApprovalHistory();
    } else {
      const ev = (typeof EVI !== 'undefined' && EVI[VT2_ID]) || [];
      body.innerHTML = `<div style="font-size:11.5px;color:var(--ink-3);margin-bottom:10px">Evidence sources</div>`
        + ev.map((e, i) => `<div class="evi"><span class="en">${i + 1}</span><div class="ec"><div>${e.t}</div><span class="src">${e.s}</span></div></div>`).join('');
    }
    body.querySelectorAll('[data-sec] .sec-h').forEach((h) => {
      h.onclick = (e) => {
        if (e.target.closest('[data-cr-fs],[data-cr-fs-more]')) return;
        h.parentElement.classList.toggle('collapsed');
        if (typeof syncCrFs === 'function') requestAnimationFrame(() => syncCrFs(body));
      };
    });
    if (typeof wireCrRead === 'function') wireCrRead(body);
    return true;
  }

  window.VoteV2 = {
    isV2(id) { return id === VT2_ID || !!(typeof TASKS !== 'undefined' && TASKS[id] && TASKS[id].voteV2); },
    stepInfo(key) { return VT2_INFO[key] || null; },
    mountCenter: vt2MountCenter,
    renderCtx: vt2RenderCtx,
    handleAsk(v) {
      const s = state[VT2_ID];
      s.chat = s.chat || [];
      s.chat.push({ role: 'user', text: v });
      let reply = '请先选择投票结果。Agree 后才会生成维度化 Comment。';
      if (vt2St().vote === 'agree' && /Control Run|补写|完整度/i.test(v)) {
        vt2ApplyFill('cr1');
        reply = '已在【Control Run】段落补写范围与排期。';
      } else if (vt2IsDis()) {
        reply = 'Disagree / No Impact 路径请在「填写理由」中写清依据，无需维度化 Comment。';
      }
      s.chat.push({ role: 'ai', text: reply, html: vt2Esc(reply) });
      if (typeof renderCenter === 'function') renderCenter();
    },
  };

  vt2EnsureTask();
})();
