# ASO Metadata 改版提案 v1（Nihongo Manabi）

**現況來源**：`scripts/asc_metadata.py` 於 2026-08-24 讀取 ASC API，app 1.5.3 / READY_FOR_SALE。
**重跑指令**：`set -a; . ./.env; set +a; python3 scripts/asc_metadata.py`

> **送審限制**：`name` / `subtitle` / `keywords` 三欄都**不能對已上架版本直接改**，必須開一個新版本（1.5.4）填入後隨 build 一起送審。唯一能隨時改、不用送審的是 promotional text。

---

## 1. 現況診斷

| 欄位 | 現況 | 問題 |
|---|---|---|
| name（三語系） | `Nihongo Manabi` (14/30) | 純品牌名，零關鍵字。權重最高的欄位完全沒用到，而品牌名本身在台灣無搜尋量 |
| subtitle（三語系） | **None** | 整欄放棄。副標權重與 name 同級，30 字元全空 |
| keywords zh-Hant | 62/100 | 閒置 38 字元；`單字,   文法` 夾 3 個多餘空格 |
| keywords en-US | 100/100 | 已塞滿，但與 name/subtitle 無分工（因為那兩欄是空的） |
| keywords ko | 與 zh-Hant 完全相同的中文詞 | 韓國商店索引吃不到中文，整欄浪費 |

---

## 2. 提案（可直接複製貼上）

### zh-Hant（主戰場）

**App Name** — 27/30
```
Nihongo Manabi - 學日文日檢N5-N1
```

**Subtitle** — 16/30
```
AI對話練口說・拍照翻譯・五十音
```

**Keywords** — 98/100
```
日語,日文,日語學習,日文學習,自學日文,零基礎,入門,平假名,片假名,假名,單字,文法,聽力,會話,日本語,旅遊日文,動漫,發音,考古題,模擬試題,N4,N3,N2,漢字,句型,日文檢定,單字卡
```

### en-US

**App Name** — 30/30
```
Nihongo Manabi: Learn Japanese
```

**Subtitle** — 27/30
```
JLPT N5-N1, Kana & AI Tutor
```

**Keywords** — 92/100
```
hiragana,katakana,kanji,vocab,grammar,anime,travel,ocr,speaking,listening,flashcard,n4,n3,n2
```

### ko

三個欄位目前都是中文或空的，等於沒有經營。**建議直接關掉 ko 語系**，把力氣集中在 zh-Hant/en-US；真要留就得請母語者重寫，半吊子的韓文反而傷轉換。

---

## 3. 選字理由

**核心原則**：Apple 索引的是 name + subtitle + keywords 的**聯集**，同一個詞出現在 name 就不該再吃 keywords 額度。現況三欄沒有分工（因為 subtitle 是空的），改版後三欄零重複。

- **name 放 `學日文` `日檢` `N5-N1`**：`日檢` 在台灣的搜尋量高於 `JLPT`（見 ASA plan §3 註解），且 JLPT 是轉換最利的切口——有考期壓力、N1/N2 模考正好是 Pro 解鎖的內容。這幾個詞放進權重最高的欄位。
- **subtitle 放三個差異點**：`AI對話` `拍照翻譯` `五十音`。前兩個是對打 flashcard 類競品的護城河，`五十音` 是最大的漏斗頂端流量。
- **keywords 只放 name/subtitle 沒有的詞**：補上 `N4/N3/N2`（name 只有 N5 和 N1）、長尾（`自學日文` `零基礎` `旅遊日文` `考古題`）、以及技能面向（`聽力` `會話` `發音`）。
- **移除 `JLPT`**：已被 name 的 `日檢` 和 en-US 覆蓋，中文商店重複放浪費額度。
- **修掉 3 個空格**：Apple 建議 keywords 純逗號分隔，空格會佔額度且影響 CJK 斷詞。已驗證新字串無空格、無全形逗號。
- **沒放競品名**：`migii` `todaii` `readle` 放進 keywords 會被拒審。競品字只能透過 ASA Campaign 3 買，不能寫在 metadata 裡。

---

## 4. 與 ASA 計畫的接點

`apple_search_ads_plan_v2.md` 的 Campaign 1（Brand）原本要鎖 `nihongo manabi`，但這名字在台灣自然搜尋量趨近於零。改版後 name/subtitle 帶上中文關鍵字，Generic campaign 打 `學日文` `日檢 N3` 時，落地頁的相關性才有東西支撐。

**建議順序**：ASO 隨 1.5.4 送審過關 → 觀察 2 週自然排名 → 再開 ASA。反過來做的話預算會打在相關性不足的頁面上。

---

## 5. 操作步驟

1. 開 https://appstoreconnect.apple.com → 選 **Nihongo Manabi**
2. 左側 **App Store** 分頁 → 最上方點 **+ 版本或平台** → 建立 **1.5.4**
3. 在 1.5.4 頁面右上角的語言下拉選 **繁體中文** → 把上面 zh-Hant 三段貼進 **名稱** / **副標題** / **關鍵字**
4. 語言下拉切到 **English (U.S.)** → 貼 en-US 三段
5. 語言下拉切到 **한국어** → 若決定關掉，點該語系旁的移除；要留就先擱著別動
6. 存檔後，欄位下方會顯示剩餘字元數 — 確認**沒有任何一欄變紅**（紅色代表超標，存不進去）
7. 等 1.5.4 的 build 上傳完再一起送審

**驗收**：送審過關後重跑 `python3 scripts/asc_metadata.py`，應看到 subtitle 不再是 `None`，且 zh-Hant keywords 不含空格。
