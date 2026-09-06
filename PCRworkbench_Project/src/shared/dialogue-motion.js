/* shared: DialogueMotion — 跨场景 AI 对话动画（纯 CSS + 原生 JS） */
(function () {
  const DM = {
    _skip: false,
    _running: false,
    _followScroll: true,
    _scrollRoot: null,
    _onScroll: null,

    reduced() {
      try {
        if (window.__DM_DISABLE) return true;
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      } catch (_) {
        return !!window.__DM_DISABLE;
      }
    },

    skip() {
      this._skip = true;
    },

    isSkipping() {
      return this._skip || this.reduced();
    },

    bindSkip(root) {
      if (!root || root.dataset.dmSkipBound) return;
      root.dataset.dmSkipBound = '1';
      root.addEventListener(
        'click',
        (e) => {
          if (!this._running) return;
          if (e.target.closest('a,button,input,textarea,select,label,.tipdot,[contenteditable]')) return;
          this.skip();
        },
        true
      );
    },

    _bindScrollFollow(scrollRoot) {
      this._unfollowScroll();
      this._scrollRoot = scrollRoot || null;
      this._followScroll = true;
      if (!scrollRoot) return;
      this._onScroll = () => {
        const el = this._scrollRoot;
        if (!el) return;
        const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
        this._followScroll = dist < 48;
      };
      scrollRoot.addEventListener('scroll', this._onScroll, { passive: true });
    },

    _unfollowScroll() {
      if (this._scrollRoot && this._onScroll) {
        this._scrollRoot.removeEventListener('scroll', this._onScroll);
      }
      this._scrollRoot = null;
      this._onScroll = null;
      this._followScroll = true;
    },

    scrollToBottom(scrollRoot) {
      const el = scrollRoot || this._scrollRoot;
      if (!el || !this._followScroll) return;
      el.scrollTop = el.scrollHeight;
    },

    sleep(ms) {
      return new Promise((resolve) => {
        if (this.isSkipping() || ms <= 0) return resolve();
        const t0 = Date.now();
        const tick = () => {
          if (this.isSkipping() || Date.now() - t0 >= ms) return resolve();
          requestAnimationFrame(tick);
        };
        setTimeout(tick, Math.min(ms, 50));
      });
    },

    enter(el) {
      if (!el) return;
      el.classList.add('dm-enter');
      requestAnimationFrame(() => el.classList.add('dm-in'));
    },

    thinkingHtml() {
      return `<div class="dm-think ai-lead" aria-hidden="true">
        <div class="ai">AI</div>
        <div class="dm-dots"><i></i><i></i><i></i></div>
      </div>`;
    },

    /** 流式写入纯文本；返回最终文本节点容器 */
    async streamText(targetEl, text, scrollRoot) {
      const raw = String(text || '');
      targetEl.innerHTML = '';
      const cursor = document.createElement('span');
      cursor.className = 'dm-caret';
      targetEl.appendChild(cursor);

      const long = raw.length > 300;
      const base = long ? 12 : 30;
      let i = 0;
      while (i < raw.length) {
        if (this.isSkipping()) {
          targetEl.textContent = raw;
          break;
        }
        const ch = raw[i];
        const isAsciiWord = /[A-Za-z0-9]/.test(ch);
        let take = 1;
        if (isAsciiWord) {
          take = Math.min(3, raw.length - i);
          while (take > 1 && !/[A-Za-z0-9]/.test(raw[i + take - 1])) take--;
        }
        const chunk = raw.slice(i, i + take);
        cursor.before(document.createTextNode(chunk));
        i += take;
        this.scrollToBottom(scrollRoot);

        let delay = base;
        if (/[。！？；.!?]/.test(chunk)) delay += 80;
        if (chunk.includes('\n')) delay += 150;
        await this.sleep(delay);
      }
      cursor.remove();
      if (targetEl.textContent !== raw && this.isSkipping()) targetEl.textContent = raw;
    },

    async revealEl(el, scrollRoot) {
      if (!el) return;
      el.hidden = false;
      el.classList.remove('dm-pending');
      this.enter(el);
      this.scrollToBottom(scrollRoot);
      await this.sleep(this.isSkipping() ? 0 : 200);
    },

    /**
     * 卡片内列表项：先 ok，后 warn/err；图标转圈→终态
     */
    async revealListItems(cardEl, scrollRoot) {
      if (!cardEl) return;
      const items = [...cardEl.querySelectorAll('.dm-li, .vrow, .tl-item, .pcheck, .ah-vrow')];
      if (!items.length) return;
      items.forEach((it) => {
        it.classList.add('dm-li-pending');
        const ic = it.querySelector('.ic, .ck, .tl-dot, .ah-vico');
        if (ic && !ic.dataset.dmFinal) {
          ic.dataset.dmFinal = ic.innerHTML;
          ic.innerHTML = '<span class="dm-spin"></span>';
          ic.classList.add('dm-ico-spin');
        }
      });
      const ok = items.filter((it) => !it.classList.contains('warn') && !it.classList.contains('err') && !it.classList.contains('dis') && !it.classList.contains('fail'));
      const bad = items.filter((it) => it.classList.contains('warn') || it.classList.contains('err') || it.classList.contains('dis') || it.classList.contains('fail'));
      const order = ok.concat(bad);
      for (let i = 0; i < order.length; i++) {
        const it = order[i];
        const isBad = bad.includes(it);
        if (isBad && i === ok.length) await this.sleep(this.isSkipping() ? 0 : 400);
        it.classList.remove('dm-li-pending');
        it.classList.add('dm-li-in');
        const ic = it.querySelector('.ic, .ck, .tl-dot, .ah-vico');
        if (ic && ic.dataset.dmFinal != null) {
          await this.sleep(this.isSkipping() ? 0 : 180);
          ic.innerHTML = ic.dataset.dmFinal;
          ic.classList.remove('dm-ico-spin');
        }
        this.scrollToBottom(scrollRoot);
        await this.sleep(this.isSkipping() ? 0 : 220);
      }
    },

    /**
     * 播放一轮 AI 回复动画
     * @param {object} opts
     * @param {HTMLElement} opts.mount - 插入 AI 块的容器
     * @param {HTMLElement} [opts.scrollRoot]
     * @param {string} opts.text - 流式纯文本
     * @param {string} [opts.htmlSuffix] - 文本后追加的 HTML（tipdot 等）
     * @param {string[]} [opts.cardsHtml] - 卡片 HTML 列表
     * @param {string} [opts.actionsHtml] - 动作区 HTML
     * @param {boolean} [opts.animate=true]
     */
    async playAssistant(opts) {
      const {
        mount,
        scrollRoot,
        text,
        htmlSuffix = '',
        cardsHtml = [],
        actionsHtml = '',
        animate = true,
      } = opts || {};
      if (!mount) return;

      this.bindSkip(scrollRoot || mount.closest('.center-body, .scroll, .parse-chat') || mount);
      this._bindScrollFollow(scrollRoot);
      this._skip = false;
      this._running = true;

      const wrap = document.createElement('div');
      wrap.className = 'dm-ai-turn';
      mount.appendChild(wrap);

      const useAnim = animate && !this.reduced();

      try {
        if (!useAnim) {
          wrap.innerHTML = `<div class="ai-lead task-follow"><div class="ai">AI</div><div class="txt"></div></div>`;
          const txt = wrap.querySelector('.txt');
          txt.innerHTML = escDm(text).replace(/\n/g, '<br>') + (htmlSuffix || '');
          cardsHtml.forEach((h) => {
            const d = document.createElement('div');
            d.className = 'dm-card';
            d.innerHTML = h;
            wrap.appendChild(d);
          });
          if (actionsHtml) {
            const a = document.createElement('div');
            a.className = 'dm-actions';
            a.innerHTML = actionsHtml;
            wrap.appendChild(a);
          }
          this.scrollToBottom(scrollRoot);
          return wrap;
        }

        // thinking
        await this.sleep(150);
        if (!this.isSkipping()) {
          wrap.innerHTML = this.thinkingHtml();
          this.scrollToBottom(scrollRoot);
          const thinkMs = 600 + Math.floor(Math.random() * 600);
          await this.sleep(thinkMs);
        }

        // stream
        wrap.innerHTML = `<div class="ai-lead task-follow dm-enter dm-in"><div class="ai">AI</div><div class="txt"></div></div>`;
        const txt = wrap.querySelector('.txt');
        await this.streamText(txt, text, scrollRoot);
        if (htmlSuffix) txt.insertAdjacentHTML('beforeend', htmlSuffix);

        // cards
        for (const h of cardsHtml) {
          if (!h) continue;
          const d = document.createElement('div');
          d.className = 'dm-card dm-pending';
          d.hidden = true;
          d.innerHTML = h;
          wrap.appendChild(d);
        }
        const cards = [...wrap.querySelectorAll('.dm-card')];
        for (const c of cards) {
          await this.revealEl(c, scrollRoot);
          await this.revealListItems(c, scrollRoot);
        }

        // actions
        if (actionsHtml) {
          await this.sleep(this.isSkipping() ? 0 : 200);
          const a = document.createElement('div');
          a.className = 'dm-actions dm-fade';
          a.innerHTML = actionsHtml;
          wrap.appendChild(a);
          requestAnimationFrame(() => a.classList.add('dm-in'));
          this.scrollToBottom(scrollRoot);
        }
        return wrap;
      } finally {
        this._running = false;
        this._skip = false;
        this._unfollowScroll();
      }
    },

    /** 用户气泡立即进入 */
    appendUser(mount, text, scrollRoot) {
      const el = document.createElement('div');
      el.className = 'bub me';
      el.textContent = text;
      mount.appendChild(el);
      if (!this.reduced()) this.enter(el);
      this._followScroll = true;
      this.scrollToBottom(scrollRoot);
      return el;
    },
  };

  function escDm(t) {
    return String(t || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/"/g, '&quot;');
  }

  window.DialogueMotion = DM;
  window.escDm = escDm;
})();
