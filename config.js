/* =========================================================
   哈喵呱 網站設定檔 — 只要改這個檔案就能串接 Shopify / Botpress
   ========================================================= */
window.HMG_CONFIG = {

  /* ---------- Shopify Buy Button ----------
     Shopify 後台 → 銷售管道新增「Buy Button」→ 建立商品按鈕 →
     從產生的程式碼複製 domain、storefrontAccessToken 與商品 id。
     留空時，課程卡片會改顯示「私訊報名」按鈕。 */
  shopify: {
    domain: '',                 // 例：'hameowgua.myshopify.com'
    storefrontAccessToken: '',  // 例：'a1b2c3d4e5...'
    products: {
      hedge:    '',             // 一對一對沖指導課程（NT$64,000）的商品 id，例：'8123456789012'
      advanced: ''              // 高階交易培訓一對一課程（NT$96,000）的商品 id
    },
    buttonText: '立即報名'
  },

  /* ---------- Botpress Webchat（AI 客服）----------
     Botpress 後台 → Webchat → Share / Embed，會給兩行 <script>：
     第一行貼到 injectUrl，第二行（files.bpcontent.cloud/...js）貼到 configUrl。
     留空時，右下角會顯示備用的聯絡小視窗。 */
  botpress: {
    injectUrl: 'https://cdn.botpress.cloud/webchat/v5.0/inject.js',
    configUrl: 'https://files.bpcontent.cloud/2026/10/28/15/20261028154949-6VN06280.js'  // 哈喵呱小幫手
  },

  /* ---------- 聯絡資訊 ---------- */
  contact: {
    email:     'hyhsu950103@gmail.com',
    instagram: 'https://www.instagram.com/hameowgua',
    youtube:   'https://youtube.com/@hameowgua',
    discord:   'https://discord.gg/zCb7uzqgd'
  }
};
