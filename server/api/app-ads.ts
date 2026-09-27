// AdMob app-ads.txt：App Store Connect 的 Marketing URL 要指向這個網域的根目錄，
// AdMob 爬蟲會抓 https://<domain>/app-ads.txt 來驗證 App 歸屬。沒有這個檔，新 App 無法完整放送廣告。
// 內容從 AdMob 後台「app-ads.txt」頁面複製，格式：google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
const LINES: string[] = [
  'google.com, pub-7924270643823556, DIRECT, f08c47fec0942fa0',
]

export const config = { runtime: 'edge' }

export default function handler() {
  return new Response(LINES.join('\n') + '\n', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
