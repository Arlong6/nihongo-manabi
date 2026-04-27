# Nihongo Manabi — Design System v2

> 從「AI 工具感」走向「日式溫度」。靈感：Refold、Bunpo、Apple Books／Notes 的留白。
> 三大支柱：**桜（Sakura）／ 墨（Sumi）／ 和紙（Washi）**。

---

## 1. Color Tokens

### 1.1 Base palette（語意層之前的「原料」）

| Token | Hex | 角色 |
|---|---|---|
| `sakura.50`  | `#FBEEF0` | 最淺粉，hover bg |
| `sakura.100` | `#F4DDDF` | 淡粉，tag / chip bg |
| `sakura.300` | `#E2A6AC` | 淺粉強調 |
| `sakura.500` | `#C8767D` | **主色（霧感粉，不是螢光粉）** |
| `sakura.700` | `#9C545B` | 深粉，按下態 / 文字強調 |
| `sumi.900`   | `#1A1614` | 墨色（深色模式底） |
| `sumi.800`   | `#25201E` | 深色卡片 |
| `sumi.700`   | `#3A332F` | 深色 border |
| `sumi.500`   | `#6B6258` | 中性 subtext（暖灰） |
| `sumi.300`   | `#A8A097` | 深色 subtext |
| `sumi.100`   | `#E8E2D6` | 淺色 border（米白） |
| `washi.50`   | `#FAF7F2` | **和紙底色（淺色 bg）** |
| `washi.100`  | `#F4EFE5` | 替代卡片 / 區塊分層 |
| `washi.0`    | `#FFFFFF` | 純白卡片（淺色 card） |
| `matcha.500` | `#7BA876` | 成功 / 答對 |
| `yamabuki.500` | `#D4A24C` | 提醒 / 連續日數金色 |
| `ai.indigo`  | `#5B6BB8` | AI 對話標識的低飽和靛藍（取代原 `#4F46E5`） |

> 規則：**整個畫面同時出現的色相 ≤ 3 種**。Sakura 為 hero 色，Matcha / Yamabuki 為功能性點綴，禁止當大面積背景。

### 1.2 Semantic tokens（程式直接用這層）

#### Light（washi 模式）

| Token | Value | 用法 |
|---|---|---|
| `bg`        | `#FAF7F2` | App 全域底 |
| `bgElevated`| `#FFFFFF` | sheet / modal |
| `card`      | `#FFFFFF` | 主卡片 |
| `cardSoft`  | `#F4EFE5` | 區塊分層、次卡片 |
| `border`    | `#E8E2D6` | 邊框、分隔線 |
| `borderStrong` | `#D4CCBE` | 輸入框、聚焦邊框 |
| `text`      | `#1A1614` | 主文字（墨色，不用純黑） |
| `subtext`   | `#6B6258` | 次文字、metadata |
| `mutedText` | `#9C9388` | hint / placeholder |
| `primary`   | `#C8767D` | CTA、active tab、強調 |
| `primarySoft` | `#F4DDDF` | primary 的 bg 變體 |
| `onPrimary` | `#FFFFFF` | primary 上的文字 |
| `success`   | `#7BA876` | 答對 / 完成 |
| `warning`   | `#D4A24C` | 連續學習日、提示 |
| `aiAccent`  | `#5B6BB8` | AI 老師訊息標 |

#### Dark（sumi 模式）

> 不只是反轉 — 用「夜晚紙燈」的概念：底是濃墨、卡片是和紙微亮、文字是奶油色而非純白。

| Token | Value | 用法 |
|---|---|---|
| `bg`        | `#1A1614` | 全域底 |
| `bgElevated`| `#2A2421` | sheet / modal |
| `card`      | `#25201E` | 主卡片 |
| `cardSoft`  | `#1F1B19` | 次卡片 |
| `border`    | `#3A332F` | 邊框 |
| `borderStrong` | `#52483F` | 聚焦邊框 |
| `text`      | `#F2EDE5` | 主文字（暖奶油，避免 #FFF 刺眼） |
| `subtext`   | `#A8A097` | 次文字 |
| `mutedText` | `#7A7166` | hint |
| `primary`   | `#E89BA1` | sakura 在暗色提亮版 |
| `primarySoft` | `#3D2A2C` | primary 的 bg 變體 |
| `onPrimary` | `#1A1614` | primary 上的文字（用墨色） |
| `success`   | `#9CC196` | 提亮 matcha |
| `warning`   | `#E0B872` | 提亮 yamabuki |
| `aiAccent`  | `#8593D4` | 提亮 indigo |

---

## 2. Typography

### 2.1 字體家族

| 用途 | iOS Stack |
|---|---|
| **日文（學習內容）** | `"Hiragino Mincho ProN"`, `"Yu Mincho"`, `"Noto Serif JP"`, serif — 明朝體有筆鋒，學習感強 |
| **日文 UI（按鈕、tab）** | `"Hiragino Sans"`, `"Yu Gothic"`, `"Noto Sans JP"`, sans-serif |
| **繁中／英／韓 UI** | system (`"-apple-system"`, San Francisco) |
| **韓文** | `"Apple SD Gothic Neo"`, system |
| **數字（streak、計時）** | `"SF Pro Rounded"` |

> 重要原則：日文「學習內容」與 UI 文字分開設定，內容用明朝（有重量感、優雅），介面用黑體（清爽好讀）。

### 2.2 階層

| Token | Size / Line / Weight | 用途 |
|---|---|---|
| `display`   | 36 / 44 / 700 | 大數字（streak、進度） |
| `h1`        | 28 / 36 / 700 | 畫面標題 |
| `h2`        | 22 / 30 / 600 | 區塊標題 |
| `h3`        | 18 / 26 / 600 | 卡片標題 |
| `bodyLg`    | 17 / 26 / 400 | 主要內文（iOS 預設） |
| `body`      | 15 / 22 / 400 | 一般內文 |
| `caption`   | 13 / 18 / 500 | metadata、tag |
| `tiny`      | 11 / 14 / 500 | 角標 |
| `jpLearn`   | 24 / 38 / 500 (Mincho) | 日文學習詞彙 |
| `jpLearnLg` | 36 / 52 / 500 (Mincho) | 單字卡主詞 |
| `jpFurigana`| 11 / 14 / 400 (Mincho) | 振假名 |

### 2.3 字距 (`letterSpacing`)
- Display / H1：`-0.5`
- H2 / H3：`-0.3`
- Body：`0`
- Caption / Tiny：`0.2`
- 日文（Mincho）：`0.5` — 多一點呼吸

---

## 3. Spacing scale

4-base，給 padding / margin / gap 用：

```
xs   4
sm   8
md   12
base 16   ← 預設
lg   20
xl   24
2xl  32
3xl  48
4xl  64
```

> 卡片內 padding 預設 `xl`(20)；畫面左右安全邊距 `xl`(20)；卡片間距 `md`(12) 或 `base`(16)。

---

## 4. Radius

走「圓角溫和」路線，不要直角也不要 pill：

| Token | Value |
|---|---|
| `sm`   | 8  |
| `md`   | 12 |
| `lg`   | 16 |
| `xl`   | 20 |  ← 卡片預設
| `2xl`  | 28 |  ← 大型 hero 區塊
| `pill` | 9999 |  ← chip / FAB

---

## 5. Shadow / Elevation

iOS 原生風 — 柔、低、暖。**不要黑色、不要硬陰影**。

```ts
// Light mode
sm:  { shadowColor:'#1A1614', shadowOffset:{w:0,h:1}, shadowOpacity:0.04, shadowRadius:2,  elevation:1 }
md:  { shadowColor:'#1A1614', shadowOffset:{w:0,h:4}, shadowOpacity:0.06, shadowRadius:12, elevation:3 }
lg:  { shadowColor:'#1A1614', shadowOffset:{w:0,h:8}, shadowOpacity:0.08, shadowRadius:24, elevation:6 }

// Dark mode 用更輕的陰影 + 邊框補強
sm:  { ...same shape, shadowOpacity:0.25 }
md:  { ...same shape, shadowOpacity:0.35 }
```

> 暗色模式陰影效果有限，請改用 `border` 區分層級。

---

## 6. Motion

- 預設 timing：`duration 220ms`, `easing easeOutCubic`
- 卡片進場：`opacity 0→1 + translateY 8→0`，220ms
- Tab 切換：`opacity crossfade 180ms`，**不要 slide**
- 按鈕按下：`scale 1→0.97`，120ms
- AI 訊息進場：逐字 typewriter，每字 30ms（但 ≤ 800ms 全顯）

---

## 7. Iconography

- 圖標 stroke：`1.5px`（避免 2px 卡通感）
- 圖標尺寸：`16 / 20 / 24`
- 來源建議：`react-native-feather` 或 `lucide-react-native`，**禁用** filled emoji-style icon
- AI 老師 avatar：圓形、`#F4EFE5` 底 + sumi 線條的「先生」漢字章戳感

---

## 8. Component baseline

### Button
- height: 52（primary）/ 44（secondary）
- radius: `lg`(16)
- primary: bg `primary` + onPrimary 文字 + `body` weight 600
- secondary: 透明 bg + `border` 1px + `text` 文字
- ghost: 純文字 + `primary` 色
- 按下：`scale 0.97` + `opacity 0.85`

### Card
- bg: `card`
- radius: `xl`(20)
- padding: 20
- shadow: `sm`（淺色）/ border 1px（深色）

### Input
- height: 48
- radius: `md`(12)
- bg: `cardSoft`
- border: 1px `border`，focus `borderStrong`
- placeholder: `mutedText`

### TabBar (bottom)
- bg: `bg` + 上方 1px `border`
- 高度 49 + safe area
- active icon + label：`primary`
- inactive：`subtext`

---

## 9. 三語注意事項

- 韓文行高比中文高 2–4px（避免黏連）
- 繁中標題可比英文大 1px（漢字筆劃多）
- 字串長度差距大，所有按鈕用 `flex` 而非固定寬度
- 日期、時間：locale-aware，禁止硬編碼 `MM/DD`

---

## 10. 不要做的事 ⛔

- 不要漸層背景（破壞和紙質感）
- 不要 emoji icon 當 UI（caf é 感 vs Duolingo 感）
- 不要彩色卡通插圖
- 不要超過 3 種色相同框
- 不要純黑 `#000` 或純白 `#FFF` 當 text/bg
- 不要直角 radius（除了狀態列、tab bar 分隔線）
- 不要 `font-weight: 800/900`（過粗破壞優雅）
