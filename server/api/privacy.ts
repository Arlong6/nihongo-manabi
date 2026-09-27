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
<p><strong>最後更新：2026 年 9 月 26 日</strong></p>

<h2>1. 我們蒐集的資料</h2>
<p>Nihongo Manabi 的學習進度、SRS 卡片、收藏單字、設定都儲存於你的裝置（透過 iOS AsyncStorage / Android SharedPreferences），我們沒有帳號系統，也不會把這些資料上傳到自己的伺服器。下列第 2 節與第 4 節說明的功能會把必要資料傳給第三方服務處理。</p>

<h2>2. 我們處理的資料</h2>
<ul>
<li><strong>AI 對話內容</strong>：你輸入的對話文字會匿名傳送至我們的代理伺服器（Vercel）並轉發至 Google Gemini API 以生成回應。不附加任何身分識別資訊（無 user ID、無 device ID）。對話內容不被儲存。</li>
<li><strong>拍照翻譯</strong>：你拍攝的圖片會壓縮後傳送至同一代理並由 Google Gemini Vision 處理，不被儲存於我們的伺服器，僅短暫存在於記憶體中。</li>
<li><strong>發音評分</strong>：採用 iOS 裝置內 Speech Recognition（requiresOnDeviceRecognition: true），音檔不上傳。</li>
</ul>

<h2>3. 訂閱與付款</h2>
<p>Pro 訂閱由 Apple App Store 處理。我們透過 RevenueCat 確認你的訂閱狀態，僅取得匿名的「Pro / 非 Pro」結果，不取得你的姓名、Apple ID、信用卡資訊。RevenueCat 隱私權政策見 <a href="https://www.revenuecat.com/privacy">revenuecat.com/privacy</a>。</p>

<h2>4. 廣告（僅免費版）</h2>
<p>免費版在 AI 對話或拍照翻譯的每日額度用完時，可以<strong>自行選擇</strong>觀看一支 Google AdMob 的激勵影片廣告換取額外次數。我們不會在學習過程中插入任何廣告；Pro 訂閱用戶完全不會看到廣告，也不會初始化廣告 SDK。</p>
<ul>
<li>AdMob 為了投放與計量廣告，可能收集：廣告識別碼（IDFA，僅在你於 App Tracking Transparency 對話框中允許追蹤時）、由 IP 位址推估的大略位置、廣告互動資料、當機與效能資料。</li>
<li>第一次進入主畫面時 iOS 會詢問是否允許追蹤。選「要求 App 不要追蹤」仍可看廣告換次數，只是廣告不會用 IDFA 做個人化。你隨時可在「設定 → 隱私權與安全性 → 追蹤」更改。</li>
<li>在歐盟、英國與瑞士，App 會依 Google User Messaging Platform 顯示同意表單。</li>
<li>App 使用 Apple SKAdNetwork 進行廣告成效歸因，該機制不會向廣告主揭露你的身分。廣告內容分級設定為 PG。</li>
<li>Google 如何使用廣告資料：<a href="https://policies.google.com/technologies/partner-sites">policies.google.com/technologies/partner-sites</a></li>
</ul>

<h2>5. 第三方服務</h2>
<ul>
<li>Google Gemini API（AI 對話與拍照翻譯）— <a href="https://policies.google.com/privacy">policies.google.com/privacy</a></li>
<li>Google AdMob 與 User Messaging Platform（免費版的激勵影片廣告與同意管理）— <a href="https://policies.google.com/privacy">policies.google.com/privacy</a></li>
<li>RevenueCat（訂閱狀態驗證）— <a href="https://www.revenuecat.com/privacy">revenuecat.com/privacy</a></li>
<li>Apple App Store（付款處理）— <a href="https://www.apple.com/legal/privacy/">apple.com/legal/privacy</a></li>
</ul>

<h2>6. 兒童隱私</h2>
<p>本 App 不主動蒐集 13 歲以下兒童的個人資料。如有家長發現相關情形，請聯繫我們刪除。</p>

<h2>7. 你的權利</h2>
<p>你可隨時於 App 內「設定」清除所有本地資料。卸載 App 即會自動清除所有資料。</p>

<h2>7. 變更通知</h2>
<p>本政策若有重大變更，將於 App 內以彈窗或 App Store 更新說明告知。</p>

<h2>8. 聯絡我們</h2>
<p>tony0912045596@gmail.com</p>

<hr>

<h1 class="lang-en">Nihongo Manabi — Privacy Policy (English)</h1>
<p><strong>Last updated: September 26, 2026</strong></p>

<h2>1. Data We Collect</h2>
<p>Nihongo Manabi stores your learning progress, SRS cards, saved vocabulary and settings on your device (via iOS AsyncStorage / Android SharedPreferences). There is no account system and we do not upload this data to servers of our own. Sections 2 and 4 describe the features that send the necessary data to third-party services.</p>

<h2>2. Data We Process</h2>
<ul>
<li><strong>AI conversations</strong>: Text you enter is forwarded anonymously through our proxy (Vercel) to Google Gemini API to generate replies. No user ID or device ID is attached. Conversation content is not stored.</li>
<li><strong>Camera OCR</strong>: Photos you take are compressed and sent to the same proxy and processed by Google Gemini Vision. They are not stored on our servers; they exist only briefly in memory.</li>
<li><strong>Pronunciation scoring</strong>: Uses iOS on-device Speech Recognition (requiresOnDeviceRecognition flag set on-device). Audio is never uploaded.</li>
</ul>

<h2>3. Subscription & Payments</h2>
<p>Pro subscriptions are handled by Apple App Store. We use RevenueCat to verify subscription status — we receive only an anonymous "Pro / not Pro" result, never your name, Apple ID, or credit card. See <a href="https://www.revenuecat.com/privacy">RevenueCat privacy policy</a>.</p>

<h2>4. Advertising (free tier only)</h2>
<p>When the daily quota for AI chat or camera translation is used up, free users may <strong>choose</strong> to watch a Google AdMob rewarded video ad in exchange for extra uses. No ads are inserted into the learning flow, and Pro subscribers never see ads (the ads SDK is not even initialised for them).</p>
<ul>
<li>To serve and measure ads, AdMob may collect: the advertising identifier (IDFA, only if you allow tracking in the App Tracking Transparency prompt), coarse location inferred from IP address, ad interaction data, and crash and performance data.</li>
<li>iOS asks for tracking permission when you first reach the main screen. If you choose &ldquo;Ask App Not to Track&rdquo;, you can still watch ads for extra uses; they are simply not personalised with the IDFA. Change this anytime in Settings → Privacy &amp; Security → Tracking.</li>
<li>In the EU, UK and Switzerland the app shows a consent form via Google&rsquo;s User Messaging Platform.</li>
<li>The app uses Apple&rsquo;s SKAdNetwork for ad attribution, which does not reveal your identity to advertisers. The maximum ad content rating is set to PG.</li>
<li>How Google uses ad data: <a href="https://policies.google.com/technologies/partner-sites">policies.google.com/technologies/partner-sites</a></li>
</ul>

<h2>5. Third-Party Services</h2>
<ul>
<li>Google Gemini API (AI chat &amp; camera OCR) — <a href="https://policies.google.com/privacy">policies.google.com/privacy</a></li>
<li>Google AdMob and User Messaging Platform (rewarded ads and consent for the free tier) — <a href="https://policies.google.com/privacy">policies.google.com/privacy</a></li>
<li>RevenueCat (subscription verification) — <a href="https://www.revenuecat.com/privacy">revenuecat.com/privacy</a></li>
<li>Apple App Store (payment processing) — <a href="https://www.apple.com/legal/privacy/">apple.com/legal/privacy</a></li>
</ul>

<h2>6. Children's Privacy</h2>
<p>This app does not knowingly collect personal data from children under 13. Parents who become aware of such data may contact us for deletion.</p>

<h2>7. Your Rights</h2>
<p>You can clear all local data at any time via the in-app Settings screen. Uninstalling the app automatically erases everything.</p>

<h2>8. Changes</h2>
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
