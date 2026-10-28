/* 哈喵呱 — shared behaviour: nav, reveal, lightbox, proofs filter, Shopify, Botpress */
(function () {
  const CFG = window.HMG_CONFIG || {};
  const C = CFG.contact || {};

  /* ---- mobile nav ---- */
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) toggle.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
  });

  /* ---- contact links from config ---- */
  document.querySelectorAll('[data-link]').forEach(a => {
    const k = a.dataset.link;
    if (k === 'email' && C.email) a.href = 'mailto:' + C.email;
    else if (C[k]) a.href = C[k];
  });
  document.querySelectorAll('[data-text="email"]').forEach(el => { if (C.email) el.textContent = C.email; });
  document.querySelectorAll('.year').forEach(el => el.textContent = new Date().getFullYear());

  /* ---- reveal on scroll ---- */
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: .12 }) : null;
  document.querySelectorAll('.reveal').forEach(el => io ? io.observe(el) : el.classList.add('in'));

  /* ---- lightbox ---- */
  const lb = document.createElement('div');
  lb.className = 'lightbox';
  lb.innerHTML = '<button aria-label="關閉">×</button><img alt="">';
  document.body.appendChild(lb);
  const lbImg = lb.querySelector('img');
  const closeLb = () => lb.classList.remove('open');
  lb.addEventListener('click', e => { if (e.target !== lbImg) closeLb(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLb(); });
  document.querySelectorAll('[data-zoom]').forEach(el => el.addEventListener('click', () => {
    const img = el.querySelector('img');
    if (!img) return;
    lbImg.src = img.currentSrc || img.src; lbImg.alt = img.alt;
    lb.classList.add('open');
  }));

  /* ---- proofs filter ---- */
  const tabs = document.querySelectorAll('.tab[data-filter]');
  tabs.forEach(t => t.addEventListener('click', () => {
    tabs.forEach(x => x.classList.toggle('active', x === t));
    const f = t.dataset.filter;
    document.querySelectorAll('.proof').forEach(p => {
      p.hidden = !(f === 'all' || p.dataset.cat === f);
    });
  }));

  /* ---- helper ---- */
  function loadScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = src; s.async = true; s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  /* ---- Shopify Buy Button ---- */
  const SH = CFG.shopify || {};
  const slots = document.querySelectorAll('.buy-slot[data-product]');
  const shopifyReady = SH.domain && SH.storefrontAccessToken;
  slots.forEach(slot => {
    const id = (SH.products || {})[slot.dataset.product];
    if (!shopifyReady || !id) {
      // fallback：未設定 Shopify 時，導向聯絡頁
      slot.innerHTML = '<a class="btn btn-frog btn-block" href="contact.html?course=' +
        encodeURIComponent(slot.dataset.name || '') + '">私訊報名 / 預約諮詢</a>';
    }
  });
  if (shopifyReady && slots.length) {
    loadScript('https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js').then(() => {
      const client = ShopifyBuy.buildClient({ domain: SH.domain, storefrontAccessToken: SH.storefrontAccessToken });
      ShopifyBuy.UI.onReady(client).then(ui => {
        slots.forEach(slot => {
          const id = (SH.products || {})[slot.dataset.product];
          if (!id) return;
          ui.createComponent('product', {
            id, node: slot, moneyFormat: 'NT%24%7B%7Bamount_no_decimals%7D%7D',
            options: {
              product: {
                contents: { img: false, title: false, price: false },
                text: { button: SH.buttonText || '立即報名' },
                styles: {
                  product: { 'max-width': '100%', 'margin-left': '0', 'margin-bottom': '0' },
                  button: {
                    'font-weight': 'bold', 'font-size': '16px', 'padding-top': '15px', 'padding-bottom': '15px',
                    'background-color': '#3ddc97', ':hover': { 'background-color': '#56e8a8' },
                    ':focus': { 'background-color': '#56e8a8' }, color: '#062417', 'border-radius': '999px', width: '100%'
                  }
                }
              },
              cart: {
                text: { title: '購物車', total: '小計', button: '前往結帳', empty: '購物車是空的' },
                styles: { button: { 'background-color': '#3ddc97', color: '#062417', ':hover': { 'background-color': '#56e8a8' } } }
              },
              toggle: { styles: { toggle: { 'background-color': '#3ddc97', ':hover': { 'background-color': '#56e8a8' } } } }
            }
          });
        });
      });
    }).catch(() => console.warn('Shopify SDK 載入失敗'));
  }

  /* ---- prefill contact form from ?course= ---- */
  const sel = document.querySelector('#f-topic');
  const q = new URLSearchParams(location.search).get('course');
  if (sel && q) { [...sel.options].forEach(o => { if (o.value === q) sel.value = q; }); }

  /* ---- mailto form ---- */
  const form = document.querySelector('#contact-form');
  if (form) form.addEventListener('submit', e => {
    e.preventDefault();
    const d = new FormData(form);
    const subject = '【哈喵呱官網】' + (d.get('topic') || '詢問');
    const body = `姓名：${d.get('name')}\n聯絡方式：${d.get('reach')}\n交易經驗：${d.get('exp')}\n\n${d.get('msg')}`;
    location.href = 'mailto:' + (C.email || '') + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  });

  /* ---- 版本檢查：有新版本時先提示，使用者確認後才更新 ---- */
  const CUR = (document.querySelector('meta[name="site-version"]') || {}).content || '';
  let shown = false;
  async function checkVersion() {
    if (shown || !CUR) return;
    try {
      const r = await fetch('version.json?t=' + Date.now(), { cache: 'no-store' });
      if (!r.ok) return;
      const v = await r.json();
      if (v.version && v.version !== CUR) showUpdate(v);
    } catch (e) { /* 離線或讀取失敗時略過 */ }
  }
  function showUpdate(v) {
    shown = true;
    const bar = document.createElement('div');
    bar.className = 'update-bar';
    bar.setAttribute('role', 'status');
    bar.innerHTML =
      '<div class="ub-text"><b>網站有新版本 v' + v.version + '</b>' +
      '<span>目前版本 v' + CUR + (v.notes ? '・' + String(v.notes).replace(/[<>&]/g, '') : '') + '</span></div>' +
      '<div class="ub-actions"><button class="btn btn-frog ub-go">立即更新</button>' +
      '<button class="btn btn-ghost ub-later">稍後</button></div>';
    document.body.appendChild(bar);
    requestAnimationFrame(() => bar.classList.add('show'));
    bar.querySelector('.ub-later').addEventListener('click', () => bar.remove());
    bar.querySelector('.ub-go').addEventListener('click', () => {
      const go = bar.querySelector('.ub-go');
      go.textContent = '更新中…'; go.disabled = true;
      doUpdate(v.version);
    });
  }
  async function doUpdate(ver) {
    // 先強制重新下載頁面與資源，再重新載入
    const files = [location.pathname, 'assets/style.css?v=' + ver,
                   'assets/site.js?v=' + ver, 'config.js?v=' + ver];
    await Promise.all(files.map(f => fetch(f, { cache: 'reload' }).catch(() => {})));
    const u = new URL(location.href);
    u.searchParams.set('v', ver);
    location.replace(u.toString());
  }
  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'ver-toast'; t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 2200);
  }
  /* 點版本標示：檢查並更新到最新版 */
  document.querySelectorAll('.ver-badge').forEach(b => b.addEventListener('click', async () => {
    if (b.dataset.busy) return;
    b.dataset.busy = '1'; const label = b.textContent; b.textContent = '檢查中…';
    let latest = CUR;
    try {
      const r = await fetch('version.json?t=' + Date.now(), { cache: 'no-store' });
      if (r.ok) latest = (await r.json()).version || CUR;
    } catch (e) {}
    if (latest !== CUR) { b.textContent = '更新到 v' + latest + '…'; doUpdate(latest); return; }
    toast('已是最新版本 v' + CUR + '，重新載入最新檔案');
    setTimeout(() => doUpdate(CUR), 900);
    b.textContent = label;
  }));
  checkVersion();
  setInterval(checkVersion, 5 * 60 * 1000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) checkVersion(); });

  /* ---- Botpress webchat (AI 客服) ---- */
  const BP = CFG.botpress || {};
  if (BP.injectUrl && BP.configUrl) {
    loadScript(BP.injectUrl).then(() => loadScript(BP.configUrl))
      .catch(() => { console.warn('Botpress 載入失敗，改用備用聯絡視窗'); fallbackChat(); });
  } else {
    fallbackChat();
  }

  function fallbackChat() {
    const fab = document.createElement('button');
    fab.className = 'chat-fab'; fab.setAttribute('aria-label', '開啟客服');
    fab.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>';
    const panel = document.createElement('div');
    panel.className = 'chat-panel';
    panel.innerHTML = `
      <header><img src="assets/img/brand-1.png" alt="" onerror="this.onerror=null;this.src='https://lh3.googleusercontent.com/d/10vGAkyjCVqrekcN_UrfqZpfrV-GQw5OU'"><div><b>哈喵呱小幫手</b><span>通常於 24 小時內回覆</span></div></header>
      <div class="chat-body">
        <div class="bubble">嗨！我是哈喵呱 🐸🐱 想了解課程、出金實績或預約諮詢嗎？選一個最方便的方式找我們：</div>
        <div class="quick">
          <a href="courses.html#courses">📘 看課程內容與費用</a>
          <a href="${C.discord || '#'}" target="_blank" rel="noopener">💬 加入 Discord 社群提問</a>
          <a href="${C.instagram || '#'}" target="_blank" rel="noopener">📷 Instagram 私訊</a>
          <a href="mailto:${C.email || ''}">✉️ Email 聯絡</a>
        </div>
      </div>`;
    document.body.append(panel, fab);
    fab.addEventListener('click', () => panel.classList.toggle('open'));
  }
})();
