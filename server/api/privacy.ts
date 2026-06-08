// Public privacy policy page — linked from PaywallScreen + App Store Connect metadata.
// Apple requires a functional URL crawlable by their bots; this is intentionally a
// static HTML payload served by an edge function (no database, no auth).

const HTML = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Nihongo Manabi — 隱私權政策 / Privacy Policy</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, system-ui, sans-serif; max-width: 720px; margin: 40px auto; padding: 0 20px; color: #1f2937; line-height: 1.7; }
  h1 { font-size: 1.6rem; }
  h2 { font-size: 1.15rem; margin-top: 28px; color: #4338ca; }
  p, li { font-size: 0.95rem; }
  code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 0.85rem; }
  hr { margin: 36px 0; border: 0; border-top: 1px solid #e5e7eb; }
  .lang-en { color: #6b7280; }
</style>
</head>
<body>

<h1>Nihongo Manabi — 隱私權政策</h1>
<p><strong>最後更新：2026 年 6 月 8 日</strong></p>

<h2>1. 我們蒐集的資料</h2>
<p>Nihongo Manabi 是一款純本地的日語學習 App。所有學習進度、SRS 卡片、收藏單字、設定都儲存於你的裝置（透過 iOS AsyncStorage / Android SharedPreferences），不上傳任何伺服器。</p>

<h2>2. 我們處理的資料</h2>
<ul>
<li><strong>AI 對話內容</strong>：你輸入的對話文字會匿名傳送至我們的代理伺服器（Vercel）並轉發至 Google Gemini API 以生成回應。不附加任何身分識別資訊（無 user ID、無 device ID）。對話內容不被儲存。</li>
<li><strong>拍照翻譯</strong>：你拍攝的圖片會壓縮後傳送至同一代理並由 Google Gemini Vision 處理，不被儲存於我們的伺服器，僅短暫存在於記憶體中。</li>
<li><strong>發音評分</strong>：採用 iOS 裝置內 Speech Recognition（requiresOnDeviceRecognition: true），音檔不上傳。</li>
</ul>

<h2>3. 訂閱與付款</h2>
<p>Pro 訂閱由 Apple App Store 處理。我們透過 RevenueCat 確認你的訂閱狀態，僅取得匿名的「Pro / 非 Pro」結果，不取得你的姓名、Apple ID、信用卡資訊。RevenueCat 隱私權政策見 <a href="https://www.revenuecat.com/privacy">revenuecat.com/privacy</a>。</p>

<h2>4. 第三方服務</h2>
<ul>
<li>Google Gemini API（AI 對話與拍照翻譯）— <a href="https://policies.google.com/privacy">policies.google.com/privacy</a></li>
<li>RevenueCat（訂閱狀態驗證）— <a href="https://www.revenuecat.com/privacy">revenuecat.com/privacy</a></li>
<li>Apple App Store（付款處理）— <a href="https://www.apple.com/legal/privacy/">apple.com/legal/privacy</a></li>
</ul>

<h2>5. 兒童隱私</h2>
<p>本 App 不主動蒐集 13 歲以下兒童的個人資料。如有家長發現相關情形，請聯繫我們刪除。</p>

<h2>6. 你的權利</h2>
<p>你可隨時於 App 內「設定」清除所有本地資料。卸載 App 即會自動清除所有資料。</p>

<h2>7. 變更通知</h2>
<p>本政策若有重大變更，將於 App 內以彈窗或 App Store 更新說明告知。</p>

<h2>8. 聯絡我們</h2>
<p>tony0912045596@gmail.com</p>

<hr>

<h1 class="lang-en">Nihongo Manabi — Privacy Policy (English)</h1>
<p><strong>Last updated: June 8, 2026</strong></p>

<h2>1. Data We Collect</h2>
<p>Nihongo Manabi is a fully local Japanese learning app. All learning progress, SRS cards, saved vocabulary, and settings are stored on your device (via iOS AsyncStorage / Android SharedPreferences). Nothing is uploaded to a backend.</p>

<h2>2. Data We Process</h2>
<ul>
<li><strong>AI conversations</strong>: Text you enter is forwarded anonymously through our proxy (Vercel) to Google Gemini API to generate replies. No user ID or device ID is attached. Conversation content is not stored.</li>
<li><strong>Camera OCR</strong>: Photos you take are compressed and sent to the same proxy and processed by Google Gemini Vision. They are not stored on our servers; they exist only briefly in memory.</li>
<li><strong>Pronunciation scoring</strong>: Uses iOS on-device Speech Recognition (requiresOnDeviceRecognition flag set on-device). Audio is never uploaded.</li>
</ul>

<h2>3. Subscription & Payments</h2>
<p>Pro subscriptions are handled by Apple App Store. We use RevenueCat to verify subscription status — we receive only an anonymous "Pro / not Pro" result, never your name, Apple ID, or credit card. See <a href="https://www.revenuecat.com/privacy">RevenueCat privacy policy</a>.</p>

<h2>4. Third-Party Services</h2>
<ul>
<li>Google Gemini API (AI chat &amp; camera OCR) — <a href="https://policies.google.com/privacy">policies.google.com/privacy</a></li>
<li>RevenueCat (subscription verification) — <a href="https://www.revenuecat.com/privacy">revenuecat.com/privacy</a></li>
<li>Apple App Store (payment processing) — <a href="https://www.apple.com/legal/privacy/">apple.com/legal/privacy</a></li>
</ul>

<h2>5. Children's Privacy</h2>
<p>This app does not knowingly collect personal data from children under 13. Parents who become aware of such data may contact us for deletion.</p>

<h2>6. Your Rights</h2>
<p>You can clear all local data at any time via the in-app Settings screen. Uninstalling the app automatically erases everything.</p>

<h2>7. Changes</h2>
<p>Material changes to this policy will be communicated in-app or via the App Store release notes.</p>

<h2>8. Contact</h2>
<p>tony0912045596@gmail.com</p>

</body>
</html>`

export const config = { runtime: 'edge' }

export default function handler() {
  return new Response(HTML, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
