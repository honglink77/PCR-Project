/* overview/odm-gantt: ODM 执行项目健康度甘特图（纯 CSS/HTML） */
(function () {
  const ACT = {
    geo: { key: 'geo', label: 'Geo related', color: '#7A93B8' },
    pa: { key: 'pa', label: 'PA test', color: '#8B7FA8' },
    mfg: { key: 'mfg', label: 'Mfg Control run', color: '#6E9B9B' },
  };
  const WEEKS = 12;
  const TODAY_WEEK = 6; // 1-based，对齐演示冲突周

  /** 9 个进行中项目：与首页健康度 4/3/2 及既有 PCR 一致 */
  const PROJECTS = [
    {
      id: 'p1', name: 'X1 Carbon G13 CPU 换代', pcr: 'PCR-2026-08871', health: 'watch',
      acts: [
        { type: 'geo', w0: 1, w1: 3, owner: 'ODM-A', status: '进行中' },
        { type: 'pa', w0: 4, w1: 7, owner: 'QA / ODM', status: '进行中' },
        { type: 'mfg', w0: 8, w1: 9, owner: 'ODM-A', status: '未开始' },
      ],
      milestones: ['BOM 冻结', 'PA 抽样完成', '试产'],
      wis: ['认证矩阵更新', 'BIOS 验证', 'ODM 回写'],
      risks: ['认证窗口紧张'],
    },
    {
      id: 'p2', name: 'M90q G6 DDR5 二供导入', pcr: 'CP-2026-04412', health: 'risk',
      acts: [
        { type: 'geo', w0: 1, w1: 2, owner: 'ODM-B', status: '已完成' },
        { type: 'pa', w0: 3, w1: 8, owner: 'QA', status: '进行中' },
        { type: 'mfg', w0: 9, w1: 11, owner: 'ODM-B', status: '未开始' },
      ],
      milestones: ['二供 BOM', 'PA 通过', '量产切换'],
      wis: ['BOM 建立（逾期）', '物料认证', '采购计划'],
      risks: ['ODM 侧 BOM 回写滞后'],
    },
    {
      id: 'p3', name: 'T14 G6 面板二供', pcr: 'PCR-2026-08830', health: 'risk',
      acts: [
        { type: 'geo', w0: 1, w1: 4, owner: 'ODM-C', status: '已完成' },
        { type: 'pa', w0: 5, w1: 7, owner: 'OD', status: '逾期', overdue: 4 },
      ],
      milestones: ['面板导入', '采购计划'],
      wis: ['OD 采购计划（逾期 4 天）', 'ODM 状态回写'],
      risks: ['ODM 连续两周未更新状态'],
    },
    {
      id: 'p4', name: 'T14p CPU SKU 变更', pcr: 'SP20250825_0001', health: 'ok',
      acts: [
        { type: 'geo', w0: 2, w1: 4, owner: 'ODM-A', status: '已完成' },
        { type: 'pa', w0: 5, w1: 8, owner: 'QA', status: '进行中' },
        { type: 'mfg', w0: 9, w1: 10, owner: 'ODM-A', status: '未开始' },
      ],
      milestones: ['SKU 清单确认', '试产'],
      wis: ['工程变更单', '测试计划'],
      risks: [],
    },
    {
      id: 'p5', name: 'X1 Yoga G9 面板切换', pcr: 'PCR-2026-08903', health: 'watch',
      acts: [
        { type: 'pa', w0: 3, w1: 6, owner: 'QA', status: '进行中' },
        { type: 'mfg', w0: 6, w1: 8, owner: 'ODM-A', status: '进行中' },
      ],
      milestones: ['面板切换验证', '试产'],
      wis: ['供应商切换评估'],
      risks: ['与 T16p 试产同周'],
    },
    {
      id: 'p6', name: 'Legion Pro 7i 散热升级', pcr: 'CP-2026-04455', health: 'ok',
      acts: [
        { type: 'geo', w0: 1, w1: 2, owner: 'Portfolio', status: '已完成' },
        { type: 'pa', w0: 4, w1: 6, owner: 'Thermal', status: '进行中' },
        { type: 'mfg', w0: 7, w1: 9, owner: 'ODM-D', status: '未开始' },
      ],
      milestones: ['散热方案确认', '试产'],
      wis: ['三风扇模块导入'],
      risks: [],
    },
    {
      id: 'p7', name: 'T16p CPU SKU 替换', pcr: 'CP20260730_0011', health: 'ok',
      acts: [
        { type: 'pa', w0: 2, w1: 5, owner: 'QA', status: '已完成' },
        { type: 'mfg', w0: 6, w1: 8, owner: 'ODM-B', status: '进行中' },
      ],
      milestones: ['SKU 替换', '试产'],
      wis: ['投票汇总', '试产排程'],
      risks: [],
    },
    {
      id: 'p8', name: 'SR650 V3 认证扩展', pcr: 'SP-2026-11938', health: 'watch',
      acts: [
        { type: 'geo', w0: 1, w1: 6, owner: 'Certification', status: '进行中' },
        { type: 'pa', w0: 7, w1: 10, owner: 'Certification', status: '未开始' },
      ],
      milestones: ['ANATEL/BIS 送测', '证书回写'],
      wis: ['认证范围评估'],
      risks: ['跨 GEO 认证周期长'],
    },
    {
      id: 'p9', name: 'X1 Nano G7 结构件变更', pcr: 'CP-2026-04481', health: 'ok',
      acts: [
        { type: 'geo', w0: 3, w1: 5, owner: 'ODM-A', status: '进行中' },
        { type: 'pa', w0: 6, w1: 9, owner: 'QA', status: '未开始' },
        { type: 'mfg', w0: 10, w1: 12, owner: 'ODM-A', status: '未开始' },
      ],
      milestones: ['结构件打样', '试产'],
      wis: ['模具变更', '装配验证'],
      risks: [],
    },
  ];

  const HEALTH = {
    risk: { cls: 'risk', lab: '风险', dot: '🔴' },
    watch: { cls: 'watch', lab: '关注', dot: '🟡' },
    ok: { cls: 'ok', lab: '健康', dot: '🟢' },
  };

  let filterType = null; // null | geo | pa | mfg

  function esc(t) {
    return String(t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  }

  function weekLabel(w) {
    return 'W' + w;
  }

  function barStyle(act) {
    const left = ((act.w0 - 1) / WEEKS) * 100;
    const width = ((act.w1 - act.w0 + 1) / WEEKS) * 100;
    const color = ACT[act.type].color;
    const overdue = act.overdue ? ' gantt-bar-overdue' : '';
    return { left, width, color, overdue, type: act.type };
  }

  function tipText(p, act) {
    const a = ACT[act.type];
    return `${a.label} · W${act.w0}–W${act.w1} · ${act.owner} · ${act.status}${act.overdue ? ' · 逾期 ' + act.overdue + ' 天' : ''}`;
  }

  function compactHtml() {
    const nOk = PROJECTS.filter((p) => p.health === 'ok').length;
    const nWatch = PROJECTS.filter((p) => p.health === 'watch').length;
    const nRisk = PROJECTS.filter((p) => p.health === 'risk').length;
    return `<div class="hp-rows">
      <div class="hp-stat"><span>🟢 健康 ${nOk}</span><span>🟡 关注 ${nWatch}</span><span>🔴 风险 ${nRisk}</span></div>
      <div class="hp-row"><span class="hp-up">⚠</span><span>W6 有 2 项 Mfg Control run 重叠</span></div>
    </div>`;
  }

  function fullHtml() {
    const headWeeks = Array.from({ length: WEEKS }, (_, i) =>
      `<div class="gantt-wlab">${weekLabel(i + 1)}</div>`
    ).join('');
    const todayLeft = ((TODAY_WEEK - 1) / WEEKS) * 100;
    const todayMark = `<div class="gantt-today-mark" style="left:${todayLeft}%"></div>`;

    const rows = PROJECTS.map((p) => {
      const h = HEALTH[p.health];
      const bars = p.acts.map((act) => {
        const s = barStyle(act);
        const hide = filterType && filterType !== act.type ? ' is-filtered' : '';
        const overdueLab = act.overdue
          ? `<span class="gantt-overdue-lab">⚠ 逾期 ${act.overdue} 天</span>`
          : '';
        return `<div class="gantt-bar gantt-bar-${act.type}${s.overdue}${hide}"
          data-type="${act.type}" data-pid="${p.id}"
          style="left:${s.left}%;width:${s.width}%;background:${s.color}"
          title="${esc(tipText(p, act))}">${overdueLab}</div>`;
      }).join('');
      return `<div class="gantt-row" data-pid="${p.id}">
        <button type="button" class="gantt-lab" data-expand="${p.id}">
          <span class="gantt-dot ${h.cls}" title="${h.lab}">${h.dot}</span>
          <span class="gantt-lab-t">
            <span class="gantt-name">${esc(p.name)}</span>
            <span class="gantt-pcr mono">${esc(p.pcr)}</span>
          </span>
        </button>
        <div class="gantt-track">
          ${todayMark}
          ${bars}
        </div>
        <div class="gantt-detail" id="gantt-det-${p.id}" hidden>
          <div class="gantt-det-col"><b>里程碑</b><ul>${p.milestones.map((m) => `<li>${esc(m)}</li>`).join('')}</ul></div>
          <div class="gantt-det-col"><b>Work Item</b><ul>${p.wis.map((m) => `<li>${esc(m)}</li>`).join('')}</ul></div>
          <div class="gantt-det-col"><b>风险</b><ul>${(p.risks.length ? p.risks : ['无开放风险']).map((m) => `<li>${esc(m)}</li>`).join('')}</ul></div>
        </div>
      </div>`;
    }).join('');

    return `<div class="gantt-card" id="odmGanttCard">
      <div class="gantt-card-h">
        <h4>ODM 执行项目健康度</h4>
        <span class="gantt-range">近 12 周</span>
        <span class="tipdot" onclick="showTip(event,'ganttInsight',74)">74</span>
        <span class="tipdot" onclick="showTip(event,'ganttColor',75)">75</span>
      </div>
      <div class="gantt-insight"><span class="gi-ico">⚠</span>
        <span>2 个项目的 Mfg Control run 排在同一周（W6），ODM 产能可能不足，建议错开</span>
      </div>
      <div class="gantt-scroll">
        <div class="gantt-table">
          <div class="gantt-head">
            <div class="gantt-lab gantt-lab-h">项目 / PCR</div>
            <div class="gantt-weeks">
              ${headWeeks}
              <div class="gantt-today" style="left:${todayLeft}%"><span>今天</span></div>
            </div>
          </div>
          <div class="gantt-rows">${rows}</div>
        </div>
      </div>
      <div class="gantt-legend">
        ${Object.values(ACT).map((a) =>
          `<button type="button" class="gantt-leg${filterType === a.key ? ' on' : ''}" data-leg="${a.key}">
            <i style="background:${a.color}"></i>${esc(a.label)}
          </button>`
        ).join('')}
        <span class="tipdot" onclick="showTip(event,'ganttColor',75)">75</span>
      </div>
    </div>`;
  }

  function wire(root) {
    const host = root || document.getElementById('odmGanttCard');
    if (!host || host.dataset.wired) return;
    host.dataset.wired = '1';

    host.querySelectorAll('[data-expand]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.expand;
        const det = document.getElementById('gantt-det-' + id);
        if (!det) return;
        const open = det.hidden;
        host.querySelectorAll('.gantt-detail').forEach((d) => { d.hidden = true; });
        host.querySelectorAll('.gantt-row').forEach((r) => r.classList.remove('open'));
        if (open) {
          det.hidden = false;
          btn.closest('.gantt-row')?.classList.add('open');
        }
      });
    });

    host.querySelectorAll('.gantt-bar').forEach((bar) => {
      bar.addEventListener('click', (e) => {
        e.stopPropagation();
        const pid = bar.dataset.pid;
        const btn = host.querySelector(`[data-expand="${pid}"]`);
        if (btn) btn.click();
        toast(bar.getAttribute('title') || '活动详情');
      });
    });

    host.querySelectorAll('[data-leg]').forEach((leg) => {
      leg.addEventListener('click', (e) => {
        e.stopPropagation();
        const t = leg.dataset.leg;
        filterType = filterType === t ? null : t;
        host.querySelectorAll('[data-leg]').forEach((b) => b.classList.toggle('on', b.dataset.leg === filterType));
        host.querySelectorAll('.gantt-bar').forEach((b) => {
          b.classList.toggle('is-filtered', !!(filterType && b.dataset.type !== filterType));
        });
      });
    });
  }

  window.OdmGantt = {
    PROJECTS,
    ACT,
    TODAY_WEEK,
    compactHtml,
    fullHtml,
    wire,
    query: '查看进行中的 ODM 执行项目健康度',
  };
})();
