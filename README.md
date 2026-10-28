# 哈喵呱 HAMEOWGUA 官網 v1.1

純靜態網站（HTML/CSS/JS），可直接部署到 GitHub Pages、Netlify、Vercel 或 Railway。

## 檔案
| 檔案 | 用途 |
|---|---|
| `index.html` | 首頁：品牌介紹、教學模組、品牌視覺 |
| `courses.html` | 出金實績（可篩選＋放大）、兩門課程、資金門檻、流程、FAQ、免責聲明 |
| `contact.html` | IG / YouTube / Discord / Email 與諮詢表單（mailto） |
| `config.js` | **唯一需要修改的設定檔**：Shopify、Botpress、聯絡資訊 |
| `assets/` | 樣式、程式、圖片 |
| `download-images.ps1` | 把 Drive 圖片下載到 `assets/img`（可選） |

## 1. 串接 Shopify（課程購買）
1. Shopify 後台建立兩個商品（數位服務、不需運送）：一對一對沖指導課程 NT$64,000、高階交易培訓 NT$96,000。
2. 安裝 **Buy Button** 銷售管道 → 為商品建立 Buy Button → 產生程式碼。
3. 從程式碼中複製 `domain`、`storefrontAccessToken`、商品 `id`，填入 `config.js` 的 `shopify`。
4. 未填寫時，課程卡片會自動改為「私訊報名」按鈕導向聯絡頁。

## 2. 串接 Botpress（AI 客服）
1. Botpress Studio 建立 Bot，把 courses.html 的課程內容、FAQ、免責聲明放進 Knowledge Base。
2. Webchat → Share / Embed，複製兩行 `<script src="...">` 的網址：
   - 第一行（`cdn.botpress.cloud/webchat/.../inject.js`）→ `botpress.injectUrl`
   - 第二行（`files.bpcontent.cloud/...js`）→ `botpress.configUrl`
3. 在 Botpress 的 Allowed Origins 加入你的網站網域。
4. 未填寫時，右下角會顯示備用的聯絡小視窗（Discord / IG / Email）。

## 3. 圖片
頁面預設讀 `assets/img/`，若檔案不存在會自動改讀 Google Drive 公開連結。
建議在 PowerShell 執行 `./download-images.ps1` 把圖片放到本地，避免 Drive 流量限制；之後換圖只需覆蓋同名檔案。

## 4. 合規提醒
- 已移除合約中的身分證字號、住址與銀行帳號，**請勿放到網站上**。
- 出金實績頁與頁尾均附「不保證獲利／歷史績效不代表未來」聲明，請保留。
