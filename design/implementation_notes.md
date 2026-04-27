# Implementation Notes — Nihongo Manabi v2 視覺改版

> 給工程師：照著這份文件搬，視覺層就完整轉到新 design system，
> **不動商業邏輯、不動 navigation、不動 API**。

---

## TL;DR — 三步驟搬遷

1. 把 `lib/theme.tsx` 換成新版（見 §2）。
2. 全專案搜尋 `#4F46E5` / `indigo` → 改成讀 `theme.colors.primary`。
3. 載入 Hiragino / Noto CJK 字型，加 `<JPText>` wrapper component（見 §4）。

---

## 1. 影響範圍盤點

| 區域 | 改動程度 | 說明 |
|---|---|---|
| `lib/theme.tsx` | 🔴 全換 | 主檔，下面有完整範本 |
| Button / Card / Input components | 🟡 微調 | radius、padding、shadow 從 theme 取 |
| 字型載入（`expo-font`） | 🟡 新增 | 載入 Hiragino fallback / Noto Sans / Serif JP |
| 所有寫死的 `#4F46E5` | 🔴 必清 | grep 出來改成 `theme.colors.primary` |
| 所有寫死的 hex / rgb | 🟡 視情況 | 跟「用色語意」相關的就 token 化 |
| Navigation / state / API | ⚪ 不動 | |

執行：

```bash
# 找出所有舊 indigo 用法
rg -n "4F46E5|#4F4|indigo" src/

# 找出所有寫死的 hex（可能漏網之魚）
rg -n "#[0-9A-Fa-f]{6}" src/ | rg -v "theme\."
```

---

## 2. `lib/theme.tsx` 完整範本

> 假設你目前用「colors / typography / spacing」結構。直接複製覆蓋。

```tsx
// lib/theme.tsx
import { TextStyle, ViewStyle, useColorScheme } from 'react-native';

// ─── Base palette ───────────────────────────────────────────
const palette = {
  sakura: {
    50:  '#FBEEF0',
    100: '#F4DDDF',
    300: '#E2A6AC',
    500: '#C8767D',  // primary
    700: '#9C545B',
    light: '#E89BA1', // dark mode primary
  },
  sumi: {
    900: '#1A1614',
    800: '#25201E',
    700: '#3A332F',
    500: '#6B6258',
    300: '#A8A097',
    100: '#E8E2D6',
  },
  washi: {
    0:   '#FFFFFF',
    50:  '#FAF7F2',  // light bg
    100: '#F4EFE5',
  },
  matcha:   { 500: '#7BA876', light: '#9CC196' },
  yamabuki: { 500: '#D4A24C', light: '#E0B872' },
  ai:       { indigo: '#5B6BB8', light: '#8593D4' },
};

// ─── Semantic tokens ────────────────────────────────────────
const lightColors = {
  bg:           palette.washi[50],
  bgElevated:   palette.washi[0],
  card:         palette.washi[0],
  cardSoft:     palette.washi[100],
  border:       palette.sumi[100],
  borderStrong: '#D4CCBE',
  text:         palette.sumi[900],
  subtext:      palette.sumi[500],
  mutedText:    '#9C9388',
  primary:      palette.sakura[500],
  primarySoft:  palette.sakura[100],
  primaryDeep:  palette.sakura[700],
  onPrimary:    '#FFFFFF',
  success:      palette.matcha[500],
  successSoft:  '#E5EEDD',
  warning:      palette.yamabuki[500],
  warningSoft:  '#F5E8C8',
  aiAccent:     palette.ai.indigo,
  aiSoft:       '#E2E5F2',
};

const darkColors: typeof lightColors = {
  bg:           palette.sumi[900],
  bgElevated:   '#2A2421',
  card:         palette.sumi[800],
  cardSoft:     '#1F1B19',
  border:       palette.sumi[700],
  borderStrong: '#52483F',
  text:         '#F2EDE5',
  subtext:      palette.sumi[300],
  mutedText:    '#7A7166',
  primary:      palette.sakura.light,
  primarySoft:  '#3D2A2C',
  primaryDeep:  '#F4B5B9',
  onPrimary:    palette.sumi[900],
  success:      palette.matcha.light,
  successSoft:  '#2A3527',
  warning:      palette.yamabuki.light,
  warningSoft:  '#3A2F1E',
  aiAccent:     palette.ai.light,
  aiSoft:       '#2A2D44',
};

// ─── Typography ─────────────────────────────────────────────
const fonts = {
  ui: 'System', // San Francisco / system default
  uiJP: 'HiraginoSans-W4',
  jpSerif: 'HiraginoMincho-W5',
  rounded: 'SF-Pro-Rounded',
};

type TextVariant =
  | 'display' | 'h1' | 'h2' | 'h3'
  | 'bodyLg' | 'body' | 'caption' | 'tiny'
  | 'jpLearn' | 'jpLearnLg' | 'jpFurigana';

const typography: Record<TextVariant, TextStyle> = {
  display:    { fontSize: 36, lineHeight: 44, fontWeight: '700', letterSpacing: -0.5 },
  h1:         { fontSize: 28, lineHeight: 36, fontWeight: '700', letterSpacing: -0.5 },
  h2:         { fontSize: 22, lineHeight: 30, fontWeight: '600', letterSpacing: -0.3 },
  h3:         { fontSize: 18, lineHeight: 26, fontWeight: '600', letterSpacing: -0.3 },
  bodyLg:     { fontSize: 17, lineHeight: 26, fontWeight: '400' },
  body:       { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  caption:    { fontSize: 13, lineHeight: 18, fontWeight: '500', letterSpacing: 0.2 },
  tiny:       { fontSize: 11, lineHeight: 14, fontWeight: '500', letterSpacing: 0.2 },
  jpLearn:    { fontSize: 24, lineHeight: 38, fontWeight: '500', letterSpacing: 0.5, fontFamily: fonts.jpSerif },
  jpLearnLg:  { fontSize: 36, lineHeight: 52, fontWeight: '500', letterSpacing: 0.5, fontFamily: fonts.jpSerif },
  jpFurigana: { fontSize: 11, lineHeight: 14, fontWeight: '400', fontFamily: fonts.jpSerif },
};

// ─── Spacing / radius ───────────────────────────────────────
const spacing = { xs: 4, sm: 8, md: 12, base: 16, lg: 20, xl: 24, '2xl': 32, '3xl': 48, '4xl': 64 };
const radius  = { sm: 8, md: 12, lg: 16, xl: 20, '2xl': 28, pill: 9999 };

// ─── Shadows (iOS first, Android elevation fallback) ────────
const shadows: Record<'sm'|'md'|'lg', ViewStyle> = {
  sm: { shadowColor: palette.sumi[900], shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2,  elevation: 1 },
  md: { shadowColor: palette.sumi[900], shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  lg: { shadowColor: palette.sumi[900], shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 24, elevation: 6 },
};

// ─── Theme builder ──────────────────────────────────────────
export const buildTheme = (mode: 'light'|'dark') => ({
  mode,
  colors: mode === 'dark' ? darkColors : lightColors,
  fonts,
  typography,
  spacing,
  radius,
  shadows: mode === 'dark'
    ? { ...shadows, md: { ...shadows.md, shadowOpacity: 0.35 }, sm: { ...shadows.sm, shadowOpacity: 0.25 } }
    : shadows,
});

export type Theme = ReturnType<typeof buildTheme>;

// ─── React hook ─────────────────────────────────────────────
import React, { createContext, useContext } from 'react';
const ThemeContext = createContext<Theme>(buildTheme('light'));

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const scheme = useColorScheme();
  const theme = React.useMemo(() => buildTheme(scheme === 'dark' ? 'dark' : 'light'), [scheme]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
```

---

## 3. Token 對照表（舊 → 新）

| 舊（散落各處的寫法） | 新（從 theme 拿） |
|---|---|
| `#4F46E5` | `theme.colors.primary` |
| `#FFFFFF` 當 bg | `theme.colors.bg` 或 `card` |
| `#000000` 當 text | `theme.colors.text` |
| `#666` / `#999` subtext | `theme.colors.subtext` |
| `borderColor: '#E5E7EB'` | `theme.colors.border` |
| `borderRadius: 8` | `theme.radius.md` |
| `borderRadius: 12` | `theme.radius.lg` 或 `xl` |
| `padding: 16` | `theme.spacing.base` |
| `shadowColor: '#000'` 各種隨手寫 | `...theme.shadows.md` |
| `fontSize: 16` 純英文 | `...theme.typography.bodyLg` |
| 寫死日文 fontSize | `...theme.typography.jpLearn` |

---

## 4. 字型載入（Expo）

### 4.1 `app.json`

```json
{
  "expo": {
    "plugins": [
      ["expo-font", {
        "fonts": [
          "./assets/fonts/NotoSansJP-Regular.otf",
          "./assets/fonts/NotoSansJP-Medium.otf",
          "./assets/fonts/NotoSansJP-Bold.otf",
          "./assets/fonts/NotoSerifJP-Regular.otf",
          "./assets/fonts/NotoSerifJP-Medium.otf"
        ]
      }]
    ]
  }
}
```

> iOS 上 Hiragino 已內建（`HiraginoSans-W3/W6`、`HiraginoMincho-W3/W5`），只有 Android 需要 Noto fallback。
> 為了三平台統一，建議 iOS 也用 Noto JP，避免「iOS 漂亮、Android 像系統字」的觀感斷裂。

### 4.2 `JPText` 包裝元件（強烈建議）

把日文文字統一過一個包裝，未來要換字型只改一處：

```tsx
// components/JPText.tsx
import { Text, TextProps } from 'react-native';
import { useTheme } from '../lib/theme';

type Variant = 'learn' | 'learnLg' | 'furigana' | 'ui';

export const JPText: React.FC<TextProps & { variant?: Variant }> = ({
  variant = 'learn', style, ...rest
}) => {
  const t = useTheme();
  const style$ = {
    learn:    t.typography.jpLearn,
    learnLg:  t.typography.jpLearnLg,
    furigana: t.typography.jpFurigana,
    ui:       { fontFamily: t.fonts.uiJP, fontSize: 15, color: t.colors.text },
  }[variant];
  return <Text style={[style$, style]} {...rest} />;
};
```

**用法**：

```tsx
<JPText variant="learnLg">桜</JPText>
<JPText variant="furigana">さくら</JPText>
```

---

## 5. 元件層 — 最小改動清單

### Button

```tsx
const Button = ({ kind = 'primary', children, onPress }) => {
  const t = useTheme();
  const bg  = kind === 'primary' ? t.colors.primary : 'transparent';
  const fg  = kind === 'primary' ? t.colors.onPrimary : t.colors.text;
  const border = kind === 'secondary' ? { borderWidth: 1, borderColor: t.colors.border } : {};
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ([{
        height: kind === 'primary' ? 52 : 44,
        backgroundColor: bg,
        borderRadius: t.radius.lg,
        paddingHorizontal: t.spacing.lg,
        alignItems: 'center', justifyContent: 'center',
        opacity: pressed ? 0.85 : 1,
        transform: [{ scale: pressed ? 0.97 : 1 }],
      }, border])}
    >
      <Text style={{ ...t.typography.body, fontWeight: '600', color: fg }}>{children}</Text>
    </Pressable>
  );
};
```

### Card

```tsx
const Card: React.FC<ViewProps> = ({ style, children, ...rest }) => {
  const t = useTheme();
  return (
    <View
      style={[{
        backgroundColor: t.colors.card,
        borderRadius: t.radius.xl,
        padding: t.spacing.lg,
        ...t.shadows.sm,
        // 暗色用 border 取代陰影
        ...(t.mode === 'dark' && { borderWidth: 1, borderColor: t.colors.border, shadowOpacity: 0 }),
      }, style]}
      {...rest}
    >
      {children}
    </View>
  );
};
```

### Input

```tsx
const Input = (props) => {
  const t = useTheme();
  const [focus, setFocus] = useState(false);
  return (
    <TextInput
      placeholderTextColor={t.colors.mutedText}
      onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
      style={{
        height: 48,
        borderRadius: t.radius.md,
        backgroundColor: t.colors.cardSoft,
        borderWidth: 1,
        borderColor: focus ? t.colors.borderStrong : t.colors.border,
        paddingHorizontal: t.spacing.base,
        color: t.colors.text,
        ...t.typography.body,
      }}
      {...props}
    />
  );
};
```

---

## 6. StatusBar / Navigation 細節

### StatusBar

```tsx
import { StatusBar } from 'expo-status-bar';
const t = useTheme();
<StatusBar style={t.mode === 'dark' ? 'light' : 'dark'} />
```

### React Navigation theme 同步

```tsx
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';

const navTheme = (t: Theme) => ({
  ...(t.mode === 'dark' ? DarkTheme : DefaultTheme),
  colors: {
    ...(t.mode === 'dark' ? DarkTheme : DefaultTheme).colors,
    background: t.colors.bg,
    card: t.colors.bg,            // 注意：tab/header 底跟 bg 一致，靠 1px border 分層
    text: t.colors.text,
    primary: t.colors.primary,
    border: t.colors.border,
  },
});
```

---

## 7. 三語注意

| 語言 | 字型 | 行高加成 | 標題字級 |
|---|---|---|---|
| 繁中 (zh-TW) | `PingFang TC` / system | +0 | 比英文 +1 |
| 英文 (en)    | system (SF Pro) | +0 | base |
| 韓文 (ko)    | `Apple SD Gothic Neo` / system | +2~4 | base |

> 韓文行高要再加 2-4px，否則韻母容易黏在一起。把 `lineHeight` 寫進 i18n 語言切換時的 hook 裡。

---

## 8. 把舊 indigo 沖掉的搜尋指令

```bash
# 主色字串
rg -l "4F46E5" src/ | xargs sed -i '' 's/#4F46E5/{theme.colors.primary}/g'  # 跑前先看 diff！

# 推薦做法：手動逐檔處理，因為很多寫法不能直接 sed
rg -n "4F46E5|colors\.indigo|bg-indigo" src/
```

---

## 9. 不要做的事 ⛔

- 不要把 dark mode 寫成「對 light 顏色做反相」— 會出現詭異紫紅。一律用 `darkColors` token。
- 不要在 component 內部 hardcode `#FFF` / `#000` — 全部走 theme。
- 不要保留任何 `borderRadius: 4` 直角 — 最小都是 `radius.sm`(8)。
- 不要用 `react-native-shadow-2` 之類的重型陰影套件 — 系統 shadow 夠用。
- 不要為了 dark mode 加深整個畫面亮度的 overlay — 直接用 `darkColors`。

---

## 10. 驗證 checklist

切換 light/dark 各跑一次，逐項勾：

- [ ] 開 App 第一秒沒有閃白
- [ ] AI Chat 的「先生」avatar 兩個模式都看得清
- [ ] 單字卡的「桜」用 Mincho 渲染（有筆鋒）
- [ ] tab bar active 的 sakura 粉在兩個模式都不刺眼
- [ ] 連續學習的 streak 數字用 Rounded
- [ ] 韓文介面下日文標題不被切掉
- [ ] iPhone SE（小螢幕）卡片 padding 沒爆
- [ ] iPad 上 max-width 限制 600px（避免單欄拉超寬）

---

## 11. 後續可做（不在本次範圍）

- 微互動：學完一個單字時，從卡片邊緣飄出 1-2 片櫻花花瓣（Reanimated 寫，僅 light mode）
- 季節主題：夏天換成「藍紫陽花」、秋天「楓紅」 — 換 `palette` 即可
- 深色模式溫度切換：讓使用者選「冷墨」/「暖墨」（差別在 cream 的飽和度）
