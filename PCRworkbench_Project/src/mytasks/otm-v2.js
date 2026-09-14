/* OTM Assessment v2：全新独立实现（前缀 otm2_ / OtmV2），不改现有 t4 OTM */
(function () {
  const OTM2_ID = 'otm2';
  const OTM2_PCR = 'SP-2026-13077';
  const OTM2_RULE_FOOT = '⚠ 原型阶段规则示例，实际规则待业务确认';
  const OTM2_TIP = (k, n) => `<span class="tipdot" onclick="showTip(event,'${k}',${n})">${n}</span>`;
  const otm2Dm = () => window.DialogueMotion;

  const OTM2_CONCLUSION = `【总体结论】
本次 CPU SKU 替换（Ultra 7 155U → 165U）在技术层面可行，但当前评估尚未达到直接批准条件：1 个 Mandatory Vote Task未完成，1 个职能提出 Disagree，另有 1 条强制提交记录。建议采用带条件批准或暂缓，待认证评估结论明确后再推进。

【投票结果与 Comments】
共 4 个 Mandatory Vote Task，已完成 3 个，未完成 1 个。
· Development：Agree —— 同封装 pin-to-pin 替代，主板与供电无需改动，PCBA 数量不变（Comment 完整度 67%）
· BOM：Agree —— 物料清单变更范围清晰，涉及 T1、LNB BOM、MFG BOM 三处更新（Comment 完整度 55%）
· TPMDM：Disagree —— 已认证机型需重新送测，周期约 3 周
· Planner：未提交

【反对、未完成及校验异常】
1. TPMDM 提出 Disagree：T14p Gen 5 与 T16p Gen 5 已完成 CCC 认证，本次 CPU 变更触发重新送测，周期约 3 周，将威胁 2026-11-20 目标实施日。该反对意见尚未解决。
2. Planner 的 Mandatory Vote Task 未提交，已逾期 2 天，阻塞原因为等待 ODM 供应计划确认。
3. Development 在校验未通过的情况下强制提交：Required Dimension 2 项未填（Control Run、Validation Plan）、Control Run Validation 不匹配、4 项 Missing Points 已 Ignore。强制提交原因为「客户催得紧，先给结论后补数据」。该情况不等同于校验通过，相关信息仍需补齐。
4. BOM 的 Comment 完整度为 55%，低于建议水平，参考价值有限。

【历史 PCR 差异】
与 PCR-2025-07612（相似度 94%）相比：
· Control Run 结论差异：历史 PCR 明确执行 Control Run（50pcs，2wk 完成），本次 Development 的 Comment 中未给出该结论
· 认证影响差异：历史 PCR 未涉及已认证机型，本次涉及 2 个已认证 MTM，风险高于历史同类变更
以上差异仅供参考，不替代本次 PCR 的实际结论。

【Work Item 与待办】
共汇总 5 条 Work Item，来自 3 个职能，均待 OTM 确认：
· Control Run 验证（Development，PCR approved 后 3 周）
· BIOS microcode 兼容性验证（Development，10-25）
· BOM 三处清单更新（BOM，11-02）
· 已认证 MTM 重新送测评估（TPMDM，11-08）
· BIOS 版本兼容性测试（TPMDM，11-06）
待决事项：认证送测周期是否可压缩、目标实施日是否需调整。`;

  const OTM2_HIST_BLOCK = `【历史 PCR 差异】
与 PCR-2025-07612（相似度 94%）相比：
· Control Run 结论差异：历史 PCR 明确执行 Control Run（50pcs，2wk 完成），本次 Development 的 Comment 中未给出该结论
· 认证影响差异：历史 PCR 未涉及已认证机型，本次涉及 2 个已认证 MTM，风险高于历史同类变更
以上差异仅供参考，不替代本次 PCR 的实际结论。`;

  const OTM2_VOTES = [
    {
      ft: 'Development', vote: 'Agree', status: 'Completed', pct: 67, submit: 'force', mandatory: true,
      due: '2026-11-10', submitted: '11-12 16:40', owner: 'test@lenovo.com',
      comment: '【HW Impact】\n同封装 pin-to-pin 替代，主板布局与供电无需改动。\n\n【SW / BIOS Impact】\n需新增 microcode 0x12A 支持。\n\n【Control Run】\n（待补充）\n\n【Validation Plan】\n计划验证散热与 BIOS 兼容性。',
      force: { fail: 'Required Dimension 2 项未填（Control Run、Validation Plan）、Control Run Validation 不匹配', mp: '4 项（已 Ignore）', reason: '客户催得紧，先给结论后补数据', who: 'test@lenovo.com', at: '2026-11-12 16:40', resolved: false },
      check: { req: ['Control Run', 'Validation Plan'], mp: ['未说明对已认证 MTM 的影响', '未确认是否需要 Control Run', '未说明 Run 范围与排期', '未给出样机数量与来源'], cr: '规则判定需执行，Comment 中未给出结论', wi: true, wiOk: true, at: '2026-11-12 16:35', ver: 'v1.2' },
    },
    {
      ft: 'BOM', vote: 'Agree', status: 'Completed', pct: 55, submit: 'normal', mandatory: true,
      due: '2026-11-10', submitted: '11-11 09:15', owner: 'test29@lenovo.com',
      comment: '【BOM Action】\n涉及 T1、LNB BOM、MFG BOM 三处更新。未说明 MFG BOM 更新的 Lead Time。',
      check: { req: [], mp: ['未说明 MFG BOM 更新的 Lead Time'], cr: '', wi: true, wiOk: true, at: '2026-11-11 09:10', ver: 'v1.2' },
    },
    {
      ft: 'Planner', vote: null, status: 'Inwork', pct: null, submit: null, mandatory: true,
      due: '2026-11-10', submitted: '逾期 2 天', owner: 'huangxl16@lenovo.com', late: 2,
      block: '等待 ODM 供应计划确认', comment: '',
    },
    {
      ft: 'TPMDM', vote: 'Disagree', status: 'Completed', pct: 92, submit: 'normal', mandatory: true,
      due: '2026-11-10', submitted: '11-13 14:20', owner: 'huangxl16@lenovo.com',
      reason: '认证需重新送测，周期约 3 周，威胁 11-20 目标实施日',
      comment: '【Certification Impact】\nT14p Gen 5 与 T16p Gen 5 已完成 CCC 认证，本次 CPU 变更触发重新送测，周期约 3 周。\n\n【SW Impact】\n需验证 BIOS 新版本在已认证机型上的兼容性。',
      check: { req: [], mp: [], cr: '', wi: true, wiOk: true, at: '2026-11-13 14:15', ver: 'v1.2' },
    },
  ];

  const OTM2_WI_SEED = [
    { id: 'otm2_w1', name: 'Control Run', ft: 'Development', voteTask: 'Development Vote Task', src: '【Control Run】', desc: '执行 Control Run 验证，50pcs 于 MFG 产线', date: 'PCR approved 后 3 周', dateMode: 'rel', base: 'PCR approved 2026-10-15', calc: '+ 3 周 = 2026-11-05', absDate: '2026-11-05', owner: 'test@lenovo.com', status: '待确认', ai: true, ra: 'Control Run 验证' },
    { id: 'otm2_w2', name: 'SW / BIOS Impact', ft: 'Development', voteTask: 'Development Vote Task', src: '【SW / BIOS Impact】', desc: 'BIOS microcode 0x12A 兼容性验证', date: '2026-10-25', dateMode: 'abs', owner: 'test@lenovo.com', status: '待确认', ai: true, ra: 'BIOS microcode 兼容性验证' },
    { id: 'otm2_w3', name: 'BOM Update', ft: 'BOM', voteTask: 'BOM Vote Task', src: '【BOM Action】', desc: '更新 T1 / LNB BOM / MFG BOM 三处物料清单', date: '2026-11-02', dateMode: 'abs', owner: 'test29@lenovo.com', status: '待确认', ai: true, ra: 'BOM 三处清单更新' },
    { id: 'otm2_w4', name: 'Certification', ft: 'TPMDM', voteTask: 'TPMDM Vote Task', src: '【Certification Impact】', desc: '已认证 MTM 重新送测评估，预计 3 周', date: '2026-11-08', dateMode: 'abs', owner: 'huangxl16@lenovo.com', status: '待确认', ai: true, ra: '已认证 MTM 重新送测评估' },
    { id: 'otm2_w5', name: 'BIOS 版本兼容性测试', ft: 'TPMDM', voteTask: 'TPMDM Vote Task', src: '【SW Impact】', desc: '验证 BIOS 新版本在已认证机型上的兼容性', date: '2026-11-06', dateMode: 'abs', owner: 'huangxl16@lenovo.com', status: '待确认', ai: true, ra: 'BIOS 版本兼容性测试' },
  ];

  const OTM2_DIFFS = [
    { id: 'd1', ft: 'Development', kind: 'Control Run 结论差异', pcr: 'PCR-2025-07612', cur: 'Comment 中未给出 Control Run 结论', hist: '明确执行 Control Run，50pcs，2wk 完成', sum: '本次缺少历史 PCR 中已有的 Control Run 结论' },
    { id: 'd2', ft: 'TPMDM', kind: '新增的风险', pcr: 'PCR-2025-07612', cur: '已认证机型需重新送测，3 周', hist: '未涉及已认证机型', sum: '本次新增认证风险，历史同类变更无此项' },
    { id: 'd3', ft: 'BOM', kind: '当前缺失的信息', pcr: 'PCR-2025-07612', cur: '未说明 MFG BOM 更新的 Lead Time', hist: '明确 MFG BOM 更新 1wk', sum: '本次缺少历史 PCR 中已提供的 Lead Time 信息' },
  ];

  const OTM2_INFO = {
    summary: { t: '查看汇总', b: '一步内分四区：Vote 结果、Work Item、历史差异、校验继承。Disagree / 未完成 / 强制提交不得被汇总成整体同意。' },
    conclusion: { t: '确认 Assessment Conclusion', b: '只读参考区与可编辑结论区必须分离。存在异常时第三段不得为空；删除异常内容时提示但不阻断。' },
    wicheck: { t: '校验 Work Item', b: '硬阻断、警告、需填原因分级。语义判重可合并且保留全部来源；删除条目须说明不执行原因。' },
    save: { t: '保存 Work Item', b: '校验通过后定稿保存，并保留来源 Vote Task 与 Required Action 的关联。' },
    sync: { t: '同步 PACE Sub-task', b: '决策前为待执行；决策后只回显失败项，已成功的不再出现在重试列表。' },
    decide: { t: '完成 Assessment 决策', b: '单一入口，四组决策卡片。Mandatory 未完成或存在 Disagree 时禁用直接 Approve，Conditional Approve 可用。' },
  };

  const OTM2_DECISIONS = [
    { g: 'A. 批准并推进', id: 'awi', name: 'Approve with Work Items', desc: '批准并进入 Implementation，已确认的 Work Item 将同步为 Sub-task。', to: 'Under_Implementation' },
    { g: 'A. 批准并推进', id: 'ac', name: 'Approve and Close', desc: '批准但无需实施任务，PCR 将直接关闭。', to: 'Closed' },
    { g: 'A. 批准并推进', id: 'ca', name: 'Conditional Approve', desc: '有条件批准，需要填写批准条件。', to: 'Condition_Approve' },
    { g: 'B. 暂不做最终决定', id: 'pending', name: 'Pending', desc: '暂停评估，需要填写 Pending 原因和恢复条件。', to: 'Pending_Assess' },
    { g: 'B. 暂不做最终决定', id: 'sp', name: 'Solution Proposed', desc: '已形成解决方案，但尚未达到最终批准条件。', to: 'Solution_Proposed' },
    { g: 'C. 退回修改', id: 'qr', name: 'Quick Return', desc: '退回修改，重新提交后返回 Assessment。', to: 'Under_Assessment' },
    { g: 'C. 退回修改', id: 'rr', name: 'Return for Re-review', desc: '退回修改，重新提交后从 Review 阶段开始。', to: 'In_Review' },
    { g: 'D. 终止', id: 'rj', name: 'Reject PCR', desc: '拒绝并终止该 PCR。', to: 'Closed', danger: true },
  ];

  function otm2Esc(t) {
    return String(t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  }
  function otm2Now() {
    const d = new Date();
    return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
  function otm2CloneWis() { return OTM2_WI_SEED.map((w) => ({ ...w, sources: [{ ft: w.ft, src: w.src, ra: w.ra, voteTask: w.voteTask }] })); }

  function otm2Default() {
    return {
      openId: 'summary', viewed: false, concReady: false, wiChecked: false, wiSaved: false,
      synced: false, decided: false, alertOpen: true, voteFilter: 'all', voteOpen: null, checkFt: 'Development',
      conclusion: OTM2_CONCLUSION, ver: 1, hist: [{ v: 1, at: '当前', text: OTM2_CONCLUSION, pct: 100, n: 5 }],
      showDiff: false, diffA: 1, diffB: 1, concDirty: false,
      diffs: OTM2_DIFFS.map((d) => ({ ...d, mark: '待确认' })),
      wis: otm2CloneWis(), skip: {}, editWi: null, mergeSel: {},
      dupResolved: false, merged: false, notDup: false,
      savedN: 0, syncFail: { id: 'otm2_w1', reason: 'Task Owner test@lenovo.com 在目标 Function Team 中未找到有效账号' },
      syncOk: [], retried: false, decision: null, decFields: {}, pcrStatus: 'Under_Assessment',
      ops: [], playedIntro: false, lockOpen: false,
    };
  }

  function otm2St() {
    const s = state[OTM2_ID];
    if (!s.otm2) s.otm2 = otm2Default();
    return s.otm2;
  }
  function otm2Log(kind, text) {
    const st = otm2St();
    st.ops.push({ kind, text, at: otm2Now() });
  }
  function otm2ActiveWis() { return otm2St().wis.filter((w) => !w.removed); }
  function otm2RuleBox(title, items) {
    return `<div class="prule"><div class="prule-t">${title}</div><ul>${items.map((x) => `<li>${x}</li>`).join('')}</ul></div><div class="rule-note">${OTM2_RULE_FOOT}</div>`;
  }
  function otm2DraftTag() {
    const st = otm2St();
    const done = !!(state[OTM2_ID] && state[OTM2_ID].done);
    if (done) return `<span class="to-conf hi">✓ 已提交 · v${st.ver}</span>`;
    return `<span class="to-conf mid">● AI 草稿 · 未提交 · v${st.ver}</span>`;
  }

  function otm2Covered(text) {
    const t = text || '';
    const exceptBody = (t.split('【反对、未完成及校验异常】')[1] || '').split('【')[0];
    return {
      overall: /【总体结论】/.test(t),
      votes: /【投票结果与 Comments】/.test(t),
      except: /【反对、未完成及校验异常】/.test(t) && exceptBody.replace(/\s/g, '').length > 8,
      hist: /【历史 PCR 差异】/.test(t),
      wi: /【Work Item 与待办】/.test(t),
    };
  }
  function otm2Pct(text) {
    const c = otm2Covered(text);
    return Math.round((Object.values(c).filter(Boolean).length / 5) * 100);
  }
  function otm2MissingExcept(text) {
    const t = text || '';
    const miss = [];
    if (!/Disagree|反对|TPMDM/i.test(t)) miss.push('TPMDM 的 Disagree（认证需 3 周）');
    if (!/强制提交/.test(t)) miss.push('Development 的强制提交记录');
    if (!/Planner|未提交/.test(t)) miss.push('Planner 的 Mandatory Vote 未完成');
    if (!/55%/.test(t)) miss.push('BOM 低完整度 55%');
    return miss;
  }

  function otm2EnsureTask() {
    if (typeof TASKS === 'undefined' || TASKS[OTM2_ID]) return;
    TASKS[OTM2_ID] = {
      type: 'otm', tt: 'OTM', otmV2: true, youStep: 'otm_assess',
      ttl: 'OTM Assessment Task',
      pcr: OTM2_PCR, status: 'Under_Assessment',
      product: 'ThinkPad T14p Gen 5 / T14p Gen 5 AMD',
      func: 'OTM', mandatory: true, critical: true,
      due: '2026-11-20', late: false,
      change: 'Replace Intel Core Ultra 7 155U with Ultra 7 165U on T14p Gen5, same package pin-to-pin, no PCBA quantity change. Need to confirm BIOS microcode and certification impact.',
      name: 'T14p Gen5 CPU SKU Replacement (Ultra 7 155U → 165U)',
      geo: 'WW', date: '2026-11-20', stage: 'Assessment', progress: 60, risk: 'high',
      pcrType: 'Hardware/SBB_CPU', category: 'ThinkPad_Commercial',
      impact: 'ThinkPad T14p Gen 5、T14p Gen 5 AMD',
    };
    if (typeof ORDER !== 'undefined' && !ORDER.includes(OTM2_ID)) ORDER.push(OTM2_ID);
    if (typeof state !== 'undefined' && !state[OTM2_ID]) {
      state[OTM2_ID] = { vote: null, path: null, done: false, chat: [], comment: OTM2_CONCLUSION, otm2: otm2Default() };
    }
    if (typeof SIM !== 'undefined') {
      SIM[OTM2_ID] = [
        { pcr: 'PCR-2025-07612', n: '同类 CPU SKU 替换（PN 一致）', s: '94%', m: ['PN 一致', 'ThinkPad_Commercial', 'Closed'] },
        { pcr: 'SP-2025-11880', n: 'T14p 同平台变更', s: '88%', m: ['同平台', 'Hardware/SBB_CPU'] },
        { pcr: 'CP-2024-09815', n: 'BIOS / 认证影响案例', s: '81%', m: ['认证 +3wk'] },
      ];
    }
    if (typeof EVI !== 'undefined') {
      EVI[OTM2_ID] = [
        { t: '4 个 Mandatory Vote：3 完成、1 未提交、1 Disagree、1 强制提交。', s: 'Vote Task 状态' },
        { t: 'Development 强制提交不等于校验通过。', s: 'OTM-08' },
        { t: '与 PCR-2025-07612 对比仅供参考，不得覆盖当前结论。', s: 'Historical Case' },
      ];
    }
  }

  function otm2Order() { return ['summary', 'conclusion', 'wicheck', 'save', 'sync', 'decide']; }
  function otm2CurrentId() {
    const st = otm2St();
    if (!st.viewed) return 'summary';
    if (!st.concReady) return 'conclusion';
    if (!st.wiChecked) return 'wicheck';
    if (!st.wiSaved) return 'save';
    if (!st.decided) return 'decide';
    return 'sync';
  }
  function otm2StepState(id, cur) {
    const st = otm2St();
    const order = otm2Order();
    const idx = order.indexOf(id);
    const curIdx = order.indexOf(cur);
    const done = {
      summary: !!st.viewed,
      conclusion: !!st.concReady,
      wicheck: !!st.wiChecked,
      save: !!st.wiSaved,
      sync: !!st.synced,
      decide: !!st.decided,
    };
    if (id === 'sync' && st.decided && st.synced) {
      return { st: st.syncFail && !st.retried ? 'warn' : 'done', sum: st.retried ? '5 成功' : '4 成功 · 1 失败' };
    }
    if (id === 'sync' && !st.decided) return { st: idx <= curIdx ? 'pending' : 'wait', sum: '待执行' };
    if (done[id] || (id === 'decide' && state[OTM2_ID].done)) {
      let sum = '已完成';
      if (id === 'summary') sum = '已查看汇总';
      if (id === 'conclusion') sum = otm2Pct(st.conclusion) + '%';
      if (id === 'wicheck') sum = otm2ActiveWis().length + ' 条待保存';
      if (id === 'save') sum = '已保存 ' + st.savedN + ' 条';
      if (id === 'decide') sum = (OTM2_DECISIONS.find((d) => d.id === st.decision) || {}).name || '已决策';
      return { st: 'done', sum };
    }
    if (idx > curIdx) return { st: 'wait', sum: '待前置完成' };
    if (id === 'summary' || id === 'conclusion' || id === 'wicheck' || id === 'save' || id === 'decide') return { st: 'pending', sum: '待确认' };
    return { st: 'run', sum: '进行中' };
  }
  function otm2Model() {
    const st = otm2St();
    const cur = otm2CurrentId();
    const defs = [
      { id: 'summary', title: '查看汇总', info: 'summary' },
      { id: 'conclusion', title: '确认 Assessment Conclusion', info: 'conclusion' },
      { id: 'wicheck', title: '校验 Work Item', info: 'wicheck' },
      { id: 'save', title: '保存 Work Item', info: 'save' },
      { id: 'sync', title: '同步 PACE Sub-task', info: 'sync' },
      { id: 'decide', title: '完成 Assessment 决策', info: 'decide' },
    ];
    return defs.map((d) => {
      const stt = otm2StepState(d.id, cur);
      return { ...d, st: stt.st, sum: stt.sum, open: st.openId === d.id };
    });
  }

  function otm2AlertHtml() {
    const st = otm2St();
    return `<div id="otm2_alert">
      <div class="type-warn" data-otm2="togglealert">⚠ 1 Disagree · 1 未完成 · 1 强制提交 · 1 低完整度 ${OTM2_TIP('otm2NoDissolve', 84)}<span class="sp">${st.alertOpen ? '收起 ▴' : '展开 ▾'}</span></div>
      ${st.alertOpen ? `<div id="otm2_exbox" class="prule">
        <div class="prule-t">⚠ 需要你注意的异常　4 项</div>
        <div class="pcheck err in"><span class="ck">🔴</span><div><b>反对意见</b>　1 项<div>TPMDM · Disagree<br>认证需重新送测，周期约 3 周，威胁 11-20 目标实施日　<button type="button" class="btn btn-ghost" style="padding:2px 8px;font-size:12px" data-otm2="goto-tpmdm">查看原始 Comment</button></div></div></div>
        <div class="pcheck err in"><span class="ck">🔴</span><div><b>强制提交</b>　1 项 ${OTM2_TIP('otm2ForceNeq', 87)}<div>Development · 校验未通过仍提交<br>未通过项：Required Dimension 2 项未填、Control Run Validation 不匹配<br>Missing Points：4 项（已 Ignore）<br>原因：客户催得紧，先给结论后补数据<br>提交人：test@lenovo.com · 2026-11-12 16:40<br>后续是否已解决：<b>否</b></div></div></div>
        <div class="pcheck warn in"><span class="ck">🟡</span><div><b>未完成</b>　1 项<div>Planner · Vote Task 未提交<br>Mandatory：是 · Owner：huangxl16@lenovo.com<br>Target Date：2026-11-10 · <b>已逾期 2 天</b><br>阻塞原因：等待 ODM 供应计划确认</div></div></div>
        <div class="pcheck warn in"><span class="ck">🟡</span><div><b>低完整度</b>　1 项<div>BOM · Comment 完整度 55%</div></div></div>
        <div class="rule-note">⚠ 以上异常不可隐藏，需在 Assessment Conclusion 中明确说明处理方式</div>
      </div>` : ''}
    </div>`;
  }

  function otm2VoteRow(v) {
    const cls = v.vote === 'Disagree' ? 'err' : (!v.vote || v.late ? 'warn' : '');
    return `<tr class="${cls}" data-otm2-ft="${v.ft}">
      <td>${otm2Esc(v.ft)}</td>
      <td>${v.vote ? otm2Esc(v.vote) : '— 未提交'}</td>
      <td>${otm2Esc(v.status)}</td>
      <td>${v.pct == null ? '—' : (v.pct + '%' + (v.pct < 60 ? ' ⚠' : ''))}</td>
      <td>${v.submit === 'force' ? '⚠ 强制提交' : (v.submit === 'normal' ? '正常' : '—')}</td>
      <td>${v.mandatory ? 'Yes' : 'No'}</td>
      <td>${otm2Esc(v.due)}</td>
      <td>${otm2Esc(v.submitted)}</td>
    </tr>${otm2St().voteOpen === v.ft ? `<tr class="bc-detail"><td colspan="8"><div class="otm2-lock">🔒 原始 Comments，不可修改 · Owner ${otm2Esc(v.owner)}</div><div class="vt2-cmt">${v.comment ? otm2Esc(v.comment) : '（未提交，无 Comments）'}</div></td></tr>` : ''}`;
  }

  function otm2WiRead(w) {
    const srcs = (w.sources || [{ ft: w.ft, src: w.src, ra: w.ra, voteTask: w.voteTask }]).map((s) => `${s.ft} · ${s.voteTask || ''} · ${s.src}`).join('；');
    const rel = w.dateMode === 'rel'
      ? `<div class="otm2-rel">${otm2Esc(w.date)}<br>基准：${otm2Esc(w.base)}<br>计算：${otm2Esc(w.calc)}</div>`
      : otm2Esc(w.date);
    return `<div class="vt2-wi" data-otm2-wid="${w.id}">
      <div class="vt2-row"><span class="k">Work Item</span><span>${otm2Esc(w.name)}　${w.ai ? '🤖 AI' : '✍️ 人工'}</span></div>
      <div class="vt2-row"><span class="k">Description</span><span>${otm2Esc(w.desc)}</span></div>
      <div class="vt2-row"><span class="k">Target Date</span><span>${rel}</span></div>
      <div class="vt2-row"><span class="k">Function Team</span><span>${otm2Esc(w.ft)}</span></div>
      <div class="vt2-row"><span class="k">Task Owner</span><span>${otm2Esc(w.owner)}</span></div>
      <div class="vt2-row"><span class="k">当前状态</span><span>${otm2Esc(w.status)}</span></div>
      <div class="vt2-src">来源：${otm2Esc(srcs)} ${OTM2_TIP('otm2Trace', 90)}</div>
    </div>`;
  }

  function otm2WiEdit(w) {
    const canSave = !!(w.name && w.desc && w.date && w.owner && w.ft);
    const srcs = (w.sources || []).map((s) => s.ft + ' ' + s.src).join('；') || '手动添加';
    return `<div class="vt2-wi" data-otm2-wid="${w.id}">
      <div class="vt2-row"><span class="k">Work Item</span><input data-otm2-f="name" placeholder="请输入" value="${otm2Esc(w.name)}"></div>
      <div class="vt2-row"><span class="k">Description</span><textarea data-otm2-f="desc" rows="2" placeholder="请输入">${otm2Esc(w.desc)}</textarea></div>
      <div class="vt2-row vt2-date-row"><span class="k">Target Date</span>
        <div class="vt2-date-line">
          <input data-otm2-f="date" placeholder="请选择或输入" value="${otm2Esc(w.date)}">
          <label><input type="radio" name="otm2_dm_${w.id}" value="abs" ${w.dateMode === 'abs' ? 'checked' : ''}> Absolute Date</label>
          <label><input type="radio" name="otm2_dm_${w.id}" value="rel" ${w.dateMode === 'rel' ? 'checked' : ''}> Relative Date</label>
        </div>
      </div>
      ${w.dateMode === 'rel' ? `<div class="otm2-rel" style="margin-left:106px">基准：${otm2Esc(w.base || '基准日待定')}<br>计算：${otm2Esc(w.calc || '预计 ' + (w.absDate || ''))} ${OTM2_TIP('otm2RelDate', 91)}</div>` : ''}
      <div class="vt2-row"><span class="k">Function Team</span><select data-otm2-f="ft"><option>Development</option><option>BOM</option><option>TPMDM</option><option>Planner</option></select></div>
      <div class="vt2-row"><span class="k">Task Owner</span><select data-otm2-f="owner"><option value="">请选择</option><option>test@lenovo.com</option><option>test29@lenovo.com</option><option>huangxl16@lenovo.com</option></select></div>
      <div class="vt2-src">来源：${otm2Esc(srcs)}</div>
      <div class="type-acts">
        <button class="btn btn-ghost" type="button" data-otm2-wix="${w.id}">取消</button>
        <button class="btn btn-primary" type="button" data-otm2-wis="${w.id}" ${canSave ? '' : 'disabled'}>保存</button>
      </div>
    </div>`;
  }

  function otm2CheckFtHtml(ft) {
    const v = OTM2_VOTES.find((x) => x.ft === ft);
    if (!v) return '';
    if (!v.check) {
      return `<div class="pcheck warn in"><span class="ck">⚠</span><div><b>${ft}</b>　Vote Task 未提交，无校验结果</div></div>`;
    }
    const c = v.check;
    return `<div>
      <div class="pcheck ${c.req.length ? 'err' : 'ok'} in"><span class="ck">${c.req.length ? '✗' : '✓'}</span><div><b>Required Dimension 完整性</b>　${c.req.length ? '✗ ' + c.req.length + ' 项未填' : '✓ 已覆盖'}${c.req.length ? '<div>' + c.req.map((x) => '· ' + x).join('<br>') + '</div>' : ''}</div></div>
      <div class="pcheck ${c.mp.length ? 'warn' : 'ok'} in"><span class="ck">${c.mp.length ? '⚠' : '✓'}</span><div><b>Missing Points Check</b>　${c.mp.length ? '⚠ ' + c.mp.length + ' 项（已 Ignore）' : '✓ 通过'}${c.mp.length ? '<div>' + c.mp.map((x) => '· ' + x).join('<br>') + '</div>' : ''}</div></div>
      <div class="pcheck ${c.cr ? 'err' : 'ok'} in"><span class="ck">${c.cr ? '✗' : '✓'}</span><div><b>Control Run Validation</b>　${c.cr ? '✗ 不匹配' : '✓ 匹配'}${c.cr ? '<div>' + otm2Esc(c.cr) + '</div>' : ''}</div></div>
      <div class="pcheck ok in"><span class="ck">✓</span><div><b>Work Item Generation</b>　✓ 已执行</div></div>
      <div class="pcheck ok in"><span class="ck">✓</span><div><b>Work Item 确认状态</b>　✓ 已确认</div></div>
      <div class="pcheck info in"><span class="ck">·</span><div>校验时间　${c.at}　·　规则版本 ${c.ver}</div></div>
      ${v.submit === 'force' ? '<div class="type-warn">⚠ 强制提交不等于校验通过</div>' : ''}
    </div>`;
  }

  function otm2HardBlock(w) {
    const miss = [];
    if (!String(w.desc || '').trim()) miss.push('Description 为空');
    if (!w.ft) miss.push('Function Team 无效');
    if (!w.owner) miss.push('Task Owner 无效');
    if (!String(w.date || '').trim()) miss.push('Target Date 无法识别');
    return miss;
  }

  function otm2Body(id) {
    const st = otm2St();
    if (id === 'summary') {
      const fil = st.voteFilter;
      const votes = OTM2_VOTES.filter((v) => {
        if (fil === 'dis') return v.vote === 'Disagree';
        if (fil === 'open') return !v.vote;
        if (fil === 'chk') return v.submit === 'force';
        if (fil === 'force') return v.submit === 'force';
        return true;
      });
      const wis = otm2ActiveWis();
      return `<div class="otm2-sec" data-otm2-sec="a"><div class="otm2-sec-t">区域 A · Vote Task 结果汇总 ${OTM2_TIP('otm2NoImpact', 86)}</div>
        <div class="otm2-fil">
          <button type="button" class="btn btn-ghost ${fil === 'all' ? 'on' : ''}" data-otm2-fil="all">全部 4</button>
          <button type="button" class="btn btn-ghost ${fil === 'dis' ? 'on' : ''}" data-otm2-fil="dis">反对 1</button>
          <button type="button" class="btn btn-ghost ${fil === 'open' ? 'on' : ''}" data-otm2-fil="open">未完成 1</button>
          <button type="button" class="btn btn-ghost ${fil === 'chk' ? 'on' : ''}" data-otm2-fil="chk">校验异常 1</button>
          <button type="button" class="btn btn-ghost ${fil === 'force' ? 'on' : ''}" data-otm2-fil="force">强制提交 1</button>
        </div>
        <table class="sumtab"><thead><tr><th>Function Team</th><th>Vote Result</th><th>Task Status</th><th>完整度</th><th>提交方式</th><th>Mandatory</th><th>Target Date</th><th>Submitted Time</th></tr></thead>
        <tbody>${votes.map(otm2VoteRow).join('')}</tbody></table>
        <div class="otm2-lock">点击行展开该职能完整 Comments（只读）。Comments / Task Owner 在展开区查看。</div>
      </div>
      <div class="otm2-sec" data-otm2-sec="b"><div class="otm2-sec-t">区域 B · Work Item 汇总　来自 3 个职能　${wis.length} 条 ${OTM2_TIP('otm2Trace', 90)}</div>
        ${wis.map(otm2WiRead).join('')}
      </div>
      <div class="otm2-sec" data-otm2-sec="c">${otm2RuleBox('Difference 生成规则', [
        '获取 Top 3 相似 PCR，对比当前 PCR 与相似 PCR 中相同 Function Team 的历史 Vote Comments',
        '识别 7 类差异：① 当前新增的信息 ② 当前缺失的信息 ③ 与历史处理方式不一致 ④ 新增或减少的风险 ⑤ Work Item 差异 ⑥ Control Run 结论差异 ⑦ Target Date 或行动计划差异',
        'AI 不得因历史 PCR 相似就覆盖当前 Comments 或 Work Item，差异仅供参考',
      ])}
        ${st.diffs.map((d) => `<div class="sim-card">
          <div><b>${otm2Esc(d.ft)}</b> · 与 ${otm2Esc(d.pcr)} 的差异</div>
          <div style="font-size:12.5px;line-height:1.55;margin-top:4px">差异类型：${otm2Esc(d.kind)}<br>当前：${otm2Esc(d.cur)}<br>历史：${otm2Esc(d.hist)}<br>摘要：${otm2Esc(d.sum)}</div>
          <div class="type-warn" style="white-space:normal">⚠ 仅供参考，请自行判断可比性</div>
          <div class="type-acts">OTM 处理：
            <button type="button" class="btn btn-ghost ${d.mark === '接受' ? 'on' : ''}" data-otm2-dmark="${d.id}" data-v="接受">接受</button>
            <button type="button" class="btn btn-ghost ${d.mark === '忽略' ? 'on' : ''}" data-otm2-dmark="${d.id}" data-v="忽略">忽略</button>
            <button type="button" class="btn btn-ghost ${d.mark === '待确认' ? 'on' : ''}" data-otm2-dmark="${d.id}" data-v="待确认">待确认</button>
          </div>
        </div>`).join('')}
      </div>
      <div class="otm2-sec" data-otm2-sec="d"><div class="otm2-sec-t">区域 D · Comments 校验结果继承</div>
        <div class="otm2-fil">${OTM2_VOTES.map((v) => `<button type="button" class="btn btn-ghost ${st.checkFt === v.ft ? 'on' : ''}" data-otm2-cft="${v.ft}">${v.ft}</button>`).join('')}</div>
        ${otm2CheckFtHtml(st.checkFt)}
      </div>
      <div class="pact"><button type="button" class="btn btn-primary" data-otm2="viewed">已查看，继续</button></div>`;
    }
    if (id === 'conclusion') {
      const c = otm2Covered(st.conclusion);
      const n = Object.values(c).filter(Boolean).length;
      const pct = Math.round((n / 5) * 100);
      const rows = [
        ['overall', '总体结论'],
        ['votes', '投票结果与 Comments'],
        ['except', '反对、未完成及校验异常'],
        ['hist', '历史 PCR 差异'],
        ['wi', 'Work Item 与待办'],
      ];
      return `${OTM2_TIP('otm2Split', 85)}
        <div class="prule"><div class="prule-t">🔒 只读参考区</div>
          <div class="otm2-lock">Vote Task 原始结果与 Comments · 未完成任务 · Disagree · 强制提交与校验异常 · 历史相似 PCR 及 Difference</div>
          <div class="otm2-lock">🔒 以上为原始记录，不可修改 ${OTM2_TIP('otm2NoDissolve', 84)}</div>
          <button type="button" class="btn btn-ghost" data-otm2="togglelock">${st.lockOpen ? '收起原始记录' : '展开查看原始记录'}</button>
          ${st.lockOpen ? `<div style="margin-top:8px">${otm2AlertHtml()}<table class="sumtab"><tbody>${OTM2_VOTES.map(otm2VoteRow).join('')}</tbody></table></div>` : ''}
        </div>
        <div class="to-row" style="margin:8px 0 4px"><span class="to-name">✎ Assessment Conclusion</span>${otm2DraftTag()}</div>
        <div class="type-acts">
          <button type="button" class="btn btn-ghost" data-otm2="regen">⟳ 重新生成</button>
          <button type="button" class="btn btn-ghost" data-otm2="diff">⇄ 版本对比</button>
        </div>
        <div class="otm2-cmt" id="otm2_cmt" ${state[OTM2_ID].done ? '' : 'contenteditable="true"'}>${otm2Esc(st.conclusion)}</div>
        <div id="otm2_diff_slot">${st.showDiff ? otm2DiffHtml() : ''}</div>
        ${otm2RuleBox('结论完整度检查规则', [
          '检查 Assessment Conclusion 是否覆盖以下五段',
          '① 总体结论 ② 投票结果与 Comments ③ 反对、未完成及校验异常（存在异常时为必填） ④ 历史 PCR 差异 ⑤ Work Item 与待办',
          '完整度 = 已覆盖段数 / 5',
          '此为延伸设计，需求文档未明确要求，实际规则待业务确认',
        ])}
        <div class="pfill"><span>结论完整度　${n}/5 段</span><span class="vt2-pfill-r"><span class="pbar"><i style="width:${pct}%"></i></span><span>${pct}%</span></span></div>
        ${rows.map(([k, lab]) => `<div class="pcheck ${c[k] ? 'ok' : 'err'} in"><span class="ck">${c[k] ? '✓' : '✗'}</span><div><b>${lab}</b>　${c[k] ? '已覆盖' : '未覆盖'}${!c[k] ? `　<button type="button" class="btn btn-ghost" style="padding:2px 8px;font-size:12px" data-otm2-fill="${k}">让 AI 补写</button>` : ''}</div></div>`).join('')}
        <div class="pact">
          <button type="button" class="btn btn-ghost" data-otm2="draft">保存草稿</button>
          <button type="button" class="btn btn-primary" data-otm2="concok">确认结论</button>
        </div>`;
    }
    if (id === 'wicheck') {
      const wis = otm2St().wis;
      const live = otm2ActiveWis();
      const dup = !st.dupResolved && live.some((w) => w.id === 'otm2_w2') && live.some((w) => w.id === 'otm2_w5');
      const uncovered = Object.keys(st.skip).filter((k) => st.skip[k] && !st.skip[k].reason);
      const explained = Object.keys(st.skip).filter((k) => st.skip[k] && st.skip[k].reason);
      return otm2RuleBox('Work Item 校验规则', [
        '硬阻断项（必须修正才能保存）：① Description 不为空 ② Function Team 有效 ③ Task Owner 有效 ④ Target Date 可识别 ⑨ 被删除或不采纳的 Work Item 已记录原因',
        '警告项（提示但不阻断）：⑤ Target Date 不早于合理基准日期（基准依据历史 PCR 同类 Work Item 周期）⑥ 不存在重复 Work Item（语义相似判定）⑧ 与 Control Run 结论无明显冲突',
        '需说明原因项：⑦ 所有有效 Required Action 均已被覆盖；未覆盖时必须填写原因',
      ]) + (dup ? `<div class="type-warn otm2-dup" style="white-space:normal">⚠ 检测到可能重复的 Work Item<br>① BIOS microcode 兼容性验证　来源：Development<br>② BIOS 版本兼容性测试　来源：TPMDM<br>语义相似度 87%<br>
        <button type="button" class="btn btn-ghost" data-otm2="merge">合并为一条</button>
        <button type="button" class="btn btn-ghost" data-otm2="notdup">确认不重复</button></div>` : '')
        + (uncovered.length ? uncovered.map((id) => {
          const w = wis.find((x) => x.id === id);
          return `<div class="pcheck err in"><span class="ck">✗</span><div><b>未覆盖</b>　${otm2Esc(w ? w.ra : id)}　需填写不执行原因
            <div class="vt2-row" style="margin-top:6px"><span class="k">原因</span><input data-otm2-skip="${id}" placeholder="说明为何不执行"></div>
            <button type="button" class="btn btn-ghost" data-otm2-skipok="${id}">记录原因</button></div></div>`;
        }).join('') : '')
        + explained.map((id) => {
          const w = wis.find((x) => x.id === id);
          return `<div class="pcheck wait in"><span class="ck">○</span><div><b>已说明不执行</b>　${otm2Esc(w ? w.ra : id)}　·　${otm2Esc(st.skip[id].reason)}</div></div>`;
        }).join('')
        + live.map((w) => {
          const tight = w.dateMode === 'abs' && w.date === '2026-10-25';
          return `<div>
            <label style="display:flex;align-items:center;gap:6px;margin:6px 0 0;font-size:12px;color:var(--ink-3)"><input type="checkbox" data-otm2-msel="${w.id}" ${st.mergeSel[w.id] ? 'checked' : ''}> 选择以合并</label>
            ${st.editWi === w.id || w.draftNew ? otm2WiEdit(w) : otm2WiRead(w) + `<div class="ops otm2-ops">
              <button type="button" class="btn btn-ghost" data-otm2-wie="${w.id}">✎ 编辑</button>
              <button type="button" class="btn btn-ghost" data-otm2-widl="${w.id}">✕ 删除</button>
              <button type="button" class="btn btn-ghost" data-otm2-split="${w.id}">拆分</button>
              <button type="button" class="btn btn-ghost" data-otm2-skipmark="${w.id}">标记无需执行</button>
              <button type="button" class="btn btn-ghost" data-otm2-backft="${w.id}">退回 Function Team</button>
            </div>`}
            ${tight ? '<div class="type-warn" style="white-space:normal">⚠ 历史同类平均 18 天，本次设定 10 天，偏紧</div>' : ''}
            ${w.dateMode === 'rel' ? `<div class="type-warn" style="white-space:normal">相对时间 ${OTM2_TIP('otm2RelDate', 91)}：${otm2Esc(w.date)} · 基准 ${otm2Esc(w.base)} · ${otm2Esc(w.calc)}</div>` : ''}
          </div>`;
        }).join('')
        + `<div class="pact">
          <button type="button" class="btn btn-ghost" data-otm2="addwi">＋ 新增 Work Item</button>
          <button type="button" class="btn btn-ghost" data-otm2="domerge">合并勾选</button>
          <button type="button" class="btn btn-ghost" data-otm2="checkall">校验全部</button>
        </div>`;
    }
    if (id === 'save') {
      const n = otm2ActiveWis().length;
      const skipN = Object.keys(st.skip).filter((k) => st.skip[k] && st.skip[k].reason).length;
      const blocks = otm2ActiveWis().flatMap(otm2HardBlock);
      const uncovered = Object.keys(st.skip).filter((k) => st.skip[k] && !st.skip[k].reason);
      return `<div class="sd-note">待保存：${n} 条${st.merged ? '（其中 1 条为合并后的条目）' : ''}<br>已标记不执行：${skipN} 条（已记录原因）</div>
        ${blocks.length || uncovered.length ? `<div class="type-warn" style="white-space:normal">存在硬阻断：${[...blocks, ...uncovered.map(() => '未覆盖项未填原因')].join('、')}</div>` : ''}
        <div class="pact"><button type="button" class="btn btn-primary" data-otm2="savewi" ${blocks.length || uncovered.length ? 'disabled' : ''}>保存 Work Item</button></div>`;
    }
    if (id === 'sync') {
      if (!st.decided) return `<div class="sd-note">将在完成 Assessment 决策后自动执行</div>`;
      if (st.retried) return `<div class="pcheck ok in"><span class="ck">✓</span><div>5 条已同步为 PACE Sub-task</div></div>`;
      const fail = otm2ActiveWis().find((w) => w.id === st.syncFail.id);
      return `<div class="pcheck err in"><span class="ck">✗</span><div><b>${otm2Esc(fail ? fail.name : 'Control Run')}</b>　同步失败<div>同步失败：${otm2Esc(st.syncFail.reason)}</div>
        <div class="type-acts"><button type="button" class="btn btn-ghost" data-otm2="locfail">定位到该条</button>
        <button type="button" class="btn btn-primary" data-otm2="retry">重新同步</button></div></div></div>
        <div class="otm2-lock">已成功的 4 条不再显示，避免重复同步。Sub-task 含 PCR Number、Work Item Name、Description、Function Team、Task Owner、Target Date、来源 Vote Task、来源 Comments、创建人和创建时间。</div>`;
    }
    if (id === 'decide') {
      return `<div class="submit-dock">
        <div class="sd-note">底部不平铺八个决策。先做确认前检查，再按四组选择。${OTM2_TIP('otm2Single', 88)}${OTM2_TIP('otm2Gate', 89)}</div>
        <div class="pact">
          <button type="button" class="btn btn-ghost" data-otm2="draft">保存草稿</button>
          <button type="button" class="btn btn-primary" data-otm2="decide">完成 Assessment</button>
        </div>
      </div>`;
    }
    return '';
  }

  function otm2DiffHtml() {
    const st = otm2St();
    const a = st.hist.find((h) => h.v === st.diffA) || st.hist[0];
    const b = st.hist.find((h) => h.v === st.diffB) || st.hist[st.hist.length - 1];
    const setA = new Set(a.text.split('\n'));
    const setB = new Set(b.text.split('\n'));
    let body = '';
    a.text.split('\n').forEach((ln) => { if (ln.trim() && !setB.has(ln)) body += `<div class="del">- ${otm2Esc(ln)}</div>`; });
    b.text.split('\n').forEach((ln) => { if (ln.trim() && !setA.has(ln)) body += `<div class="add">+ ${otm2Esc(ln)}</div>`; });
    const d = b.pct - a.pct;
    const opts = st.hist.map((h) => `<option value="${h.v}" ${h.v === a.v ? 'selected' : ''}>v${h.v}</option>`).join('');
    const optsB = st.hist.map((h) => `<option value="${h.v}" ${h.v === b.v ? 'selected' : ''}>v${h.v}</option>`).join('');
    return `<div class="vt2-diff"><div style="font-size:12.5px;margin:8px 0">版本对比
      <select id="otm2_diff_a">${opts}</select> → <select id="otm2_diff_b">${optsB}</select></div>
      ${body || '<div class="muted">无行级差异</div>'}
      <div style="margin-top:8px;font-size:13px">完整度 ${a.pct}% → ${b.pct}%　${d >= 0 ? '▲ +' : '▼ '}${d}%　·　${a.n}/5 段 → ${b.n}/5 段</div></div>`;
  }

  function otm2Pop(html) {
    otm2HidePop();
    const el = document.createElement('div');
    el.className = 'vt2-pop otm2-pop';
    el.id = 'otm2_pop';
    el.innerHTML = `<div class="box">${html}</div>`;
    document.body.appendChild(el);
  }
  function otm2HidePop() { document.getElementById('otm2_pop')?.remove(); }

  function otm2ApproveDisabled() {
    return { disabled: true, why: '⚠ 无法 Approve：还有 1 个 Mandatory Vote Task 未完成（Planner），且 TPMDM 投票结果为 Disagree。可选择 Conditional Approve、Pending 或 Return。' };
  }

  function otm2OpenDecide(phase, pick) {
    const st = otm2St();
    if (phase === 'check') {
      otm2Pop(`<h3>确认前检查</h3>
        <div class="pcheck err in"><span class="ck">✗</span><div>Mandatory Vote Task 全部完成　1 项未完成</div></div>
        <div class="pcheck err in"><span class="ck">✗</span><div>不存在 Disagree　1 项 Disagree</div></div>
        <div class="pcheck warn in"><span class="ck">⚠</span><div>不存在未解决的 Missing Points　4 项已 Ignore</div></div>
        <div class="pcheck err in"><span class="ck">✗</span><div>不存在 Control Run 不匹配　1 项不匹配</div></div>
        <div class="pcheck warn in"><span class="ck">⚠</span><div>不存在强制提交　1 条</div></div>
        <div class="pcheck ok in"><span class="ck">✓</span><div>Work Item 完整　${otm2ActiveWis().length} 条已确认</div></div>
        <div class="pcheck ok in"><span class="ck">✓</span><div>Owner 与 Target Date 明确　全部有效</div></div>
        <div class="type-warn" style="white-space:normal">存在异常，可选择的决策已相应限制 ${OTM2_TIP('otm2Gate', 89)}</div>
        <div class="pact" style="justify-content:flex-end"><button type="button" class="btn btn-ghost" id="otm2_pop_x">取消</button><button type="button" class="btn btn-primary" id="otm2_pop_ok">继续选择决策</button></div>`);
      document.getElementById('otm2_pop_x').onclick = otm2HidePop;
      document.getElementById('otm2_pop_ok').onclick = () => otm2OpenDecide('choose');
      return;
    }
    if (phase === 'choose') {
      const dis = otm2ApproveDisabled();
      let html = `<h3>请选择 Assessment 决策</h3><div class="type-warn" style="white-space:normal">${dis.why}</div>`;
      let last = '';
      OTM2_DECISIONS.forEach((d) => {
        if (d.g !== last) { html += `<div class="otm2-sec-t" style="margin:10px 0 6px">${d.g}</div>`; last = d.g; }
        const block = (d.id === 'awi' || d.id === 'ac');
        html += `<button type="button" class="type-opt ${d.danger ? 'danger' : ''} ${pick === d.id ? 'on' : ''}" data-otm2-dec="${d.id}" ${block ? 'disabled' : ''}>
          <span class="to-radio">${pick === d.id ? '●' : '○'}</span>
          <span class="to-main"><span class="to-row"><span class="to-name">${d.name}</span></span><div class="to-basis">${d.desc}</div></span>
        </button>`;
      });
      html += `<div class="pact" style="justify-content:flex-end;margin-top:12px"><button type="button" class="btn btn-ghost" id="otm2_pop_x">取消</button><button type="button" class="btn btn-primary" id="otm2_pop_ok" ${pick ? '' : 'disabled'}>确认并继续</button></div>`;
      otm2Pop(html);
      document.getElementById('otm2_pop_x').onclick = otm2HidePop;
      document.querySelectorAll('[data-otm2-dec]').forEach((b) => {
        b.onclick = () => otm2OpenDecide('choose', b.dataset.otm2Dec);
      });
      document.getElementById('otm2_pop_ok').onclick = () => { if (pick) otm2OpenDecide(pick === 'rj' ? 'reject2' : 'fields', pick); };
      return;
    }
    if (phase === 'reject2') {
      otm2Pop(`<h3>确认拒绝并终止？</h3><p style="color:var(--red)">Reject PCR 将终止该 PCR，需二次确认。</p>
        <div class="pact" style="justify-content:flex-end"><button type="button" class="btn btn-ghost" id="otm2_pop_x">取消</button><button type="button" class="btn btn-warnghost" id="otm2_pop_ok">仍要拒绝</button></div>`);
      document.getElementById('otm2_pop_x').onclick = () => otm2OpenDecide('choose', 'rj');
      document.getElementById('otm2_pop_ok').onclick = () => otm2OpenDecide('fields', 'rj');
      return;
    }
    const d = OTM2_DECISIONS.find((x) => x.id === pick);
    const f = st.decFields;
    const fields = {
      awi: '',
      ac: `<div class="vt2-row"><span class="k">无需 WI 原因</span><input id="otm2_f1" value="${otm2Esc(f.f1 || '')}" placeholder="必填"></div>`,
      ca: `<div class="vt2-row"><span class="k">批准条件</span><input id="otm2_f1" value="${otm2Esc(f.f1 || 'TPMDM 认证评估完成后确认')}" placeholder="必填"></div>
           <div class="vt2-row"><span class="k">负责人</span><input id="otm2_f2" value="${otm2Esc(f.f2 || 'test@lenovo.com')}" placeholder="必填"></div>
           <div class="vt2-row"><span class="k">目标日期</span><input id="otm2_f3" value="${otm2Esc(f.f3 || '2026-11-30')}" placeholder="必填"></div>`,
      pending: `<div class="vt2-row"><span class="k">Pending 原因</span><input id="otm2_f1" value="${otm2Esc(f.f1 || '')}" placeholder="必填"></div>
                <div class="vt2-row"><span class="k">等待事项</span><input id="otm2_f2" value="${otm2Esc(f.f2 || '')}" placeholder="必填"></div>
                <div class="vt2-row"><span class="k">预计恢复</span><input id="otm2_f3" value="${otm2Esc(f.f3 || '')}" placeholder="必填"></div>`,
      sp: `<div class="vt2-row"><span class="k">Proposed Solution</span><input id="otm2_f1" value="${otm2Esc(f.f1 || '')}" placeholder="必填"></div>
           <div class="vt2-row"><span class="k">待确认事项</span><input id="otm2_f2" value="${otm2Esc(f.f2 || '')}" placeholder="必填"></div>`,
      qr: `<div class="vt2-row"><span class="k">退回原因</span><input id="otm2_f1" value="${otm2Esc(f.f1 || '')}" placeholder="必填"></div>
           <div class="vt2-row"><span class="k">需修改内容</span><input id="otm2_f2" value="${otm2Esc(f.f2 || '')}" placeholder="必填"></div>`,
      rr: `<div class="vt2-row"><span class="k">退回原因</span><input id="otm2_f1" value="${otm2Esc(f.f1 || '')}" placeholder="必填"></div>
           <div class="vt2-row"><span class="k">重新 Review 原因</span><input id="otm2_f2" value="${otm2Esc(f.f2 || '')}" placeholder="必填"></div>`,
      rj: `<div class="vt2-row"><span class="k">拒绝原因</span><input id="otm2_f1" value="${otm2Esc(f.f1 || '')}" placeholder="必填"></div>`,
    };
    otm2Pop(`<h3>确认 ${otm2Esc(d.name)}</h3>${fields[pick] || ''}
      <div class="sd-note" style="margin-top:10px">PCR 状态将变更：Under_Assessment → <b>${d.to}</b><br>
      Work Item：${otm2ActiveWis().length} 条将保存并同步为 Sub-task</div>
      <div class="type-warn" style="white-space:normal">⚠ 存在 1 个 Mandatory Vote 未完成、1 个 Disagree 及 1 条强制提交记录，已在 Assessment Conclusion 中说明</div>
      <div class="pact" style="justify-content:flex-end"><button type="button" class="btn btn-ghost" id="otm2_pop_x">取消</button><button type="button" class="btn btn-primary" id="otm2_pop_ok">确认</button></div>`);
    document.getElementById('otm2_pop_x').onclick = () => otm2OpenDecide('choose', pick);
    document.getElementById('otm2_pop_ok').onclick = () => {
      const f1 = document.getElementById('otm2_f1');
      const f2 = document.getElementById('otm2_f2');
      const f3 = document.getElementById('otm2_f3');
      if (pick !== 'awi' && f1 && !f1.value.trim()) { f1.style.borderColor = 'var(--disagree)'; f1.focus(); return; }
      if ((pick === 'ca' || pick === 'pending') && f2 && !f2.value.trim()) { f2.focus(); return; }
      if ((pick === 'ca' || pick === 'pending') && f3 && !f3.value.trim()) { f3.focus(); return; }
      st.decFields = { f1: f1 ? f1.value : '', f2: f2 ? f2.value : '', f3: f3 ? f3.value : '' };
      st.decision = pick;
      st.decided = true;
      st.pcrStatus = d.to;
      TASKS[OTM2_ID].status = d.to;
      if (!st.wiSaved) { st.wiSaved = true; st.savedN = otm2ActiveWis().length; }
      st.synced = true;
      state[OTM2_ID].done = true;
      state[OTM2_ID].path = d.name;
      otm2Log('审批动作', d.name);
      otm2Log('Sub-task 同步结果', '4 成功 · 1 失败（Control Run）');
      otm2HidePop();
      st.openId = 'sync';
      toast('已确认 ' + d.name + ' · PCR → ' + d.to);
      otm2Render();
    };
  }

  function otm2RenderPlist() {
    const host = document.getElementById('otm2_plist');
    if (!host) return;
    const steps = otm2Model();
    const done = steps.filter((s) => s.st === 'done').length;
    const anyOpen = steps.some((s) => s.open);
    host.innerHTML = `<div class="plist-h" id="otm2_plist_h">
      <h3>OTM Assessment · ${OTM2_PCR}</h3>
      <span class="pcnt">${done}/6 已完成</span>
      <button type="button" class="plist-toggle" id="otm2_toggle">${anyOpen ? '▴' : '▾'}</button>
      ${OTM2_TIP('otm2NoDissolve', 84)}
    </div>`;
    steps.forEach((s, i) => {
      const row = document.createElement('div');
      row.className = 'pstep ' + s.st + (s.open ? ' open' : '') + (i === steps.length - 1 ? ' last' : '');
      row.dataset.otm2Step = s.id;
      const icon = s.st === 'done' ? '✓' : s.st === 'pending' ? '◇' : s.st === 'err' ? '!' : s.st === 'warn' ? '!' : s.st === 'run' ? '' : '○';
      row.innerHTML = `<button class="pstep-h" type="button">
        <span class="pico">${icon}</span><span class="ptt">${s.title}</span>
        <span class="psum">${otm2Esc(s.sum || '')}</span>
        <span class="chev">›</span>
        <span class="iinfo" data-otm2-info="${s.info}">ⓘ</span>
      </button><div class="pstep-b">${s.open ? otm2Body(s.id) : ''}</div>`;
      host.appendChild(row);
    });
    otm2Wire();
  }

  function otm2Render() {
    const wrap = document.getElementById('otm2_wrap');
    if (!wrap) return;
    wrap.innerHTML = otm2AlertHtml() + `<div class="plist" id="otm2_plist"></div>`;
    otm2RenderPlist();
  }

  function otm2Open(id) {
    const st = otm2St();
    const curId = otm2CurrentId();
    const order = otm2Order();
    const idx = order.indexOf(id);
    const curIdx = order.indexOf(curId);
    const doneMap = { summary: st.viewed, conclusion: st.concReady, wicheck: st.wiChecked, save: st.wiSaved, sync: st.synced, decide: st.decided };
    if (idx > curIdx && !doneMap[id]) { toast('需先完成前置步骤'); return; }
    st.openId = id;
    otm2Render();
  }

  function otm2ReadWiFields(card, w) {
    w.name = card.querySelector('[data-otm2-f=name]').value.trim();
    w.desc = card.querySelector('[data-otm2-f=desc]').value.trim();
    w.date = card.querySelector('[data-otm2-f=date]').value.trim();
    w.ft = card.querySelector('[data-otm2-f=ft]').value;
    w.owner = card.querySelector('[data-otm2-f=owner]').value;
    const mode = card.querySelector('input[type=radio]:checked');
    if (mode) w.dateMode = mode.value;
  }

  function otm2Wire() {
    const root = document.getElementById('otm2_wrap');
    if (!root) return;
    const st = otm2St();
    const s = state[OTM2_ID];
    document.getElementById('otm2_toggle')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const any = otm2Model().some((x) => x.open);
      st.openId = any ? null : otm2CurrentId();
      otm2Render();
    });
    root.querySelectorAll('.pstep-h').forEach((btn) => {
      btn.onclick = (e) => {
        if (e.target.closest('.iinfo')) return;
        const id = btn.parentElement.dataset.otm2Step;
        if (st.openId === id) { st.openId = null; otm2Render(); }
        else otm2Open(id);
      };
    });
    root.querySelectorAll('[data-otm2-info]').forEach((el) => { el.onclick = (e) => e.stopPropagation(); });
    root.querySelector('[data-otm2=togglealert]')?.addEventListener('click', () => { st.alertOpen = !st.alertOpen; otm2Render(); });
    root.querySelector('[data-otm2=goto-tpmdm]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      st.voteOpen = 'TPMDM'; st.voteFilter = 'dis'; st.openId = 'summary'; otm2Render();
    });
    root.querySelectorAll('[data-otm2-fil]').forEach((b) => { b.onclick = () => { st.voteFilter = b.dataset.otm2Fil; otm2Render(); }; });
    root.querySelectorAll('[data-otm2-ft]').forEach((tr) => {
      tr.onclick = () => { st.voteOpen = st.voteOpen === tr.dataset.otm2Ft ? null : tr.dataset.otm2Ft; otm2Render(); };
    });
    root.querySelectorAll('[data-otm2-cft]').forEach((b) => { b.onclick = () => { st.checkFt = b.dataset.otm2Cft; otm2Render(); }; });
    root.querySelectorAll('[data-otm2-dmark]').forEach((b) => {
      b.onclick = () => {
        const d = st.diffs.find((x) => x.id === b.dataset.otm2Dmark);
        if (d) { d.mark = b.dataset.v; otm2Log('Difference 标记', d.ft + ' → ' + d.mark); otm2Render(); }
      };
    });
    root.querySelector('[data-otm2=viewed]')?.addEventListener('click', () => { st.viewed = true; st.openId = 'conclusion'; otm2Log('查看汇总', '已查看四区汇总'); otm2Render(); });
    root.querySelector('[data-otm2=togglelock]')?.addEventListener('click', () => { st.lockOpen = !st.lockOpen; otm2Render(); });
    const cmt = document.getElementById('otm2_cmt');
    if (cmt && !s.done) {
      cmt.oninput = () => { st.conclusion = cmt.innerText; s.comment = st.conclusion; st.concDirty = true; };
    }
    root.querySelector('[data-otm2=diff]')?.addEventListener('click', () => { st.showDiff = !st.showDiff; otm2Render(); });
    document.getElementById('otm2_diff_a')?.addEventListener('change', (e) => { st.diffA = Number(e.target.value); otm2Render(); });
    document.getElementById('otm2_diff_b')?.addEventListener('change', (e) => { st.diffB = Number(e.target.value); otm2Render(); });
    root.querySelector('[data-otm2=regen]')?.addEventListener('click', () => {
      if (st.concDirty && !confirm('将覆盖你已编辑的内容，是否继续？')) return;
      st.hist.push({ v: st.ver, at: '草稿', text: st.conclusion, pct: otm2Pct(st.conclusion), n: Object.values(otm2Covered(st.conclusion)).filter(Boolean).length });
      st.ver += 1;
      st.conclusion = OTM2_CONCLUSION;
      s.comment = OTM2_CONCLUSION;
      st.showDiff = true;
      st.diffA = st.ver - 1; st.diffB = st.ver;
      st.hist.push({ v: st.ver, at: '当前', text: OTM2_CONCLUSION, pct: 100, n: 5 });
      otm2Log('重新生成', 'Assessment Conclusion v' + st.ver);
      toast('已重新生成草稿');
      otm2Render();
    });
    root.querySelectorAll('[data-otm2-fill]').forEach((b) => {
      b.onclick = () => {
        if (b.dataset.otm2Fill === 'hist' && !/【历史 PCR 差异】/.test(st.conclusion)) st.conclusion = st.conclusion.trim() + '\n\n' + OTM2_HIST_BLOCK;
        else if (b.dataset.otm2Fill === 'except') st.conclusion = OTM2_CONCLUSION;
        else st.conclusion = OTM2_CONCLUSION;
        s.comment = st.conclusion;
        toast('已补写段落');
        otm2Render();
      };
    });
    root.querySelector('[data-otm2=draft]')?.addEventListener('click', () => { toast('草稿已保存在本会话，未写回 PACE'); otm2Log('保存草稿', 'Assessment 草稿'); });
    root.querySelector('[data-otm2=concok]')?.addEventListener('click', () => {
      const miss = otm2MissingExcept(st.conclusion);
      const c = otm2Covered(st.conclusion);
      if (!c.except) {
        toast('存在异常时第三段不得为空');
        return;
      }
      const go = () => { st.concReady = true; st.openId = 'wicheck'; otm2Log('OTM 确认结论', 'v' + st.ver); otm2Render(); };
      if (miss.length) {
        otm2Pop(`<h3>结论中未提及以下异常</h3>${miss.map((x) => `<div class="pcheck warn in"><span class="ck">⚠</span><div>${otm2Esc(x)}</div></div>`).join('')}
          <p style="font-size:13px;color:var(--ink-2)">这些异常在只读参考区中仍然保留，但结论文本中未体现。确认要这样提交吗？</p>
          <div class="pact" style="justify-content:flex-end"><button type="button" class="btn btn-ghost" id="otm2_pop_x">返回补充</button><button type="button" class="btn btn-primary" id="otm2_pop_ok">确认提交</button></div>`);
        document.getElementById('otm2_pop_x').onclick = otm2HidePop;
        document.getElementById('otm2_pop_ok').onclick = () => { otm2HidePop(); go(); };
        return;
      }
      go();
    });
    root.querySelector('[data-otm2=merge]')?.addEventListener('click', () => {
      const a = st.wis.find((w) => w.id === 'otm2_w2');
      const b = st.wis.find((w) => w.id === 'otm2_w5');
      if (!a || !b || a.removed || b.removed) return;
      a.desc = a.desc + '\n' + b.desc;
      a.sources = [...(a.sources || []), ...(b.sources || [])];
      b.removed = true;
      st.dupResolved = true; st.merged = true;
      otm2Log('Work Item 合并', 'BIOS 两条合并，保留 Development 与 TPMDM 来源');
      toast('已合并为一条，并保留两个来源标注');
      otm2Render();
    });
    root.querySelector('[data-otm2=notdup]')?.addEventListener('click', () => { st.dupResolved = true; st.notDup = true; otm2Log('确认不重复', 'BIOS 两条保持独立'); otm2Render(); });
    root.querySelector('[data-otm2=domerge]')?.addEventListener('click', () => {
      const ids = Object.keys(st.mergeSel).filter((k) => st.mergeSel[k]);
      if (ids.length < 2) { toast('请勾选至少两条再合并'); return; }
      const keep = st.wis.find((w) => w.id === ids[0]);
      ids.slice(1).forEach((id) => {
        const w = st.wis.find((x) => x.id === id);
        if (!w) return;
        keep.desc = (keep.desc || '') + '\n' + (w.desc || '');
        keep.sources = [...(keep.sources || []), ...(w.sources || [])];
        w.removed = true;
      });
      st.merged = true; st.mergeSel = {};
      otm2Log('Work Item 合并', ids.join('+'));
      toast('已合并并保留全部来源');
      otm2Render();
    });
    root.querySelectorAll('[data-otm2-msel]').forEach((c) => { c.onchange = () => { st.mergeSel[c.dataset.otm2Msel] = c.checked; }; });
    root.querySelectorAll('[data-otm2-wie]').forEach((b) => { b.onclick = () => { st.editWi = b.dataset.otm2Wie; otm2Render(); }; });
    root.querySelectorAll('[data-otm2-wix]').forEach((b) => {
      b.onclick = () => {
        const w = st.wis.find((x) => x.id === b.dataset.otm2Wix);
        if (w && w.draftNew) st.wis = st.wis.filter((x) => x.id !== w.id);
        st.editWi = null; otm2Render();
      };
    });
    root.querySelectorAll('[data-otm2-wis]').forEach((b) => {
      b.onclick = () => {
        const card = b.closest('.vt2-wi');
        const w = st.wis.find((x) => x.id === b.dataset.otm2Wis);
        if (!w || !card) return;
        otm2ReadWiFields(card, w);
        const miss = otm2HardBlock(w);
        if (miss.length) { toast('硬阻断：' + miss.join('、')); return; }
        w.draftNew = false; st.editWi = null;
        otm2Log('Work Item 修改', w.name);
        otm2Render();
      };
    });
    root.querySelectorAll('[data-otm2-widl], [data-otm2-skipmark]').forEach((b) => {
      b.onclick = () => {
        const id = b.dataset.otm2Widl || b.dataset.otm2Skipmark;
        const w = st.wis.find((x) => x.id === id);
        if (!w) return;
        w.removed = true;
        st.skip[id] = st.skip[id] || { reason: '' };
        st.wiChecked = false;
        otm2Log('删除/不执行', w.name);
        toast('Required Action 未覆盖，请填写原因');
        otm2Render();
      };
    });
    root.querySelectorAll('[data-otm2-skipok]').forEach((b) => {
      b.onclick = () => {
        const inp = root.querySelector(`[data-otm2-skip="${b.dataset.otm2Skipok}"]`);
        if (!inp || !inp.value.trim()) { toast('请填写不执行原因'); return; }
        st.skip[b.dataset.otm2Skipok] = { reason: inp.value.trim() };
        otm2Log('已说明不执行', inp.value.trim());
        otm2Render();
      };
    });
    root.querySelectorAll('[data-otm2-split]').forEach((b) => {
      b.onclick = () => {
        const w = st.wis.find((x) => x.id === b.dataset.otm2Split);
        if (!w) return;
        const nw = { ...w, id: 'otm2_w' + Date.now(), name: w.name + ' (2)', desc: '', draftNew: true, ai: false, sources: [...(w.sources || [])] };
        st.wis.push(nw); st.editWi = nw.id;
        otm2Log('拆分', w.name);
        otm2Render();
      };
    });
    root.querySelectorAll('[data-otm2-backft]').forEach((b) => {
      b.onclick = () => { toast('已退回对应 Function Team 确认（原型）'); otm2Log('退回 Function Team', b.dataset.otm2Backft); };
    });
    root.querySelector('[data-otm2=addwi]')?.addEventListener('click', () => {
      const id = 'otm2_w' + Date.now();
      st.wis.push({ id, name: '', desc: '', date: '', dateMode: 'abs', ft: 'Development', owner: '', status: '待确认', ai: false, draftNew: true, src: '手动添加', sources: [{ ft: 'Development', src: '手动添加', ra: '手动添加', voteTask: '' }] });
      st.editWi = id;
      otm2Render();
    });
    root.querySelector('[data-otm2=checkall]')?.addEventListener('click', () => {
      const blocks = otm2ActiveWis().flatMap(otm2HardBlock);
      const uncovered = Object.keys(st.skip).filter((k) => st.skip[k] && !st.skip[k].reason);
      if (blocks.length || uncovered.length) { toast('校验未通过：请处理硬阻断与未覆盖原因'); return; }
      st.wiChecked = true;
      st.openId = 'save';
      otm2Log('重新校验', 'Work Item 全部校验通过');
      toast('校验通过');
      otm2Render();
    });
    root.querySelector('[data-otm2=savewi]')?.addEventListener('click', () => {
      st.wiSaved = true;
      st.savedN = otm2ActiveWis().length;
      st.openId = 'decide';
      otm2Log('保存 Work Item', st.savedN + ' 条');
      toast('已保存 ' + st.savedN + ' 条 Work Item');
      otm2Render();
    });
    root.querySelector('[data-otm2=locfail]')?.addEventListener('click', () => { st.openId = 'wicheck'; st.editWi = st.syncFail.id; otm2Render(); });
    root.querySelector('[data-otm2=retry]')?.addEventListener('click', () => {
      st.retried = true;
      otm2Log('单条重试', 'Control Run 同步成功');
      toast('已重新同步 Control Run');
      otm2Render();
    });
    root.querySelector('[data-otm2=decide]')?.addEventListener('click', () => otm2OpenDecide('check'));
    root.querySelectorAll('select[data-otm2-f=ft]').forEach((sel) => {
      const w = st.wis.find((x) => x.id === sel.closest('.vt2-wi')?.dataset.otm2Wid);
      if (w) sel.value = w.ft || 'Development';
    });
    root.querySelectorAll('select[data-otm2-f=owner]').forEach((sel) => {
      const w = st.wis.find((x) => x.id === sel.closest('.vt2-wi')?.dataset.otm2Wid);
      if (w) sel.value = w.owner || '';
    });
  }

  async function otm2PlayIntro() {
    const st = otm2St();
    if (st.playedIntro) return;
    st.playedIntro = true;
    const dm = otm2Dm();
    const root = document.getElementById('centerBody');
    if (dm) dm.bindSkip(root);
    const secs = [...document.querySelectorAll('[data-otm2-sec]')];
    secs.forEach((el) => { el.style.opacity = '0'; el.style.transform = 'translateY(6px)'; });
    for (const el of secs) {
      if (dm) await dm.sleep(dm.isSkipping() ? 0 : 250);
      el.style.transition = 'opacity .3s, transform .3s';
      el.style.opacity = '1';
      el.style.transform = 'none';
    }
    const rows = [...document.querySelectorAll('#otm2_plist .sumtab tbody tr[data-otm2-ft]')];
    const last = rows.filter((r) => r.classList.contains('err') || r.classList.contains('warn'));
    const first = rows.filter((r) => last.indexOf(r) < 0);
    [...first, ...last].forEach((r) => { r.style.opacity = '0'; });
    for (const r of first) {
      if (dm) await dm.sleep(dm.isSkipping() ? 0 : 120);
      r.style.transition = 'opacity .25s'; r.style.opacity = '1';
    }
    if (dm) await dm.sleep(dm.isSkipping() ? 0 : 400);
    for (const r of last) {
      if (dm) await dm.sleep(dm.isSkipping() ? 0 : 280);
      r.style.transition = 'opacity .3s'; r.style.opacity = '1';
    }
  }

  function otm2MountCenter(t, s, isReview) {
    otm2EnsureTask();
    const body = document.getElementById('centerBody');
    const st = otm2St();
    const follow = (s.chat || []).map((m) => m.role === 'user'
      ? `<div class="bub me">${otm2Esc(m.text)}</div>`
      : `<div class="ai-lead task-follow"><div class="ai">AI</div><div class="txt">${m.html || otm2Esc(m.text)}</div></div>`).join('');
    body.innerHTML = `<div class="task-thread" id="taskThread">
      <div class="task-ai">
        <div class="ai-lead"><div class="ai">AI</div><div class="txt">这是 <b>OTM Assessment Task</b>（${OTM2_PCR} · Hardware/SBB_CPU）。顶部异常不可关闭。Disagree、未完成与强制提交必须保留在结论中，不得汇总成「整体同意」。${OTM2_TIP('otm2NoDissolve', 84)}</div></div>
        <div class="parse-ai"><div id="otm2_wrap"></div></div>
      </div>
      ${follow}
    </div>`;
    if (!st.viewed) st.openId = 'summary';
    otm2Render();
    if (!st.playedIntro) otm2PlayIntro();
    if (isReview || s.done) body.querySelectorAll('[contenteditable]').forEach((el) => { el.contentEditable = 'false'; });
  }

  function otm2RenderCtx() {
    const t = TASKS[OTM2_ID];
    const body = document.getElementById('ctxBody');
    if (!t || !body) return false;
    const dlSvg = `<svg class="i" style="width:14px;height:14px"><path d="M8 2v8M5 7.5L8 10.5l3-3M3 13h10"/></svg>`;
    if (typeof ctxTab === 'undefined' || ctxTab === 'detail') {
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
          <dt>Status</dt><dd>${otm2St().pcrStatus}</dd>
        </dl></div></div>
        <div class="sec" data-sec>
          <div class="sec-h"><span class="caret">▾</span>Process Progress &amp; Monitoring</div>
          <div class="sec-c">${typeof renderProcessProgress === 'function' ? renderProcessProgress(t) : ''}</div>
        </div>
        <div class="sec" data-sec>
          <div class="sec-h"><span class="caret">▾</span>Change Request in Detail</div>
          <div class="sec-c"><div style="font-size:12.5px;line-height:1.6">${t.change}</div></div>
        </div>`;
    } else if (ctxTab === 'similar') {
      const sim = (typeof SIM !== 'undefined' && SIM[OTM2_ID]) || [];
      body.innerHTML = sim.map((x) => `<div class="simcard"><div class="simcard-top"><span class="mono">${x.pcr}</span><span class="sim%">${x.s}</span></div><h5>${x.n}</h5><div class="sm">${(x.m || []).map((m) => `<span>· ${m}</span>`).join('')}</div></div>`).join('');
    } else if (ctxTab === 'approval') {
      const ops = otm2St().ops.map((o) => `<div class="evi"><span class="en">·</span><div class="ec"><div><b>${otm2Esc(o.kind)}</b>　${otm2Esc(o.text)}</div><span class="src">${otm2Esc(o.at)}</span></div></div>`).join('') || '<div class="muted">暂无本任务操作记录</div>';
      body.innerHTML = (typeof renderApprovalHistoryHtml === 'function' ? renderApprovalHistoryHtml(t) : '') + `<div class="sec"><div class="sec-h">OTM Assessment 操作记录</div><div class="sec-c">${ops}</div></div>`;
      if (typeof wireApprovalHistory === 'function') wireApprovalHistory();
    } else {
      const ev = (typeof EVI !== 'undefined' && EVI[OTM2_ID]) || [];
      body.innerHTML = ev.map((e, i) => `<div class="evi"><span class="en">${i + 1}</span><div class="ec"><div>${e.t}</div><span class="src">${e.s}</span></div></div>`).join('');
    }
    body.querySelectorAll('[data-sec] .sec-h').forEach((h) => { h.onclick = () => h.parentElement.classList.toggle('collapsed'); });
    return true;
  }

  window.OtmV2 = {
    isV2(id) { return id === OTM2_ID || !!(typeof TASKS !== 'undefined' && TASKS[id] && TASKS[id].otmV2); },
    stepInfo(key) { return OTM2_INFO[key] || null; },
    mountCenter: otm2MountCenter,
    renderCtx: otm2RenderCtx,
    handleAsk(v) {
      const s = state[OTM2_ID];
      s.chat = s.chat || [];
      s.chat.push({ role: 'user', text: v });
      let reply = 'Disagree、未完成与强制提交必须保留在结论中，不能改写成整体同意。';
      if (/补写|完整度|历史/.test(v)) {
        otm2St().conclusion = OTM2_CONCLUSION;
        reply = '已按五段结构补全 Assessment Conclusion 草稿，第三段仍包含四项异常。';
      }
      s.chat.push({ role: 'ai', text: reply, html: otm2Esc(reply) });
      if (typeof renderCenter === 'function') renderCenter();
    },
  };

  otm2EnsureTask();
})();
