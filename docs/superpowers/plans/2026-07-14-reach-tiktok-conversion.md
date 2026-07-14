# 觸及時段 + TikTok 轉換路徑 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 發文移到 19:00 黃金時段，TikTok caption CTA 改指向唯一可點的 bio 連結。

**Architecture:** launchd plist 改觸發時間（系統層，不在 git）；auto_post.py 的 inject_redirect TT 分支改 CTA 文案；README 同步。TikTok bio 連結由 arlong 手動設定（無程式改動）。

**Tech Stack:** launchd、Python（無測試框架，驗證用 python3 -c 直呼函式）。

## Global Constraints

- 工作目錄 `/Users/arlong/Projects/japanese-learner/nihongo-reels`。
- git commit 只 add 明確列出的檔案，絕不 `git add -A`。
- Commit message 結尾附 `Claude-Session: https://claude.ai/code/session_016HatEKasmdDsC2Y8Gi4sJZ`。

---

### Task 1: TT caption CTA 指向 bio

**Files:**
- Modify: `scripts/auto_post.py:186-213`（TT_CTA 上方註解、docstring、insert 行）

- [ ] **Step 1: 改註解與 CTA 拼接**

`# TikTok: caption links ARE clickable — a one-line CTA placed just above the URL.` 改為：
```python
# TikTok: caption links are NOT clickable for normal accounts — CTA points to the
# (clickable) profile bio link; the raw URL stays for copy/paste + impressions.
```

docstring 的 `TT: caption links ARE clickable, so splice a one-line CTA + the tracked /r/ URL just above the hashtag block.` 改為 `TT: caption links are NOT clickable either — point the CTA at the bio link, keep the tracked /r/ URL below it for copy/paste.`

`lines.insert(insert_at, f"{TT_CTA}\n📲 {url}")` 改為：
```python
    lines.insert(insert_at, f"{TT_CTA}\n🔗 連結在個人檔案｜📲 {url}")
```

- [ ] **Step 2: 驗證輸出**

```bash
cd $REELS && python3 -c "
import sys; sys.path.insert(0, 'scripts')
import os; os.environ['REDIRECT_BASE_URL']='https://nihongo-manabi-proxy.vercel.app/r'
from auto_post import inject_redirect
out = inject_redirect('測試鉤子 🔥\n\n#日文 #fyp', 'Kana-16', 'tt')
print(out)
assert '🔗 連結在個人檔案｜📲 https://nihongo-manabi-proxy.vercel.app/r/Kana-16?p=tt' in out
assert inject_redirect('x\nApp Store 搜尋 Nihongo Manabi', 'y', 'ig').count('點個人檔案') == 1
print('PASS')"
```

Expected: 印出組好的 caption + `PASS`（IG 分支不受影響）。

- [ ] **Step 3: Commit**

```bash
git add scripts/auto_post.py
git commit -m "fix(reels): TT caption CTA points at bio link (captions aren't clickable)"
```

---

### Task 2: launchd 02:00 → 19:00

**Files:**
- Modify: `~/Library/LaunchAgents/com.nihongo.ig.plist`（不在 git）

- [ ] **Step 1: 改 Hour 並 reload**

```bash
plutil -replace StartCalendarInterval.Hour -integer 19 ~/Library/LaunchAgents/com.nihongo.ig.plist
launchctl unload ~/Library/LaunchAgents/com.nihongo.ig.plist
launchctl load ~/Library/LaunchAgents/com.nihongo.ig.plist
```

- [ ] **Step 2: 驗證**

```bash
plutil -p ~/Library/LaunchAgents/com.nihongo.ig.plist | grep -A3 StartCalendarInterval
launchctl list | grep com.nihongo.ig
```

Expected: `"Hour" => 19`；job 出現在 launchctl list（exit status 0 或 -）。

注意：今天 02:00 已跑過一輪；改成 19:00 後**今晚會再發一支**（一天兩支，只此一次）。可接受——若要避免，把今晚那次跳過的成本高於多發一支的影響。

---

### Task 3: README 時段同步

**Files:**
- Modify: `README.md`（daily flow 段的 `launchd (02:00)`）

- [ ] **Step 1: 更新 + 驗證 + Commit**

`launchd (02:00) → scripts/ig_schedule.sh` 改為 `launchd (19:00) → scripts/ig_schedule.sh`（若有其他 02:00 字樣一併檢查：`grep -n "02:00" README.md` 應清空）。

```bash
grep -n "19:00" README.md   # 顯示更新後的行
grep -c "02:00" README.md   # 0
git add README.md
git commit -m "docs(reels): daily flow now fires at 19:00 (prime-time reach)"
```

---

## 完成後（arlong 手動，一次性）

TikTok App → 編輯個人檔案 → 網站欄位貼上：`https://nihongo-manabi-proxy.vercel.app/r/bio?p=tt`
設好後點一下驗證，/api/stats recent 應出現 `filename=bio, platform=tt` 事件。
