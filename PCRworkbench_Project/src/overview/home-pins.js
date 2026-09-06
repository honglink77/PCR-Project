/* overview/home-pins: 钉到首页（Pinned to Home）补全 */
(function () {
  const PIN_MAX = 4;
  const PIN_ICON = `<svg class="i pin-ico" viewBox="0 0 16 16" aria-hidden="true"><path d="M5.8 2.2h4.4c.8 0 1.4.7 1.2 1.5l-.4 2.4 1.8 1.4v1H4.2v-1l1.8-1.4-.4-2.4c-.2-.8.4-1.5 1.2-1.5z"/><path d="M8 8.5V14"/></svg>`;

  /** 演示分析模板（与既有 PCR / 首页数字一致） */
  const CATALOG = {
    'x1-clash': {
      id: 'x1-clash',
      title: 'X1 线撞期看板',
      live: true,
      sessionId: 'ask-2',
      query: 'X1 产品线 PCR 撞期情况',
      keywords: [/撞期/, /X1.*产品线/, /实施日集中/],
      insight: '3 条集中在 11 月中旬，同一产品线资源撞期，建议错开至少 1 周',
      full: 'X1 产品线当前有 3 条 PCR 目标实施日集中在 11 月中旬，存在资源撞期风险。建议将至少一条调整到 11 月下旬或 12 月初，错开至少 1 周。',
      rowsHtml() {
        return `<div class="hp-rows">
          <div class="hp-row"><span class="hp-d">11/10</span><span class="mono">PCR-2026-08871</span><span>X1 Carbon G13 · CPU Ultra 165U 换代</span></div>
          <div class="hp-row"><span class="hp-d">11/15</span><span class="mono">PCR-2026-08903</span><span>X1 Yoga G9 · 面板供应商切换</span></div>
          <div class="hp-row"><span class="hp-d">11/18</span><span class="mono">CP-2026-04455</span><span>Legion Pro 7i Gen10 · 散热方案变更</span></div>
        </div>`;
      },
      // CP-2026-04455 在任务里是 Legion；提示词写 X1 Nano — 以既有 My Tasks 为准用 Legion，但标题保持撞期看板
    },
    'order-progress': {
      id: 'order-progress',
      title: '订单交付项目进度',
      live: true,
      sessionId: 'ask-4',
      query: 'XX 订单交付项目进度',
      keywords: [/订单交付/, /项目进度/, /XX 客户/],
      insight: '瓶颈在 ODM 侧 BOM 建立未回写，3 项 Work Item 已超期',
      full: 'XX 客户订单交付项目下 8 条 PCR，整体进度 61%，落后计划 9 天。瓶颈在 ODM 侧 BOM 建立未回写。',
      rowsHtml() {
        return `<div class="hp-proj">
          <div class="hp-proj-t">XX 客户订单交付 <span>8 条 PCR</span></div>
          <div class="hp-bar"><i style="width:61%"></i></div>
          <div class="hp-proj-m">61% · 落后计划 9 天</div>
          <div class="hp-stat"><span>已完成 3</span><span>进行中 4</span><span>未开始 1</span></div>
        </div>`;
      },
    },
    'm90q-cost': {
      id: 'm90q-cost',
      title: 'M90q 成本对比',
      live: false,
      snapshotAt: '01-12',
      sessionId: 'ask-5',
      query: 'M90q 二供成本对比',
      keywords: [/M90q.*成本/, /二供成本/, /成本对比/],
      insight: '本次成本上浮高于两条相似案例，建议 Cost 团队确认二供报价',
      full: '对比 CP-2026-04412 与相似案例：本次成本影响 ▲ +2.1%，高于 SP20250612_0031（持平）与 CP20250408_0117（▼ -0.8%）。',
      rowsHtml() {
        return `<div class="hp-rows">
          <div class="hp-row mono">CP-2026-04412 · DDR5 颗粒二供导入</div>
          <div class="hp-row"><span>本次成本影响</span><span class="hp-up">▲ +2.1%</span></div>
          <div class="hp-row"><span>相似案例 SP20250612_0031</span><span class="hp-flat">● 持平</span></div>
          <div class="hp-row"><span>相似案例 CP20250408_0117</span><span class="hp-dn">▼ -0.8%</span></div>
        </div>`;
      },
    },
    'cert-backlog': {
      id: 'cert-backlog',
      title: '认证积压趋势',
      live: true,
      sessionId: 'ask-cert',
      query: '认证积压趋势',
      keywords: [/认证积压/, /积压趋势/],
      insight: '认证积压是当前主瓶颈，较上周增加 9 条',
      full: 'Certification 环节积压较上周增加 9 条，主要来自 X1 与 M90q 产品线。',
      rowsHtml() {
        return `<div class="hp-rows">
          <div class="hp-row"><span>本周积压</span><span class="hp-up">▲ +9</span></div>
          <div class="hp-row"><span>Vote 阶段</span><span>41 条</span></div>
          <div class="hp-row"><span>主因</span><span>Certification Disagree</span></div>
        </div>`;
      },
    },
  };

  // 修正卡片一第三行产品：提示词写 Nano，但既有 Review 任务是 Legion Pro — 按既有数据
  // 已在 rowsHtml 使用 Legion

  let pins = [
    { catalogId: 'x1-clash', pinnedAt: Date.now() - 86400000 },
    { catalogId: 'order-progress', pinnedAt: Date.now() - 43200000 },
    { catalogId: 'm90q-cost', pinnedAt: Date.now() - 3600000 },
  ];
  let justPinnedId = null;
  let menuOpenId = null;
  let pendingPinId = null; // for replace modal

  function esc(t) {
    return String(t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  }

  function getPin(catalogId) {
    return pins.find((p) => p.catalogId === catalogId);
  }

  function isPinned(catalogId) {
    return !!getPin(catalogId);
  }

  function matchCatalog(query) {
    const q = String(query || '');
    return Object.values(CATALOG).find((c) => c.keywords.some((re) => re.test(q)) || q.includes(c.title) || q.includes(c.query));
  }

  function freshness(c) {
    if (c.live) return `<span class="hp-fresh live">⟳ 实时</span>`;
    return `<span class="hp-fresh snap">快照 · ${esc(c.snapshotAt || '')}</span>`;
  }

  function cardHtml(p, opts = {}) {
    const c = CATALOG[p.catalogId];
    if (!c) return '';
    const hi = opts.highlight || justPinnedId === c.id;
    return `<div class="hp-card${hi ? ' hp-new' : ''}" id="hp-card-${c.id}" data-hpid="${c.id}">
      <div class="hp-card-h">
        <h3>${esc(c.title)}</h3>
        ${freshness(c)}
        <button type="button" class="hp-more" data-hpmenu="${c.id}" title="更多">⋮</button>
        <div class="hp-menu" id="hp-menu-${c.id}" hidden>
          <button type="button" data-hpact="full" data-hpid="${c.id}">↗  查看完整分析</button>
          <button type="button" data-hpact="session" data-hpid="${c.id}">💬 回到原对话</button>
          <button type="button" data-hpact="refresh" data-hpid="${c.id}">⟳  立即刷新</button>
          <div class="hp-menu-div"></div>
          <button type="button" class="danger" data-hpact="unpin" data-hpid="${c.id}">📌 取消钉住</button>
        </div>
      </div>
      <div class="hp-body">${c.rowsHtml()}</div>
      <div class="hp-ai"><span class="sp">AI</span><span>${esc(c.insight)}</span></div>
    </div>`;
  }

  function renderHomeSection() {
    const host = document.getElementById('homePinsSection');
    if (!host) return;
    if (!pins.length) {
      host.hidden = true;
      host.innerHTML = '';
      return;
    }
    host.hidden = false;
    host.innerHTML = `
      <div class="sechead"><h2>我钉住的</h2>
        <span class="tipdot" onclick="showTip(event,'pinCustom',70)">70</span>
        <span class="tipdot" onclick="showTip(event,'pinVsHist',71)">71</span>
        <span class="tipdot" onclick="showTip(event,'pinLive',72)">72</span>
        <span class="tipdot" onclick="showTip(event,'pinLimit',73)">73</span>
        <span class="cn" id="homePinsCount">${pins.length} / ${PIN_MAX}</span>
      </div>
      <div class="hp-grid" id="homePinsGrid">
        ${pins.map((p) => cardHtml(p)).join('')}
      </div>`;
    wireHomeCards();
    if (justPinnedId) {
      const el = document.getElementById('hp-card-' + justPinnedId);
      if (el) {
        requestAnimationFrame(() => el.classList.add('hp-in'));
        setTimeout(() => {
          el.classList.remove('hp-new', 'hp-in');
          justPinnedId = null;
        }, 1600);
      } else justPinnedId = null;
    }
  }

  function clearAnalysis() {
    const panel = document.getElementById('homeAnalysis');
    if (panel) { panel.hidden = true; panel.innerHTML = ''; }
    document.body.classList.remove('has-home-analysis');
  }

  function renderRail() {
    const host = document.getElementById('overview-rail-pinned');
    if (!host) return;
    host.innerHTML = `<div class="hgroup" style="padding:2px 9px 6px">Pinned to Home<span class="tipdot" onclick="showTip(event,'pinVsHist',71)">71</span></div>
      <div class="pin-list" id="pinList">
        ${pins.map((p, idx) => {
          const c = CATALOG[p.catalogId];
          if (!c) return '';
          return `<div class="pitem-wrap" draggable="true" data-hpidx="${idx}" data-hpid="${c.id}">
            <button type="button" class="pitem" data-hpjump="${c.id}">${PIN_ICON}<span class="pitem-t">${esc(c.title)}</span></button>
            <button type="button" class="pitem-more" data-hpmenu="rail-${c.id}" title="更多">⋮</button>
            <div class="hp-menu rail" id="hp-menu-rail-${c.id}" hidden>
              <button type="button" data-hpact="full" data-hpid="${c.id}">↗  查看完整分析</button>
              <button type="button" data-hpact="session" data-hpid="${c.id}">💬 回到原对话</button>
              <button type="button" data-hpact="refresh" data-hpid="${c.id}">⟳  立即刷新</button>
              <div class="hp-menu-div"></div>
              <button type="button" class="danger" data-hpact="unpin" data-hpid="${c.id}">📌 取消钉住</button>
            </div>
          </div>`;
        }).join('') || '<div class="pin-empty">暂无钉住分析</div>'}
      </div>`;
    wireRail();
  }

  function closeMenus() {
    document.querySelectorAll('.hp-menu').forEach((m) => { m.hidden = true; });
    menuOpenId = null;
  }

  function wireHomeCards() {
    document.querySelectorAll('#homePinsGrid .hp-card').forEach((card) => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.hp-more, .hp-menu')) return;
        openFull(card.dataset.hpid);
      });
    });
    wireMenus();
  }

  function wireMenus() {
    document.querySelectorAll('[data-hpmenu]').forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const id = btn.dataset.hpmenu;
        const menu = document.getElementById('hp-menu-' + id);
        const open = menu && menu.hidden;
        closeMenus();
        if (menu && open) { menu.hidden = false; menuOpenId = id; }
      };
    });
    document.querySelectorAll('[data-hpact]').forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const act = btn.dataset.hpact;
        const id = btn.dataset.hpid;
        closeMenus();
        if (act === 'full') openFull(id);
        else if (act === 'session') goSession(id);
        else if (act === 'refresh') refreshPin(id);
        else if (act === 'unpin') unpin(id);
      };
    });
  }

  function wireRail() {
    wireMenus();
    document.querySelectorAll('[data-hpjump]').forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        jumpToCard(btn.dataset.hpjump);
      };
    });
    const list = document.getElementById('pinList');
    if (!list) return;
    let dragIdx = null;
    list.querySelectorAll('.pitem-wrap').forEach((row) => {
      row.addEventListener('dragstart', () => { dragIdx = +row.dataset.hpidx; row.classList.add('dragging'); });
      row.addEventListener('dragend', () => { row.classList.remove('dragging'); dragIdx = null; });
      row.addEventListener('dragover', (e) => { e.preventDefault(); });
      row.addEventListener('drop', (e) => {
        e.preventDefault();
        const to = +row.dataset.hpidx;
        if (dragIdx == null || dragIdx === to) return;
        const [item] = pins.splice(dragIdx, 1);
        pins.splice(to, 0, item);
        renderAll();
      });
    });
  }

  function jumpToCard(id) {
    if (typeof switchView === 'function') switchView('home');
    renderHomeSection();
    setTimeout(() => {
      const el = document.getElementById('hp-card-' + id);
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('hp-flash');
      setTimeout(() => el.classList.remove('hp-flash'), 1500);
    }, 80);
  }

  function openFull(id) {
    const c = CATALOG[id];
    if (!c) return;
    const host = document.getElementById('modalHost');
    const scrim = document.getElementById('scrim');
    if (!host || !scrim) { toast(c.full); return; }
    host.innerHTML = `<div class="modal" style="width:520px">
      <div class="modal-h"><h3>${esc(c.title)}</h3><p>${c.live ? '⟳ 实时数据' : '快照 · ' + esc(c.snapshotAt)}</p></div>
      <div class="modal-b">${c.rowsHtml()}<div class="hp-ai" style="margin-top:12px"><span class="sp">AI</span><span>${esc(c.full)}</span></div></div>
      <div class="modal-f"><button class="btn btn-ghost" data-x>关闭</button>
        <button class="btn btn-primary" data-sess>回到原对话</button></div>
    </div>`;
    scrim.classList.add('show');
    host.querySelector('[data-x]').onclick = closeModal;
    host.querySelector('[data-sess]').onclick = () => { closeModal(); goSession(id); };
  }

  function goSession(id) {
    const c = CATALOG[id];
    if (!c) return;
    if (typeof switchView === 'function') switchView('home');
    if (window.Sessions && c.sessionId) {
      try { Sessions.setCurrent(c.sessionId); } catch (_) {}
    }
    runAnalysis(c.query, { fromPin: true, catalogId: c.id });
  }

  function refreshPin(id) {
    const c = CATALOG[id];
    if (!c) return;
    if (!c.live) { toast('快照数据不会自动更新'); return; }
    toast('已刷新「' + c.title + '」');
    renderHomeSection();
  }

  function unpin(id) {
    pins = pins.filter((p) => p.catalogId !== id);
    toast('已取消钉住');
    renderAll();
    updateAnalysisPinButtons();
  }

  function pin(catalogId) {
    const c = CATALOG[catalogId];
    if (!c) return;
    if (isPinned(catalogId)) {
      unpin(catalogId);
      return;
    }
    if (pins.length >= PIN_MAX) {
      pendingPinId = catalogId;
      openReplaceModal();
      return;
    }
    doPin(catalogId);
  }

  function doPin(catalogId, replaceId) {
    const c = CATALOG[catalogId];
    if (!c) return;
    if (replaceId) pins = pins.filter((p) => p.catalogId !== replaceId);
    pins.push({ catalogId, pinnedAt: Date.now() });
    justPinnedId = catalogId;
    if (!c.live) toast('该结果为快照，不会自动更新');
    else toast('已钉到首页：' + c.title);
    renderAll();
    updateAnalysisPinButtons();
    if (typeof VIEW !== 'undefined' && VIEW === 'home') {
      setTimeout(() => jumpToCard(catalogId), 100);
    }
  }

  function openReplaceModal() {
    const host = document.getElementById('modalHost');
    const scrim = document.getElementById('scrim');
    if (!host || !scrim) return;
    host.innerHTML = `<div class="modal">
      <div class="modal-h"><h3>已达钉住上限</h3>
        <p>首页最多可钉住 ${PIN_MAX} 个分析。请先取消一个：</p></div>
      <div class="modal-b">
        <div class="hp-replace">
          ${pins.map((p) => {
            const c = CATALOG[p.catalogId];
            return `<label class="hp-rep"><input type="radio" name="hprep" value="${c.id}"> ${esc(c.title)}</label>`;
          }).join('')}
        </div>
      </div>
      <div class="modal-f">
        <button class="btn btn-ghost" data-x>取消</button>
        <button class="btn btn-primary" data-ok>替换所选</button>
      </div>
    </div>`;
    scrim.classList.add('show');
    host.querySelector('[data-x]').onclick = () => { pendingPinId = null; closeModal(); };
    host.querySelector('[data-ok]').onclick = () => {
      const sel = host.querySelector('input[name=hprep]:checked');
      if (!sel) { toast('请选择要替换的卡片'); return; }
      const add = pendingPinId;
      pendingPinId = null;
      closeModal();
      doPin(add, sel.value);
    };
  }

  function pinActionsHtml(catalogId) {
    const on = isPinned(catalogId);
    return `<button type="button" class="btn btn-ghost hp-pinbtn" data-pinid="${catalogId}">${on ? '已钉住 ✓' : '📌 钉到首页'}</button>
      <button type="button" class="btn btn-ghost" data-reanalyze="${catalogId}">⟳ 重新分析</button>
      <span class="tipdot" onclick="showTip(event,'pinCustom',70)">70</span>`;
  }

  function updateAnalysisPinButtons() {
    document.querySelectorAll('[data-pinid]').forEach((btn) => {
      const id = btn.dataset.pinid;
      btn.textContent = isPinned(id) ? '已钉住 ✓' : '📌 钉到首页';
    });
  }

  async function runAnalysis(query, opts = {}) {
    const c = opts.catalogId ? CATALOG[opts.catalogId] : matchCatalog(query);
    if (!c) {
      toast('已记录提问（演示：请试「X1 撞期」或「订单交付进度」）');
      return false;
    }
    if (typeof switchView === 'function') switchView('home');
    const panel = document.getElementById('homeAnalysis');
    const scroll = document.querySelector('.scroll');
    if (!panel) return false;

    // 会话
    if (window.Sessions) {
      Sessions.upsert({
        id: c.sessionId,
        kind: 'ask',
        title: c.query,
        meta: '刚刚',
        group: 'today',
        pinned: false,
        status: null,
        accent: 'var(--accent)',
      });
      Sessions.setCurrent(c.sessionId);
    }

    panel.hidden = false;
    document.body.classList.add('has-home-analysis');
    panel.innerHTML = '';
    const mount = document.createElement('div');
    mount.className = 'home-analysis-thread';
    panel.appendChild(mount);

    if (window.DialogueMotion) {
      DialogueMotion.appendUser(mount, query || c.query, scroll);
      const card = `<div class="block hp-inline-card"><div class="block-h"><h4>${esc(c.title)}</h4>${freshness(c)}</div>
        <div class="block-b">${c.rowsHtml()}</div></div>`;
      await DialogueMotion.playAssistant({
        mount,
        scrollRoot: scroll,
        text: c.full,
        cardsHtml: [card],
        actionsHtml: pinActionsHtml(c.id),
        animate: !window.__DM_DISABLE && !opts.fromPin,
      });
    } else {
      mount.innerHTML = `<div class="bub me">${esc(query || c.query)}</div>
        <div class="ai-lead"><div class="ai">AI</div><div class="txt">${esc(c.full)}</div></div>
        ${c.rowsHtml()}${pinActionsHtml(c.id)}`;
    }
    mount.querySelectorAll('[data-pinid]').forEach((btn) => {
      btn.onclick = () => pin(btn.dataset.pinid);
    });
    mount.querySelectorAll('[data-reanalyze]').forEach((btn) => {
      btn.onclick = () => runAnalysis(CATALOG[btn.dataset.reanalyze].query, { catalogId: btn.dataset.reanalyze });
    });
    if (typeof paintDots === 'function') paintDots();
    return true;
  }

  function renderAll() {
    renderRail();
    renderHomeSection();
  }

  function init() {
    renderAll();
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.hp-menu, [data-hpmenu], .pitem-more')) closeMenus();
    });
  }

  window.HomePins = {
    init,
    renderAll,
    renderHomeSection,
    renderRail,
    clearAnalysis,
    pin,
    unpin,
    isPinned,
    matchCatalog,
    runAnalysis,
    jumpToCard,
    get pins() { return pins; },
    CATALOG,
    PIN_MAX,
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else setTimeout(init, 0);
})();
