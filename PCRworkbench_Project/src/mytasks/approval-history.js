/* mytasks/approval-history: 右侧 Approval History 时间线（数据驱动，审批类任务共用） */

const CURRENT_USER = 'JC';

/** @type {Record<string, object>} PCR Number → 审批链路 */
const APPROVAL_HISTORY = {};

function buildDemoApprovalChain() {
  return {
    pcr: 'PCR-2026-08871',
    simulated: true,
    steps: [
      {
        id: 'submit',
        title: 'Submit',
        status: 'done',
        actor: 'test@lenovo.com',
        time: '01-03 09:20',
        duration: null,
      },
      {
        id: 'lm1',
        title: 'Line Manager Review',
        status: 'return',
        action: 'Return',
        actor: 'test29@lenovo.com',
        time: '01-03 16:40',
        duration: '7 小时',
        returnReason: '需补充成本收益的具体金额（原文称 better cost 但未提供金额或比例）',
        mine: false,
      },
      {
        id: 'resubmit',
        title: '提交人重新提交',
        status: 'resubmit',
        actor: 'test@lenovo.com',
        time: '01-04 10:15',
        note: '已补充成本收益说明',
      },
      {
        id: 'lm2',
        title: 'Line Manager Review',
        status: 'done',
        action: 'Approve',
        actor: 'test29@lenovo.com',
        time: '01-05 14:20',
        duration: '1 天',
        comment: `【审阅结论】
同意本次变更。属于 T14p 产品线职责范围，有明确成本优化驱动，团队可承接。

【需注意事项】
1. 补充的成本数据已确认，单机成本下降约 1.8%
2. Geo Impact 仅填 PRC，Intel SKU 变更通常为全球性，建议在后续环节确认区域范围是否完整

【依据】
Intel 已确认新 SKU 可用，pin-to-pin 替代，目标实施日尚有充足余量，工作量可控。`,
        openIssues: ['Geo Impact 仅填 PRC，区域范围是否完整至今未确认'],
        mine: false,
      },
      {
        id: 'tpm',
        title: 'TPM Review',
        status: 'concern',
        action: 'Approve with concern',
        actor: 'huangxl16@lenovo.com',
        time: '01-07 11:05',
        duration: '2 天',
        comment: `【审阅结论】
技术方案可行。X9 12Xe vPro (MS5) 与 non-vPro (T6) 为同封装 pin-to-pin 替代，主板与供电无需改动。

【需注意事项】
1. 认证影响未说明：3 个影响机型中，T14p Gen 5 与 T16p Gen 5 已完成 CCC 认证，CPU 变更可能触发重新认证，原文未提及此影响
2. BIOS microcode 支持需确认

【依据】
参考 SP20250612_0031 同类换代案例，技术路径成熟。`,
        openIssues: ['未说明认证影响，问题尚未解决'],
        mine: false,
      },
      {
        id: 'sponsor',
        title: 'Sponsor Review',
        status: 'skipped',
        action: '已跳过',
        skipReason: '变更成本低于 Sponsor 审批阈值',
      },
      {
        id: 'screen',
        title: 'OTM Screen',
        status: 'done',
        action: '通过',
        actor: 'JC',
        time: '01-09 15:30',
        duration: '2 天',
        comment: `【范围判断】
影响 3 个 ThinkPad 机型，均为同一 CPU SKU 替换动作，变更内容一致，无需拆分 Branch PCR。

【风险】
1. 认证影响未评估（来源：TPM Review Comment）
2. 成本收益已由 LM 环节补充确认

【处理决定】
正常通过，进入 Vote / Evaluation 环节。
Critical Flag：No
派发 Vote Task：Cost（必选）、BOM（必选）、Planner
派发 Evaluation Task：认证影响专项评估（TPMDM）

【依据】
TPM 提出的认证影响问题将通过专项 Evaluation Task 解决，不阻塞本阶段通过。`,
        mine: true,
        taskId: 'tScr',
      },
      {
        id: 'votes',
        title: 'Vote / Evaluation',
        status: 'group',
        summary: '4 条 · 3 Agree 1 Disagree',
        votes: [
          {
            id: 'v-cost', func: 'Cost', stance: 'Agree', actor: 'test@lenovo.com', time: '01-12',
            comment: '成本影响可控，单机下降 1.8%，无 NRE 增加。',
          },
          {
            id: 'v-bom', func: 'BOM', stance: 'Agree', actor: 'test29@lenovo.com', time: '01-12',
            comment: '物料清单变更范围清晰，3 个机型均可覆盖。',
          },
          {
            id: 'v-pl', func: 'Planner', stance: 'Agree', actor: 'huangxl16@lenovo.com', time: '01-13',
            comment: '供应计划无冲突，切换时点可配合目标实施日。',
          },
          {
            id: 'v-tpm', func: 'TPMDM', stance: 'Disagree', actor: 'test@lenovo.com', time: '01-14',
            comment: '认证专项评估结论：T14p Gen 5 与 T16p Gen 5 需重新送测，周期约 3 周，威胁 02-09 目标实施日。',
            highlight: true,
          },
        ],
      },
      {
        id: 'otm_assess',
        title: 'OTM Assessment',
        status: 'current',
        action: '进行中',
        actor: 'JC',
        time: '01-15 开始',
        durationLive: '已进行 1 天',
        youStepKey: 'otm',
      },
      {
        id: 'wi',
        title: 'Work Item / Implementation',
        status: 'pending',
        action: '未开始',
        youStepKey: 'wi',
      },
      {
        id: 'benefit',
        title: 'Benefit Tracking',
        status: 'pending',
        action: '未开始',
      },
    ],
  };
}

APPROVAL_HISTORY['PCR-2026-08871'] = buildDemoApprovalChain();
APPROVAL_HISTORY['SP20250825_0001'] = (() => {
  const c = buildDemoApprovalChain();
  c.pcr = 'SP20250825_0001';
  return c;
})();

let ahExpanded = {}; // stepId → bool for comment
let ahVoteOpen = false;
let ahVoteCmt = {};
let ahFocusStep = null;
let reviewMode = null; // { from: cur, stepId }

function ensureApprovalScreenTask() {
  if (TASKS.tScr) return;
  TASKS.tScr = {
    type: 'otm', tt: 'SCREEN', ttl: 'OTM Screen · 范围与派发（已完成）',
    pcr: 'PCR-2026-08871', status: 'Closed', product: 'ThinkPad X1 Carbon Gen 13',
    func: 'OTM', mandatory: true, critical: false, due: '已完成', late: false,
    change: 'OTM Screen：正常通过，派发 Vote / Evaluation。',
    name: 'X1 Carbon G13 · OTM Screen', geo: 'WW', date: '2026-01-09', stage: 'Screen', progress: 100, risk: 'mid',
    youStep: 'screen',
  };
  state.tScr = {
    vote: null, path: 'screen_pass', done: true, chat: [],
    comment: '正常通过，Critical Flag: No。认证影响通过 TPMDM Evaluation 跟进。',
  };
  if (!ORDER.includes('tScr')) {
    /* 不进入左侧列表，仅供审批历史「本人已完成环节」回看跳转 */
  }
}

function youStepForTask(t) {
  if (!t) return null;
  if (t.youStep) return t.youStep;
  if (t.type === 'otm' && t.tt === 'SCREEN') return 'screen';
  if (t.type === 'otm') return 'otm_assess';
  if (t.type === 'vote' || t.type === 'eval') return 'votes';
  if (t.type === 'wi') return 'wi';
  if (t.type === 'rev') return 'lm2';
  return null;
}

function approvalChainForTask(t) {
  if (!t) return null;
  return APPROVAL_HISTORY[t.pcr] || null;
}

function openIssuesForTask(t) {
  const chain = approvalChainForTask(t);
  if (!chain) return [];
  const list = [];
  chain.steps.forEach((s) => {
    (s.openIssues || []).forEach((msg) => {
      list.push({ stepId: s.id, title: s.title, msg });
    });
  });
  return list;
}

function statusMeta(st) {
  const map = {
    done: { icon: '✓', cls: 'ah-ok' },
    concern: { icon: '⚠', cls: 'ah-warn' },
    return: { icon: '✗', cls: 'ah-bad' },
    skipped: { icon: '⊘', cls: 'ah-skip' },
    current: { icon: '◐', cls: 'ah-cur' },
    pending: { icon: '○', cls: 'ah-pend' },
    resubmit: { icon: '↻', cls: 'ah-re' },
    group: { icon: '▸', cls: 'ah-grp' },
  };
  return map[st] || map.pending;
}

function truncateCmt(text, lines) {
  const parts = String(text || '').trim().split(/\n+/).filter(Boolean);
  if (parts.length <= lines) return { short: parts.join(' '), full: false };
  return { short: parts.slice(0, lines).join(' '), full: true };
}

function commentBlockHtml(id, text, prefix) {
  if (!text) return '';
  const open = !!ahExpanded[id];
  const { short, full } = truncateCmt(text, 2);
  const body = open ? escTask(text).replace(/\n/g, '<br>') : escTask(short) + (full ? '…' : '');
  return `<div class="ah-cmt ${open ? 'open' : ''}" data-ahcmt="${escTask(id)}">
    ${prefix ? `<div class="ah-cmt-pre">${escTask(prefix)}</div>` : ''}
    <div class="ah-cmt-body">${body}</div>
    ${full || open ? `<button type="button" class="ah-exp" data-ahtoggle="${escTask(id)}">${open ? '收起 ▴' : '展开 ▾'}</button>` : ''}
  </div>`;
}

function renderApprovalHistoryHtml(t) {
  const chain = approvalChainForTask(t);
  if (!chain) {
    return `<div class="ah-empty">该 PCR 尚未进入审批流程<span class="tipdot" onclick="showTip(event,'ahSplit',62)">62</span></div>
      <div class="ah-note">演示数据说明：有审批链路时展示的是原型模拟数据。</div>`;
  }
  const youKey = youStepForTask(t);
  const steps = chain.steps;
  let html = `<div class="ah-head">审批历史<span class="tipdot" onclick="showTip(event,'ahSplit',62)">62</span>
    <span class="tipdot" onclick="showTip(event,'ahConcern',63)">63</span>
    <span class="tipdot" onclick="showTip(event,'ahSkip',64)">64</span>
    <span class="tipdot" onclick="showTip(event,'ahReturn',65)">65</span></div>
    <div class="ah-sim">模拟数据 · 仅供原型演示</div>
    <div class="ah-tl" id="ahTimeline">`;

  steps.forEach((s, idx) => {
    const isLast = idx === steps.length - 1;
    const afterCurrent = (() => {
      const curIdx = steps.findIndex((x) => x.status === 'current' || x.id === youKey);
      return curIdx >= 0 && idx > curIdx;
    })();
    const lineCls = isLast ? 'none' : (s.status === 'pending' || afterCurrent ? 'dash' : 'solid');
    const meta = statusMeta(s.status === 'group' && ahVoteOpen ? 'group' : s.status);
    const clickable = !!(s.mine && s.taskId && TASKS[s.taskId]);
    const focus = ahFocusStep === s.id ? ' focus' : '';

    if (s.status === 'group') {
      const youOnVotes = youKey === 'votes';
      html += `<div class="ah-step ah-group${focus}" data-ahstep="${s.id}">
        <div class="ah-rail"><span class="ah-dot ${meta.cls}">${ahVoteOpen ? '▾' : '▸'}</span><i class="ah-line ${lineCls}"></i></div>
        <div class="ah-main">
          <button type="button" class="ah-grp-h" data-ahvotes>
            <span class="ah-title">${escTask(s.title)}${youOnVotes ? ' <span class="ah-you">（你）</span>' : ''}</span>
            <span class="ah-sum">${escTask(s.summary)}</span>
          </button>
          ${ahVoteOpen ? renderVoteDetails(s.votes) : ''}
        </div>
      </div>`;
      return;
    }

    const youTag = (s.id === youKey || (s.status === 'current' && s.youStepKey === t.type))
      ? ' <span class="ah-you">（你）</span>' : '';
    html += `<div class="ah-step${clickable ? ' mine' : ''}${focus}" data-ahstep="${s.id}" ${clickable ? `data-ahjump="${s.taskId}"` : ''}>
      <div class="ah-rail"><span class="ah-dot ${meta.cls}">${meta.icon}</span><i class="ah-line ${lineCls}"></i></div>
      <div class="ah-main">
        <div class="ah-top">
          <span class="ah-title">${escTask(s.title)}${youTag}</span>
          ${s.action ? `<span class="ah-act ${meta.cls}">${escTask(s.action)}</span>` : ''}
        </div>
        ${s.actor || s.time ? `<div class="ah-meta">${escTask([s.actor, s.time].filter(Boolean).join(' · '))}</div>` : ''}
        ${s.returnReason ? `<div class="ah-reason">退回原因：${escTask(s.returnReason)}</div>` : ''}
        ${s.skipReason ? `<div class="ah-reason">跳过原因：${escTask(s.skipReason)}</div>` : ''}
        ${s.note ? `<div class="ah-reason">${escTask(s.note)}</div>` : ''}
        ${s.comment ? commentBlockHtml(s.id, s.comment) : ''}
        ${s.duration ? `<div class="ah-dur">用时 ${escTask(s.duration)}</div>` : ''}
        ${s.durationLive ? `<div class="ah-dur live">${escTask(s.durationLive)}</div>` : ''}
        ${(s.openIssues || []).map((m) => `<div class="ah-issue">⚠ ${escTask(m.includes('尚未') ? m : m + '，问题尚未解决')}</div>`).join('')}
      </div>
    </div>`;
  });

  html += '</div>';
  return html;
}

function renderVoteDetails(votes) {
  return `<div class="ah-votes">${votes.map((v) => {
    const open = !!ahVoteCmt[v.id];
    const { short, full } = truncateCmt(v.comment, 1);
    const dis = v.stance === 'Disagree' || v.highlight;
    return `<div class="ah-vrow ${dis ? 'dis' : ''}">
      <div class="ah-vtop">
        <span class="ah-vico">${dis ? '⚠' : '✓'}</span>
        <span class="ah-vfunc">${escTask(v.func)}</span>
        <span class="ah-vstance ${dis ? 'bad' : 'ok'}">${escTask(v.stance)}</span>
        <span class="ah-vmeta">${escTask(v.actor)} · ${escTask(v.time)}</span>
      </div>
      <div class="ah-vcmt">${open ? escTask(v.comment) : escTask(short) + (full ? '…' : '')}
        ${full || open ? `<button type="button" class="ah-exp" data-ahvcmt="${v.id}">${open ? '收起 ▴' : '展开 ▾'}</button>` : ''}
      </div>
    </div>`;
  }).join('')}</div>`;
}

function wireApprovalHistory() {
  const root = document.getElementById('ctxBody');
  if (!root) return;
  root.querySelectorAll('[data-ahtoggle]').forEach((b) => {
    b.onclick = (e) => {
      e.stopPropagation();
      const id = b.dataset.ahtoggle;
      ahExpanded[id] = !ahExpanded[id];
      renderCtx();
    };
  });
  root.querySelectorAll('[data-ahvotes]').forEach((b) => {
    b.onclick = (e) => {
      e.stopPropagation();
      ahVoteOpen = !ahVoteOpen;
      renderCtx();
    };
  });
  root.querySelectorAll('[data-ahvcmt]').forEach((b) => {
    b.onclick = (e) => {
      e.stopPropagation();
      const id = b.dataset.ahvcmt;
      ahVoteCmt[id] = !ahVoteCmt[id];
      renderCtx();
    };
  });
  root.querySelectorAll('[data-ahjump]').forEach((el) => {
    el.onclick = (e) => {
      if (e.target.closest('button')) return;
      const tid = el.dataset.ahjump;
      openApprovalReview(tid, el.dataset.ahstep || el.getAttribute('data-ahstep'));
    };
  });
  if (ahFocusStep) {
    const el = root.querySelector(`[data-ahstep="${ahFocusStep}"]`);
    if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    setTimeout(() => { ahFocusStep = null; }, 1800);
  }
}

function openApprovalHistoryTab(stepId) {
  ctxTab = 'approval';
  ahFocusStep = stepId || 'tpm';
  document.querySelectorAll('.ctx-tab').forEach((x) => x.classList.toggle('on', x.dataset.t === 'approval'));
  renderCtx();
}

function openApprovalReview(taskId, stepId) {
  if (!TASKS[taskId]) return;
  reviewMode = { from: cur, stepId: stepId || null };
  cur = taskId;
  state[taskId].done = true;
  if (window.MyTasks && MyTasks.selectTask) {
    // select without exiting batch oddly
  }
  if (typeof batchMode !== 'undefined' && batchMode && typeof exitBatchMode === 'function') {
    exitBatchMode(taskId);
  } else {
    renderTaskAll();
  }
  toast('回看 · 已完成（只读）');
}

function exitApprovalReview() {
  if (!reviewMode) return;
  const back = reviewMode.from;
  reviewMode = null;
  if (back && TASKS[back]) cur = back;
  renderTaskAll();
}

function approvalAlertHtml(t) {
  const issues = openIssuesForTask(t);
  if (!issues.length) return '';
  // Prefer cert concern as primary
  const primary = issues.find((i) => /认证/.test(i.msg)) || issues[0];
  return `<div class="ah-alert">
    <div class="aha-txt">⚠ 提醒：${escTask(primary.title)} 提出「${escTask(primary.msg.replace(/，问题尚未解决$/, ''))}」，该问题至今未处理。建议在本环节一并解决，或派发专项评估。
      <span class="tipdot" onclick="showTip(event,'ahConcern',63)">63</span>
    </div>
    <button type="button" class="btn btn-ghost aha-go" data-ahgo="${escTask(primary.stepId)}">查看审批历史</button>
  </div>`;
}

ensureApprovalScreenTask();
// Mark shared PCR tasks for you-step
if (TASKS.t4) TASKS.t4.youStep = 'otm_assess';
if (TASKS.t1) TASKS.t1.youStep = 'votes';

window.openApprovalHistoryTab = openApprovalHistoryTab;
window.approvalAlertHtml = approvalAlertHtml;
window.renderApprovalHistoryHtml = renderApprovalHistoryHtml;
window.wireApprovalHistory = wireApprovalHistory;
window.openIssuesForTask = openIssuesForTask;
window.exitApprovalReview = exitApprovalReview;
window.APPROVAL_HISTORY = APPROVAL_HISTORY;
// expose reviewMode for center bar
Object.defineProperty(window, 'reviewMode', {
  get() { return reviewMode; },
  set(v) { reviewMode = v; },
});
