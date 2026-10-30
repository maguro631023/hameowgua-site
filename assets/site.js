/* 哈喵呱 — shared behaviour: nav, reveal, lightbox, proofs filter, Shopify, Botpress */
(function () {
  const CFG = window.HMG_CONFIG || {};
  const C = CFG.contact || {};

  /* ---- Google Analytics 4 ---- */
  const GA_ID = ((CFG.ga4 || {}).measurementId || '').trim();
  const gaOn = /^G-[A-Z0-9]+$/i.test(GA_ID);
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  if (gaOn) {
    const s = document.createElement('script');
    s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    gtag('js', new Date());
    const standaloneMode = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    gtag('config', GA_ID, { display_mode: standaloneMode ? 'pwa' : 'browser',
                           site_version: (document.querySelector('meta[name="site-version"]') || {}).content });
  }
  const track = (name, params) => { if (gaOn) gtag('event', name, params || {}); };
  window.hmgTrack = track;

  // 點擊行為（事件委派）
  document.addEventListener('click', e => {
    const t = e.target.closest('a,button,figure,[data-zoom]');
    if (!t) return;
    if (t.matches('[data-link]')) {
      const k = t.dataset.link;
      track(k === 'email' ? 'contact_email_click' : 'sns_click', { platform: k, location: t.closest('header,footer,main') ? t.closest('header,footer,main').tagName.toLowerCase() : '' });
    } else if (t.closest('.buy-slot')) {
      track('enroll_click', { course: t.closest('.buy-slot').dataset.name, method: 'contact' });
    } else if (t.matches('.hero-ctas a, .cta-band a')) {
      track('cta_click', { label: t.textContent.trim(), link: t.getAttribute('href') || '' });
    } else if (t.matches('.install-btn')) {
      track('pwa_install_click');
    } else if (t.matches('.qr-btn')) {
      track('qr_open');
    } else if (t.matches('.ver-badge')) {
      track('version_check');
    } else if (t.matches('.tab[data-filter]')) {
      track('proof_filter', { filter: t.dataset.filter });
    } else if (t.matches('[data-zoom]')) {
      const img = t.querySelector('img');
      track('image_zoom', { image: img ? img.alt : '' });
    } else if (t.matches('.chat-fab')) {
      track('chat_open', { type: 'fallback' });
    }
  }, true);
  document.querySelectorAll('.faq details').forEach(d => d.addEventListener('toggle', () => {
    if (d.open) track('faq_open', { question: d.querySelector('summary').textContent.trim() });
  }));

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

  /* ---- PWA：Service Worker 與安裝 App ---- */
  let swReg = null;
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').then(r => { swReg = r; }).catch(() => {});
    });
  }
  const installBtns = document.querySelectorAll('.install-btn');
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) ||
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  let deferredPrompt = null;
  const showInstall = on => installBtns.forEach(b => b.hidden = !on);
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt = e; showInstall(true); });
  window.addEventListener('appinstalled', () => { track('pwa_installed'); deferredPrompt = null; showInstall(false); toastLater('已安裝哈喵呱 App 🎉'); });
  if (isIOS && !standalone) showInstall(true);
  installBtns.forEach(b => b.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') showInstall(false);
      deferredPrompt = null;
    } else if (isIOS) {
      iosHint();
    }
  }));
  function iosHint() {
    const m = document.createElement('div');
    m.className = 'qr-modal open';
    m.innerHTML = '<div class="qr-card"><button class="qr-close" aria-label="關閉">×</button>' +
      '<img src="assets/icons/icon-192.png" alt="" style="width:84px;height:84px;padding:0;border-radius:20px">' +
      '<b>把哈喵呱加到主畫面</b>' +
      '<ol class="ios-steps"><li>用 <b>Safari</b> 開啟本站</li><li>點下方的「分享」按鈕 <span aria-hidden="true">⬆︎</span></li>' +
      '<li>選擇「<b>加入主畫面</b>」</li><li>按右上角「新增」</li></ol></div>';
    document.body.appendChild(m);
    m.addEventListener('click', e => { if (e.target === m || e.target.classList.contains('qr-close')) m.remove(); });
  }
  function toastLater(msg) { if (typeof toast === 'function') toast(msg); }

  /* ---- 網站 QR Code ---- */
  const qrBtn = document.querySelector('.qr-btn');
  if (qrBtn) {
    const SITE = 'https://maguro631023.github.io/hameowgua-site/';
    const m = document.createElement('div');
    m.className = 'qr-modal';
    m.innerHTML = '<div class="qr-card" role="dialog" aria-label="網站 QR Code">' +
      '<button class="qr-close" aria-label="關閉">×</button>' +
      '<b>掃描開啟哈喵呱官網</b>' +
      '<img src="assets/img/qr.svg" alt="哈喵呱官網 QR Code">' +
      '<span class="qr-url">' + SITE.replace('https://', '') + '</span>' +
      '<div class="qr-actions"><a class="btn btn-frog" href="assets/img/qr-hameowgua.png" download="hameowgua-qr.png">下載 QR Code</a>' +
      '<button class="btn btn-ghost qr-copy">複製網址</button></div></div>';
    document.body.appendChild(m);
    const close = () => m.classList.remove('open');
    qrBtn.addEventListener('click', () => m.classList.add('open'));
    m.addEventListener('click', e => { if (e.target === m || e.target.classList.contains('qr-close')) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    m.querySelector('.qr-copy').addEventListener('click', async e => {
      try { await navigator.clipboard.writeText(SITE); e.target.textContent = '已複製 ✓'; }
      catch (_) { e.target.textContent = SITE; }
    });
  }

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
                events: { addVariantToCart: () => track('add_to_cart', { course: slot.dataset.name, currency: 'TWD' }) },
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
    track('generate_lead', { topic: d.get('topic'), experience: d.get('exp') });
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
    try { const r = await navigator.serviceWorker?.getRegistration(); if (r) await r.update(); } catch (e) {}
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
      .then(() => { try { window.botpress.on('webchat:opened', () => track('chat_open', { type: 'botpress' })); } catch (e) {} })
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
