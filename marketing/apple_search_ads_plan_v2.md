# Apple Search Ads — Launch Plan v2 (Nihongo Manabi, Taiwan)

**Extends** `apple_search_ads_sop.md` (v1). v1 stays valid on the mechanics (ASA Advanced, TW-only, Search Match OFF by default, exact-first, 7-day watch metrics). v2 upgrades the single-campaign design into a 4-campaign structure, adds real competitor keywords, ties every bid to unit economics, and replaces the vague "CPI < NT$30" gate with a math-derived ceiling and a hard month-1 decision rule.

App: **Nihongo Manabi** (id 6760352124) · Storefront: **Taiwan only** · Budget: **NT$1000/mo (~NT$30–50/day)** · Status: v1.5.0 live, ~14 users, **0 paying yet**.

---

## 1. TL;DR (read this first)

You are running a **NT$1000/month learning experiment, not a growth channel**. The economics are brutally clear: under conservative funnel assumptions ASA loses money at almost any real CPI (max sustainable CPI ~NT$2). It only works if your **trial→paid conversion lands optimistic (≥35–40%)** AND you're in Apple's Small Business Program (15% cut, not 30%). Your realistic, defensible **CPI ceiling is ~NT$6–12** on a 12-month payback — well below v1's casual "NT$30 is fine" assumption. So the entire goal of month 1 is **not profit — it's to measure one number: the real trial→paid rate from RevenueCat.** Everything below is engineered to spend as little as possible while producing that number cleanly. **Do the free thing first: enrol in the Small Business Program today** — it lifts net revenue ~21% and roughly doubles your CPI ceiling for zero effort.

**Go/no-go ceiling:** keep any keyword whose ASA CPI ≤ **NT$12**; treat NT$12–18 as marginal (hold + fix funnel); anything > NT$18–20 with no trials is a kill. These replace v1's NT$30/NT$50 thresholds.

---

## 2. Campaign structure — 4 campaigns, not 1

v1's biggest money-leak risk was one campaign / one ad group: brand, generic, and competitor taps share a budget and a bid, so a NT$5 brand tap and a NT$22 competitor tap fight for the same pool and you can never tell which keyword class produced a trial. On a tiny budget, **control and clean measurement beat reach.** Split into four campaigns, each with its own budget cap, bid ceiling, and clean CPI read.

| # | Campaign | Purpose | Search Match |
|---|---|---|---|
| 1 | **Brand** | Defend "Nihongo Manabi" queries. Cheapest CPT, near-100% intent, blocks competitors bidding on your name. | OFF |
| 2 | **Generic / Category** | Your seed terms — 學日文 / 五十音 / JLPT / N5. Volume + revenue engine, highest CPI, tightest bid discipline. | OFF |
| 3 | **Competitor** | Bid on rival brand names (real names in §3). Highest switch-intent, lowest CR, highest CPT — quarantined so it can't drain Generic. | OFF |
| 4 | **Discovery** | Apple auto-matches you to queries you didn't list. Your keyword-research engine — mine winners, graduate to Generic. | **ON** |

**Why Search Match is ON only in Discovery:** if it's on inside Brand/Generic/Competitor, Apple spends those budgets on unpredictable auto-matched terms and you lose the per-keyword read that's the whole point of splitting. Quarantine all auto-matching into Discovery so every "unknown" tap is intentional and observable. This is the one structural upgrade v1 lacks (v1 keeps Search Match OFF everywhere, which is safe but throws away free keyword discovery).

### Daily budget split (percentages hold at any spend level)

| Campaign | Share | @ NT$30/day | @ NT$50/day |
|---|---|---|---|
| Brand | 10% | NT$3 | NT$5 |
| Generic / Category | 45% | NT$14 | NT$23 |
| Competitor | 15% | NT$4 | NT$7 |
| Discovery | 30% | NT$9 | NT$15 |

Generic gets the plurality (volume + revenue). Discovery gets a heavy 30% early because on a cold account it's the cheapest way to find keywords you'd never guess — treat it as R&D. Brand is a NT$3 placeholder (branded volume at 14 users is ~zero; it's cheap insurance). Competitor is small, capped, speculative. **Around week 3–4, once Discovery winners are harvested, shift ~10% from Discovery into Generic.**

> **Reconciling with v1:** v1 set one Daily Cap of NT$50. Keep the **account/group-level cap at NT$50** as your hard ceiling, but distribute it across the four campaign daily budgets above (they sum to NT$50 at the high end, NT$30 at the low end). Start at NT$30/day total for the first ~10 days of price discovery, then step to NT$50 once you trust the CPI read.

---

## 3. Keyword plan per campaign

Match-type shorthand: **Exact** = tight, high-intent, controllable CPT. **Broad** = discovery only (Search Match OFF), mined weekly. Conquesting is **Exact only** — never Broad on a competitor's name.

### Campaign 1 — Brand (Exact, bid to win #1)

`nihongo manabi` · `nihongomanabi` · `nihongo manebi` · `nihongo manavi` · `日本語まなび` · `にほんご まなび` · `manabi 日文` · `manabi 日語` · `日語 manabi`
Broad (low bid, watch): `nihongo` (it's a real JP word — keep tiny). Cheapest CPT, highest CR; set-and-forget, scales as Reels/organic grow.

### Campaign 2 — Generic / Category (Exact = core of the account)

**HIGH (strongest bids — where trial→paid is most likely):**
`學日文` · `學日語` · `日語學習` · `日文學習` · `日文 app` · `日語 app` · `學日文 app` · `自學日文` · `日文自學` · `五十音` · `學五十音` · `五十音表` · `JLPT` · `JLPT N5` · `JLPT N4` · `JLPT N3` · `JLPT N2` · `JLPT N1` · `日檢` · `日文檢定` · `日語檢定` · `日檢 N3` · `日檢 N2` · `日檢 N1` · `JLPT 模擬試題` · `JLPT 考古題` · `日檢考古題` · `準備日檢 N3` · `日檢 N2 準備` · `AI 學日文` · `AI 日文對話` · `日文對話練習` · `旅遊日文` · `旅行日文`

**MED (Exact, moderate bids):**
`日本語学習` · `nihongo 学習` · `學日文軟體` · `日文學習軟體` · `日文入門` · `從零開始學日文` · `N5`/`N4`/`N3`/`N2`/`N1` (ambiguous alone) · `JLPT 單字` · `N3 單字` · `N2 文法` · `平假名` · `片假名` · `假名` · `日文對話` · `日語會話` · `拍照翻譯日文` · `日文拍照翻譯` · `動漫日文` · `看動漫學日文` · `日文發音` · `日文單字` · `日文文法` · `日文聽力` · `零基礎學日文` · `新手學日文` · `日文自學推薦` · `學日文 app 推薦`

**Broad head (this campaign, low bid, discovery — first to cut):** `日文` · `日語` · `日本語`

**LOW / skip:** English terms (`learn japanese`, `japanese app`), `日文家教`/`線上日文家教` (searcher wants a human tutor — low CR), `日文速成`/`30 天學日文`.

*Why this ordering:* **JLPT is your sharpest wedge** — those searchers have a deadline and N1/N2 mock exams are exactly what Pro unlocks, so it's your best trial→paid path. `日檢` outpulls `JLPT` in TW. `五十音` is your huge top-of-funnel. The **AI 日文對話** cluster is your differentiator vs flashcard apps. Watch `拍照翻譯` — it sits near tool-intent and can pull translate-only users who bounce at the paywall.

### Campaign 3 — Competitor (Exact ONLY — real names)

Start with the **top 3 only** (highest intent + most similar model). Add wave 2 after top 3 prove out.

| Wave | Competitor | Exact keywords to bid | Why / wedge |
|---|---|---|---|
| **1** | **Migii JLPT** (日檢練習) | `migii` · `migii jlpt` · `日檢練習` | Pure JLPT exam engine, ~#22 TW Education chart. Searchers are JLPT-committed. Wedge: "not just mock exams — AI 對話 + 拍照翻譯 included." |
| **1** | **Todaii** (簡易日文) | `todaii` · `簡易日文` · `簡明日語` | **Same dev studio as Migii; closest model twin** (news + JLPT + AI chat + photo). Wedge: TW-native price NT$99/mo vs their higher annual, + unlimited AI chat. |
| **1** | **Readle 學日文** | `readle` · `readle 日文` · `readle 學日文` | Same monetization as you (7-day trial, mo/yr subs) → pre-qualified to pay. Wedge: JLPT N1/N2 mock exams they don't emphasize. |
| **2** | **MOJi辞書** | `moji` · `moji辞書` · `moji 辞書` | De-facto zh dictionary, big intermediate+ base. Lower intent-to-subscribe (advanced dictionary users). Add only after wave 1 converts. |
| **2** | **MARU 五十音特訓** | `maru 日文` · `maru 五十音` · `五十音特訓` | Kana-onboarding for absolute beginners (1M+ DLs), top-of-funnel. Free-beginner skew → lower subscribe intent. Wave 2. |
| ⚠️ toe-hold | LingoDeer | `lingodeer` only | Tiny exact toe-hold, not a budget line. |

**Skip entirely:** Duolingo (99% casual-gamified intent, premium CPT, low JLPT-serious CR — you'll burn NT$ against a giant), Anki (free/DIY users), Busuu/Rosetta/Memrise (negligible TW Japanese-brand search, wrong-shaped audience). **Also add these skipped names as negatives** so their halo traffic never leaks into Broad ad groups.

> **Verify before committing:** Migii's ~#22 chart position is a live snapshot; confirm actual TW brand-search volume + impression share for each term inside the ASA keyword tool before setting bids.

### Campaign 4 — Discovery (Search Match ON, low bid)

No keywords listed by design — Apple matches you. Seed nothing; harvest weekly (§4 loop). Add all promoted winners back as **negative exacts here** so Discovery keeps hunting new territory.

### Negative keywords (apply campaign-level to Brand/Generic/Competitor)

- **Tool / translation intent:** `日文翻譯` · `中翻日` · `日翻中` · `中文翻日文` · `翻譯機` · `線上翻譯` · `google 翻譯` · `日文翻譯機` · `ocr`. Keep these as **Exact negatives** — do NOT Broad-negative `翻譯` globally or you'll kill your own `拍照翻譯日文` feature keyword. (v1 already skips 日文翻譯/中翻日; this formalizes it.)
- **Entertainment / passive:** `日文歌` · `日語歌` · `日文歌詞` · `日劇` · `日本電影` · `動漫線上看` · `看動漫` · `日本綜藝` · `聲優`. Keep `動漫日文`/`看動漫學日文` **active** — only block pure-entertainment 動漫 phrases.
- **Wrong-language:** `學中文` · `中文學習` · `韓文` · `學韓文` · `英文` · `learn chinese` · `learn korean`.
- **Physical / offline:** `日文書` · `補習班` · `日文課程` · `家教老師`.
- **Free-only — DO NOT hard-block at launch.** Your free tier is generous, so `免費` traffic can still enter the funnel. Monitor its trial→paid rate for 2 weeks, then negative `免費日文`/`免費學日文` only if CR-to-Pro is ~0.
- **Cross-group de-dup:** add every Generic/Competitor Exact keyword as a **negative exact in Discovery**, so Discovery only ever spends on *new* terms.

---

## 4. Bids + weekly optimization loop

ASA bids in NT$ Max CPT (a **ceiling**, not what you pay). Bid to intent: cheap where conversion is near-certain, higher only where you must outbid to appear.

| Campaign / keyword class | Starting Max CPT | Why |
|---|---|---|
| **Brand** | **NT$4–6** | Near-zero competition on your own name; you rarely pay the ceiling. |
| **Generic — high intent** (學日文, 日語學習, 五十音, JLPT, N5/N4/N3, 日文app, AI學日文, 日檢) | **NT$12–16** | Core buyers. Budget should flow here. |
| **Generic — broad head** (日文, 日語, 日本語, 日文學習) | **NT$8–10** | High volume, lower intent, worse CPI — bid *below* high-intent; first to cut. |
| **Competitor** | **NT$16–22** | You're interrupting someone else's search; must outbid to show, lower CR — the campaign cap contains total spend. |
| **Discovery** | **NT$8–12** | Deliberately modest — fishing across unknown terms; don't let one auto-match overpay before it's proven. |

> These ranges and the CPI thresholds are **reasoned estimates, not verified TW benchmarks.** Week 1–2 is price discovery — your ASA dashboard CPTs and RevenueCat trial→paid rate replace these placeholders as soon as you have ~2 weeks of data. This supersedes v1's flat "NT$10 default CPT" with intent-tiered ceilings; keep NT$10 only as a fallback for anything unclassified.

### Discovery → Harvest → Promote loop (the compounding engine)

1. **Discover** — Discovery (Search Match ON) surfaces real matched queries → ASA dashboard → Discovery → Search Terms report.
2. **Harvest** — weekly, pull terms with installs (or strong tap→install) at acceptable CPI.
3. **Promote** — add each winner as an **exact keyword in Generic** at ~NT$12–16, tuned from its Discovery CPI.
4. **Negative-block** — add that same term as a **negative exact in Discovery** so it stops re-spending on a promoted winner. This single step keeps Discovery productive for months.
5. **Losers** (taps, no installs) → **negative exact in Discovery** so budget stops flowing.

### Weekly bid loop — run every Monday, 7-day rolling window

On this budget you'll see only a few hundred taps/week — enough to spot obvious losers, not to micro-tune. **Bias toward pausing clear failures and slowly feeding clear winners. Change one variable per keyword per week.**

**Per-keyword rules:**
- **Pause** — ≥ ~15–20 taps and 0 installs; or CPI > 2× target with no trials.
- **Lower bid ~15–20%** — CPI above target but still getting installs, OR winning high impression share (overpaying to win an auction you'd win cheaper).
- **Raise bid ~15%** — CPI comfortably below target AND low impression share (leaving volume on the table).
- **Hold** — CPI near target and stable.

**Per-campaign rules:**
- Campaign spends its full daily budget every day *and* CPI is good → raise its budget (pull from a campaign not spending out).
- Brand never spends its NT$3–5 → fine, leave it; it's insurance.
- **Funnel cross-check:** if ASA reports installs but RevenueCat shows no trials that period, the leak is **post-install (paywall/onboarding), not the bid** — don't raise bids into a broken funnel.

Impression share near zero after 3–4 days = bid too low to enter the auction, raise in ~15% steps. Winning taps but bad CPI = conversion problem (screenshots/paywall), not bid.

---

## 5. Unit economics & the month-1 decision rule

**Enrol in the [Small Business Program](https://developer.apple.com/app-store/small-business-program/) first** — free, lifts net revenue ~21% (15% cut vs 30%), roughly doubles your CPI ceiling. All numbers below assume the 15% cut.

**Net per payment @ 15%:** Monthly NT$99 → **NT$84.15** · Annual NT$590 → **NT$501.50** (≈ NT$41.79/mo effective).

**Funnel scenarios (all UNPROVEN — 0 paying users; validate against RevenueCat):**

| Metric | Conservative | Optimistic |
|---|---|---|
| Install → trial-start | 3% | 7% |
| Trial → paid | 20% | 40% |
| Install → paid (compound) | 0.60% | 2.80% |
| LTV per paying user @15% | ~NT$391 | ~NT$628 |
| **Blended LTV per install @15%** | **~NT$2.35** | **~NT$17.58** |

**Max sustainable CPI (this is your real ceiling — replaces v1's NT$30):**

| Payback | Conservative @15% | Optimistic @15% |
|---|---|---|
| < 3-month | NT$1.96 | NT$10.21 |
| < 12-month | **NT$2.35** | **NT$16.69** |

**Verdict:** On conservative assumptions, ASA loses money at any realistic CPI (ceiling ~NT$2, i.e. 7–15× below v1's NT$15–30 estimate). It approaches break-even **only** in the optimistic case, on 12-month payback, with SBP, at the low end of CPI (~NT$15 vs NT$16.69 ceiling — razor-thin). ASA is **a bet on hitting optimistic conversion, not a safe channel.** Defensible ceiling for a brand-new app: **~NT$6–12 on 12-month payback.**

### Month-1 GO / HOLD / KILL rule

Decision gate = **observed trial→paid from RevenueCat**, minimum sample **~30 trials** (below that, do not decide — extend the test). Assumes 15% cut, 12-month payback.

- **🟢 SCALE** — trial→paid **≥ 35%** AND install→paid **≥ 2%** AND observed ASA CPI **≤ NT$12** → raise budget.
- **🟡 HOLD** — trial→paid **20–35%** OR CPI **NT$12–18** → keep spend flat at NT$1000/mo, attack the funnel (paywall trigger timing, onboarding→trial prompt, annual-plan nudge to lift annual mix) before scaling.
- **🔴 KILL** — trial→paid **< 20%** OR install→paid **< 0.6%** OR CPI **> NT$20** with no path → pause ASA, redirect budget to the organic Reels funnel (~NT$0 marginal CPI).

**Caveat:** with ~14 users and 0 payers today, even a "good" month 1 can be noise. Treat month 1 as **directional**; require the signal to hold for a **second cohort** before committing real scale-up budget.

---

## 6. Measurement — the ONE number that decides scaling

You have three attribution surfaces; each answers a different question:

| Surface | Answers | Watch cadence |
|---|---|---|
| **ASA dashboard** | CPT, taps, installs, CPI, impression share **per keyword** | Daily spend check; weekly optimization |
| **Server `/r/` click attribution** (bot-filtered) | Reels→App Store funnel health (organic sanity check) | Weekly |
| **RevenueCat** (trials/subs/MRR → Telegram daily) | **trial-starts and trial→paid** | Daily glance, weekly decision |

**The single number that decides everything: observed trial→paid conversion (RevenueCat paid-conversions ÷ RevenueCat trial-starts).** Nothing else — not CPI, not installs — determines whether ASA is viable, because a great CPI into a funnel that doesn't convert trials is still a loss, and a mediocre CPI into a 40%-converting funnel scales.

**Wiring:** RevenueCat trial events ÷ ASA-attributed installs (from ASA's own attribution dashboard) = your trial-start rate; RevenueCat paid ÷ trials = the make-or-break number. Cross-check ASA installs against RevenueCat trials each Monday: **installs with no trials = post-install funnel leak, not a bid problem.** Don't trust trial→paid until ≥ ~30 trials — small-sample noise below that is enormous.

---

## 7. Launch checklist — Monday-morning, in order

**A. Before spending a cent (do today)**
1. ☐ **Enrol in Apple Small Business Program** — free 21% revenue lift, widens CPI ceiling. Highest-ROI action here.
2. ☐ Confirm RevenueCat → Telegram daily snapshot is firing (trials + subs + MRR).
3. ☐ Confirm `/r/` click attribution is bot-filtered and logging.
4. ☐ Verify paywall gating + Reel→App Store funnel fixes are live (you just fixed these — smoke-test the trial-start flow once).

**B. Account & campaigns (~30 min in ASA Advanced)**
5. ☐ Log into searchads.apple.com with the **same Apple ID as App Store Connect**, Advanced, **Taiwan** account, card on file (post-pay).
6. ☐ Campaign Group: `Nihongo Manabi - TW Test`. Set account/group cap **NT$50/day** hard ceiling.
7. ☐ Create **4 campaigns**, TW storefront, Search Match OFF on 1–3, **ON on Discovery**:
   - Brand — daily NT$3, Max CPT NT$4–6
   - Generic/Category — daily NT$14, Max CPT tiered NT$12–16 high / NT$8–10 broad head
   - Competitor — daily NT$4, Max CPT NT$16–22
   - Discovery — daily NT$9, Max CPT NT$8–12
   *(Start total at NT$30/day; step to NT$50 after ~10 days of clean CPI.)*
8. ☐ Load keywords per §3 (Exact everywhere except the 3 broad-head terms in Generic; Discovery gets none).
9. ☐ Competitor campaign: **wave 1 only** — Migii, Todaii, Readle (Exact). Hold MOJi/MARU for wave 2.
10. ☐ Add negatives per §3 (tool/translation as Exact-only, entertainment, wrong-language, offline, skipped-competitor names Duolingo/Anki/Busuu). **Do NOT block 免費 yet.**
11. ☐ Add all Generic + Competitor exact keywords as **negative exacts in Discovery** (cross-group de-dup).
12. ☐ Point competitor keywords at differentiator-led Custom Product Pages if available (Migii → "AI 對話 + 拍照翻譯 included"; Todaii → price + unlimited AI chat; Readle → N1/N2 mock exams). If no CPPs yet, ship with default screenshots and add CPPs in week 2.
13. ☐ Save. Ads go live within ~24h.

**C. Operating rhythm**
14. ☐ **Daily:** glance spend (not over cap) + RevenueCat trial-starts on Telegram.
15. ☐ **Weekly (Mon):** run the bid loop (§4) + Discovery harvest → promote → negative-block. One variable per keyword.
16. ☐ **~Week 2:** review 免費 trial→paid; negative it if ~0. Add competitor wave 2 (MOJi/MARU) only if wave 1 converts.
17. ☐ **~Week 3–4:** shift ~10% Discovery → Generic; scale bids on any HIGH keyword with CPI < NT$12 and real trial→paid.
18. ☐ **Day 28:** export ASA CSV; compute observed **trial→paid** (need ≥ 30 trials); apply the **SCALE / HOLD / KILL** rule (§5). Answer v1's month-end questions with real data: actual CPI? best-ROAS keyword? days-to-Pro conversion?

**North star for the whole month:** you are buying *one number* — trial→paid. If month 1 can't produce ≥30 trials to measure it, the correct move is to extend the test at flat budget, not to scale or kill.
