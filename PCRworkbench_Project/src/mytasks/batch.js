/* mytasks/batch: 同类任务合并处理（AI 发现的批量 Cost Vote） */

const BATCH_IDS = ['bv1', 'bv2', 'bv3', 'bv4'];
const BATCH_DEFAULT_CMT = {
  bv1: '成本无增加：X9 12Xe vPro→non-vPro 为同封装 SKU 切换，PCBA 数量不变，无 NRE。',
  bv2: '同封装 pin-to-pin 替代（Ultra 155U→165U），主板无改动，成本增量 $0。',
  bv3: '无 NRE 影响：同平台同封装 CPU SKU 替换，成本立场与同类案例一致。',
  bv4: '成本上浮约 2.1%：DDR5 颗粒二供导入，涉及供应商切换与报价差异，建议单独评估。',
};
const BATCH_DETAIL = {
  bv1: {
    summary: '将 X9 12Xe vPro (MS5) 切换为 X9 12Xe non-vPro (T6)，覆盖 ThinkPad T14p Gen 5 等 3 个机型。',
    sims: [
      { pcr: 'SP2025-0912', n: '同类 vPro→non-vPro SKU 切换', s: '91%' },
      { pcr: 'CP2025-0440', n: 'T 系列 CPU SKU 降配', s: '84%' },
    ],
  },
  bv2: {
    summary: 'Replace Intel Core Ultra 7 155U with Ultra 7 165U，ThinkPad X1 Carbon Gen 13，同封装替代。',
    sims: [
      { pcr: 'PCR-2025-07612', n: 'X1 Carbon G12 Ultra 换代', s: '94%' },
      { pcr: 'PCR-2025-03340', n: 'X1 Yoga G9 CPU 换代', s: '88%' },
    ],
  },
  bv3: {
    summary: 'CPU SKU 替换（同平台同封装），ThinkPad T16p Gen 5。',
    sims: [
      { pcr: 'CP2025-1102', n: 'T16p 同平台 CPU SKU', s: '90%' },
      { pcr: 'SP2025-0701', n: '无 NRE CPU 替换案例', s: '86%' },
    ],
  },
  bv4: {
    summary: 'DDR5 内存颗粒二供导入，ThinkCentre M90q Gen 6；供应商切换带来成本上浮。',
    sims: [
      { pcr: 'CP2025-8821', n: 'M 系列内存二供导入', s: '89%' },
      { pcr: 'SP2024-3310', n: 'DRAM dual-source 成本上浮', s: '82%' },
    ],
  },
};

var batchMode = false;
var batchDismissed = false;
let batchFailOnce = { bv3: true }; // 首次提交模拟 bv3 失败
const batchState = {
  selected: { bv1: true, bv2: true, bv3: true, bv4: false },
  votes: { bv1: 'agree', bv2: 'agree', bv3: 'agree', bv4: 'dis' },
  comments: { ...BATCH_DEFAULT_CMT },
  edited: {},
  expanded: null,
  editingCmt: null,
  results: null,
};

function batchSelectedCount() {
  return BATCH_IDS.filter((id) => batchState.selected[id]).length;
}
function voteLabel(v) {
  return { agree: 'Agree', dis: 'Disagree', ni: 'No Impact' }[v] || v;
}
function ensureBatchTasks() {
  if (TASKS.bv1) return;
  Object.assign(TASKS, {
    bv1: {
      type: 'vote', tt: 'VOTE', ttl: 'Cost Vote · X9 12Xe vPro→non-vPro',
      pcr: 'SP20260825_0002', status: 'Voting', product: 'ThinkPad T14p Gen 5 等 3 机型',
      func: 'Cost', mandatory: true, critical: false, due: '今日到期', late: false,
      change: 'Change X9 12Xe vPro (MS5) to X9 12Xe non-vPro (T6)',
      name: 'T14p G5 X9 12Xe vPro→non-vPro', geo: 'WW', date: '2026-11-20', stage: 'Voting', progress: 35, risk: 'low',
      batchable: true, batchGroup: 'cpu-sku',
    },
    bv2: {
      type: 'vote', tt: 'VOTE', ttl: 'Cost Vote · Ultra 155U→165U',
      pcr: 'SP20260812_0044', status: 'Voting', product: 'ThinkPad X1 Carbon Gen 13',
      func: 'Cost', mandatory: true, critical: false, due: '2 天后', late: false,
      change: 'Replace Intel Core Ultra 7 155U with Ultra 7 165U',
      name: 'X1 Carbon G13 Ultra 165U Cost Vote', geo: 'WW', date: '2026-11-15', stage: 'Voting', progress: 40, risk: 'low',
      batchable: true, batchGroup: 'cpu-sku',
    },
    bv3: {
      type: 'vote', tt: 'VOTE', ttl: 'Cost Vote · CPU SKU 替换',
      pcr: 'CP20260730_0011', status: 'Voting', product: 'ThinkPad T16p Gen 5',
      func: 'Cost', mandatory: true, critical: false, due: '3 天后', late: false,
      change: 'CPU SKU 替换（同平台同封装）',
      name: 'T16p G5 CPU SKU Cost Vote', geo: 'WW', date: '2026-11-18', stage: 'Voting', progress: 30, risk: 'low',
      batchable: true, batchGroup: 'cpu-sku',
    },
    bv4: {
      type: 'vote', tt: 'VOTE', ttl: 'Cost Vote · DDR5 颗粒二供',
      pcr: 'SP20260718_0203', status: 'Voting', product: 'ThinkCentre M90q Gen 6',
      func: 'Cost', mandatory: true, critical: false, due: '4 天后', late: false,
      change: 'DDR5 内存颗粒二供导入',
      name: 'M90q G6 DDR5 Dual-source Cost Vote', geo: 'WW', date: '2026-10-28', stage: 'Voting', progress: 25, risk: 'mid',
      batchable: false, batchGroup: 'memory',
    },
  });
  BATCH_IDS.forEach((id) => {
    if (!state[id]) state[id] = { vote: null, path: null, done: false, chat: [], comment: null };
  });
  if (!ORDER.includes('bv1')) ORDER.unshift(...BATCH_IDS);
  SIM.bv1 = BATCH_DETAIL.bv1.sims.map((x) => ({ ...x, m: ['Cost', 'CPU SKU'] }));
  SIM.bv2 = BATCH_DETAIL.bv2.sims.map((x) => ({ ...x, m: ['Cost', 'CPU 换代'] }));
  SIM.bv3 = BATCH_DETAIL.bv3.sims.map((x) => ({ ...x, m: ['Cost', '无 NRE'] }));
  SIM.bv4 = BATCH_DETAIL.bv4.sims.map((x) => ({ ...x, m: ['Cost', '二供'] }));
  EVI.bv1 = [{ t: BATCH_DETAIL.bv1.summary, s: '变更摘要' }];
  EVI.bv2 = [{ t: BATCH_DETAIL.bv2.summary, s: '变更摘要' }];
  EVI.bv3 = [{ t: BATCH_DETAIL.bv3.summary, s: '变更摘要' }];
  EVI.bv4 = [{ t: BATCH_DETAIL.bv4.summary, s: '变更摘要' }];
}

function renderBatchSuggest() {
  const host = document.getElementById('batchSuggest');
  if (!host) return;
  if (batchDismissed || batchMode) {
    host.hidden = true;
    host.innerHTML = '';
    return;
  }
  host.hidden = false;
  host.innerHTML = `
    <div class="batch-suggest">
      <div class="bs-ai"><span class="ai">AI</span></div>
      <div class="bs-body">
        <div class="bs-txt">你有 <b>4 条 Cost Vote</b>，其中 <b>3 条</b>为同类 CPU SKU 替换，可合并处理<span class="tipdot" onclick="showTip(event,'batchJudge',58)">58</span><span class="tipdot" onclick="showTip(event,'batchVsRisk',61)">61</span></div>
        <div class="bs-acts">
          <button type="button" class="btn btn-primary bs-merge" id="batchMergeBtn">合并处理</button>
          <button type="button" class="btn btn-ghost bs-ignore" id="batchIgnoreBtn">忽略</button>
        </div>
      </div>
    </div>`;
  host.querySelector('#batchMergeBtn').onclick = () => enterBatchMode();
  host.querySelector('#batchIgnoreBtn').onclick = () => {
    batchDismissed = true;
    renderBatchSuggest();
    toast('已忽略批量建议（本次会话）');
  };
}

function enterBatchMode() {
  ensureBatchTasks();
  batchMode = true;
  batchState.results = null;
  batchState.expanded = null;
  batchState.editingCmt = null;
  if (typeof VIEW !== 'undefined' && VIEW !== 'task') {
    switchView('task');
  }
  renderBatchSuggest();
  renderBatchCenter();
  if (typeof paintDots === 'function') paintDots();
}

function exitBatchMode(selectId) {
  batchMode = false;
  batchState.results = null;
  batchState.expanded = null;
  batchState.editingCmt = null;
  if (selectId && TASKS[selectId]) cur = selectId;
  renderTaskAll();
}

function openBatchVote(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  batchDismissed = false;
  enterBatchMode();
}

function renderBatchCenter() {
  const nSel = batchSelectedCount();
  document.getElementById('centerHead').innerHTML = `
    <div class="tb-t">
      <span class="tb-pin" title="已钉住">PCR Agent</span>
      <span class="tb-name">批量处理 · 4 条 Cost Vote</span>
    </div>
    <button type="button" class="tb-more" id="batchExitBtn" title="退出批量">▾</button>
    <span class="tipdot" onclick="showTip(event,'batchExit',60)">60</span>
    <div class="task-flowmenu" id="taskFlowMenu">
      <button type="button" data-flow="single">↩  逐条处理</button>
    </div>`;

  const rows = BATCH_IDS.map((id) => batchRowHtml(id)).join('');
  const resultHtml = batchState.results ? batchResultHtml() : '';
  document.getElementById('centerBody').innerHTML = `
    <div class="task-thread" id="taskThread">
      <div class="task-ai">
        <div class="ai-lead">
          <div class="ai">AI</div>
          <div class="txt">这 4 条中有 <b>3 条均为 Intel CPU SKU 替换</b>，从成本角度性质一致：同封装替代、无 NRE 增加、PCBA 数量不变。我已为每条生成建议立场与 Comment 草稿。
            <br><br>第 4 条为 <b>DDR5 内存颗粒二供</b>，涉及供应商切换与成本上浮，与前三条性质不同，建议单独处理，已默认不勾选。
            <span class="tipdot" onclick="showTip(event,'batchJudge',58)">58</span>
          </div>
        </div>
        <div class="batch-card">
          <div class="bc-h">
            <span>批量 Vote</span>
            <span class="bc-sel">已选 ${nSel} / 4</span>
          </div>
          <div class="bc-toolbar">
            <label class="bc-checkall"><input type="checkbox" id="batchCheckAll" ${nSel === 4 ? 'checked' : nSel === 0 ? '' : ''}> 全选</label>
            <span class="bc-bulk">批量设置立场：
              <select id="batchBulkVote">
                <option value="">全部 Agree ▾</option>
                <option value="agree">全部 Agree</option>
                <option value="dis">全部 Disagree</option>
                <option value="ni">全部 No Impact</option>
              </select>
            </span>
          </div>
          <div class="bc-table-wrap">
            <table class="bc-table">
              <thead>
                <tr>
                  <th class="c-chk"></th>
                  <th>PCR / 变更</th>
                  <th>产品</th>
                  <th>我的立场</th>
                  <th>Comment</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
          <div class="bc-rule">⚠ 原型阶段规则示例，实际合并判定规则待业务确认</div>
        </div>
        ${resultHtml}
        <div class="submit-dock">
          <div class="sd-note">AI 建议仅为草稿，确认后逐条写回 PACE<span class="tipdot" onclick="showTip(event,'batchIndep',59)">59</span></div>
          <div class="pact">
            <button class="btn btn-primary" type="button" id="batchSubmit" ${nSel ? '' : 'disabled'}>提交已选 ${nSel} 条</button>
            <button class="btn btn-ghost" type="button" id="batchToSingle">逐条处理</button>
          </div>
        </div>
      </div>
    </div>`;
  wireBatchCenter();
  bindTaskAskOnce();
}

function batchRowHtml(id) {
  const t = TASKS[id];
  const sel = !!batchState.selected[id];
  const vote = batchState.votes[id];
  const edited = !!batchState.edited[id];
  const alone = !t.batchable;
  const cmt = batchState.comments[id] || '';
  const cmtShort = cmt.length > 18 ? cmt.slice(0, 18) + '…' : cmt;
  const exp = batchState.expanded === id;
  const editing = batchState.editingCmt === id;
  const det = BATCH_DETAIL[id];
  return `
    <tr class="bc-row ${sel ? 'on' : ''} ${alone ? 'alone' : ''} ${exp ? 'open' : ''}" data-bid="${id}">
      <td class="c-chk"><input type="checkbox" data-bchk="${id}" ${sel ? 'checked' : ''}></td>
      <td class="c-pcr">
        <div class="bp-id mono">${escTask(t.pcr)}</div>
        <div class="bp-chg">${escTask(t.change)}</div>
      </td>
      <td class="c-prod">${escTask(t.product.replace('ThinkPad ', '').replace('ThinkCentre ', ''))}</td>
      <td class="c-vote">
        <select data-bvote="${id}">
          <option value="agree" ${vote === 'agree' ? 'selected' : ''}>Agree</option>
          <option value="dis" ${vote === 'dis' ? 'selected' : ''}>Disagree</option>
          <option value="ni" ${vote === 'ni' ? 'selected' : ''}>No Impact</option>
        </select>
        <div class="bv-tag ${edited ? 'mod' : alone ? 'warn' : 'ai'}">${alone ? '⚠ 建议单独处理' : edited ? '已修改' : 'AI 建议'}</div>
      </td>
      <td class="c-cmt">
        <button type="button" class="bc-cmtbtn" data-bcmt="${id}" title="编辑 Comment">${escTask(cmtShort)} ✎</button>
      </td>
    </tr>
    ${editing ? `<tr class="bc-edit" data-bedit="${id}"><td colspan="5">
      <textarea class="bc-ta" data-bta="${id}" rows="3">${escTask(cmt)}</textarea>
      <div class="bc-edit-acts">
        <button type="button" class="btn btn-primary" data-bsave="${id}">保存</button>
        <button type="button" class="btn btn-ghost" data-bcancel="${id}">取消</button>
      </div>
    </td></tr>` : ''}
    ${exp ? `<tr class="bc-detail" data-bdet="${id}"><td colspan="5">
      <div class="bd-title">PCR 详情摘要</div>
      <div class="bd-sum">${escTask(det.summary)}</div>
      <div class="bd-title">相似案例</div>
      <div class="bd-sims">${det.sims.map((s) => `<div class="bd-sim"><span class="mono">${escTask(s.pcr)}</span> ${escTask(s.n)} <span class="pct">${escTask(s.s)}</span></div>`).join('')}</div>
    </td></tr>` : ''}`;
}

function batchResultHtml() {
  const rs = batchState.results;
  if (!rs || !rs.length) return '';
  const ok = rs.filter((r) => r.ok).length;
  const fail = rs.length - ok;
  return `<div class="batch-result">
    <div class="br-h">提交结果</div>
    ${rs.map((r) => `
      <div class="br-row ${r.ok ? 'ok' : 'fail'}">
        <span class="br-mark">${r.ok ? '✓' : '✗'}</span>
        <span class="mono">${escTask(TASKS[r.id].pcr)}</span>
        <span class="br-msg">${r.ok ? '已写回 PACE' : escTask(r.err || '写回失败')}</span>
        ${r.ok ? '' : `<button type="button" class="btn btn-ghost br-retry" data-bretry="${r.id}">重试</button>`}
      </div>`).join('')}
    <div class="br-sum">${ok} 条成功${fail ? `，${fail} 条失败` : ''}<span class="tipdot" onclick="showTip(event,'batchIndep',59)">59</span></div>
  </div>`;
}

function wireBatchCenter() {
  const flowBtn = document.getElementById('batchExitBtn');
  const menu = document.getElementById('taskFlowMenu');
  if (flowBtn && menu) {
    flowBtn.onclick = (e) => {
      e.stopPropagation();
      menu.classList.toggle('show');
    };
    menu.querySelector('[data-flow=single]')?.addEventListener('click', () => exitBatchMode());
  }
  document.getElementById('batchToSingle')?.addEventListener('click', () => exitBatchMode());
  document.getElementById('batchSubmit')?.addEventListener('click', () => submitBatch());

  const all = document.getElementById('batchCheckAll');
  if (all) {
    all.indeterminate = batchSelectedCount() > 0 && batchSelectedCount() < 4;
    all.onchange = () => {
      const on = all.checked;
      BATCH_IDS.forEach((id) => { batchState.selected[id] = on; });
      renderBatchCenter();
    };
  }
  const bulk = document.getElementById('batchBulkVote');
  if (bulk) {
    bulk.onchange = () => {
      const v = bulk.value;
      if (!v) return;
      BATCH_IDS.forEach((id) => {
        if (!batchState.selected[id]) return;
        batchState.votes[id] = v;
        batchState.edited[id] = true;
      });
      bulk.value = '';
      renderBatchCenter();
    };
  }

  document.querySelectorAll('[data-bchk]').forEach((el) => {
    el.addEventListener('click', (e) => e.stopPropagation());
    el.onchange = () => {
      batchState.selected[el.dataset.bchk] = el.checked;
      renderBatchCenter();
    };
  });
  document.querySelectorAll('[data-bvote]').forEach((el) => {
    el.addEventListener('click', (e) => e.stopPropagation());
    el.onchange = () => {
      const id = el.dataset.bvote;
      batchState.votes[id] = el.value;
      batchState.edited[id] = true;
      renderBatchCenter();
    };
  });
  document.querySelectorAll('[data-bcmt]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = el.dataset.bcmt;
      batchState.editingCmt = batchState.editingCmt === id ? null : id;
      batchState.expanded = null;
      renderBatchCenter();
    });
  });
  document.querySelectorAll('[data-bsave]').forEach((el) => {
    el.onclick = (e) => {
      e.stopPropagation();
      const id = el.dataset.bsave;
      const ta = document.querySelector(`[data-bta="${id}"]`);
      if (ta) batchState.comments[id] = ta.value;
      batchState.editingCmt = null;
      renderBatchCenter();
    };
  });
  document.querySelectorAll('[data-bcancel]').forEach((el) => {
    el.onclick = (e) => {
      e.stopPropagation();
      batchState.editingCmt = null;
      renderBatchCenter();
    };
  });
  document.querySelectorAll('tr.bc-row').forEach((tr) => {
    tr.addEventListener('click', (e) => {
      if (e.target.closest('input,select,button,textarea,a')) return;
      const id = tr.dataset.bid;
      batchState.expanded = batchState.expanded === id ? null : id;
      batchState.editingCmt = null;
      renderBatchCenter();
    });
  });
  document.querySelectorAll('[data-bretry]').forEach((el) => {
    el.onclick = () => retryBatchOne(el.dataset.bretry);
  });
}

function submitBatch() {
  const ids = BATCH_IDS.filter((id) => batchState.selected[id]);
  if (!ids.length) return;
  const results = ids.map((id) => {
    const forceFail = batchFailOnce[id];
    if (forceFail) {
      batchFailOnce[id] = false;
      return { id, ok: false, err: '写回失败（网络超时）' };
    }
    state[id].vote = batchState.votes[id];
    state[id].comment = batchState.comments[id];
    state[id].done = true;
    return { id, ok: true };
  });
  batchState.results = results;
  const ok = results.filter((r) => r.ok).length;
  const fail = results.length - ok;
  toast(fail ? `${ok} 条成功，${fail} 条失败` : `已写回 ${ok} 条`);
  renderBatchCenter();
  renderTaskList();
}

function retryBatchOne(id) {
  state[id].vote = batchState.votes[id];
  state[id].comment = batchState.comments[id];
  state[id].done = true;
  if (batchState.results) {
    const row = batchState.results.find((r) => r.id === id);
    if (row) { row.ok = true; row.err = null; }
  }
  toast(`${TASKS[id].pcr} 已重试写回`);
  renderBatchCenter();
  renderTaskList();
}

// hook into existing MyTasks lifecycle
const _renderTaskList = typeof renderTaskList === 'function' ? renderTaskList : null;
const _renderTaskAll = typeof renderTaskAll === 'function' ? renderTaskAll : null;
const _renderCenter = typeof renderCenter === 'function' ? renderCenter : null;

ensureBatchTasks();

function renderTaskListBatched() {
  if (_renderTaskList) {
    // temporarily adjust: mark batch tasks normally
  }
  const host = document.getElementById('tasklist');
  if (!host) return;
  const items = filteredTaskIds();
  const countEl = document.getElementById('taskCount');
  if (countEl) countEl.textContent = items.length;
  host.innerHTML = items.map((id) => {
    const t = TASKS[id], s = state[id];
    return `<div class="task ${!batchMode && id === cur ? 'active' : ''} ${s.done ? 'done' : ''} ${BATCH_IDS.includes(id) ? 'batch-item' : ''}" data-id="${id}">
      <div class="task-top">
        <span class="ttype ${t.type}">${t.tt}</span>
        <span class="pcr mono">${t.pcr}</span>
        ${id === 'bv1' ? '<span class="tipdot" onclick="event.stopPropagation();showTip(event,\'batchJudge\',58)">58</span>' : ''}
        ${id === ORDER.find((x) => !BATCH_IDS.includes(x)) ? '<span class="tipdot" onclick="event.stopPropagation();showTip(event,\'badge\',22)">22</span>' : ''}
      </div>
      <h3>${t.ttl}</h3>
      <div class="task-meta"><span>${t.product}</span></div>
      <div class="task-meta" style="margin-top:4px">
        ${t.critical ? '<span class="flag">● Critical</span>' : ''}
        ${t.mandatory ? '<span class="m">Mandatory</span>' : ''}
        ${t.func === 'Cost' ? '<span class="m">Cost</span>' : ''}
        <span class="due ${t.late ? 'late' : ''}">${s.done ? '已完成' : t.due}</span>
      </div>
    </div>`;
  }).join('') || `<div class="task-empty">无匹配任务</div>`;
  host.querySelectorAll('.task').forEach((el) => {
    el.onclick = () => {
      cur = el.dataset.id;
      if (typeof reviewMode !== 'undefined') reviewMode = null;
      if (batchMode) exitBatchMode(cur);
      else renderTaskAll();
    };
  });
}

function renderTaskAllBatched() {
  renderTaskListBatched();
  renderBatchSuggest();
  if (batchMode) renderBatchCenter();
  else if (_renderCenter) _renderCenter();
  else renderCenter();
  if (typeof renderCtx === 'function') renderCtx();
  if (typeof paintDots === 'function') paintDots();
  if (window.Sessions && typeof TASKS !== 'undefined' && cur && TASKS[cur] && !batchMode) {
    Sessions.syncTask(cur, TASKS[cur]);
  }
}

// override
renderTaskList = renderTaskListBatched;
renderTaskAll = renderTaskAllBatched;
window.renderTaskAll = renderTaskAllBatched;
window.openBatchVote = openBatchVote;
window.enterBatchMode = enterBatchMode;
window.exitBatchMode = exitBatchMode;
window.BATCH_IDS = BATCH_IDS;
window.batchState = batchState;

if (window.MyTasks) {
  const prev = MyTasks.ensureInit;
  MyTasks.ensureInit = function () {
    ensureBatchTasks();
    if (!window.__taskInit) {
      window.__taskInit = 1;
      renderTaskAllBatched();
    } else if (batchMode) {
      renderTaskAllBatched();
    } else if (prev) prev();
  };
  MyTasks.enterBatch = enterBatchMode;
  MyTasks.exitBatch = exitBatchMode;
  MyTasks.renderAll = renderTaskAllBatched;
  const prevSelect = MyTasks.selectTask;
  MyTasks.selectTask = function (id) {
    if (batchMode) exitBatchMode(id);
    else if (prevSelect) prevSelect(id);
  };
}
