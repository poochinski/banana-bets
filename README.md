# NFL Model — Phase 0 & Phase 1 Setup

These are the two pieces I can hand you directly. What I *can't* do for you: create
accounts with nflverse/The Odds API/SportsDataIO, or click around inside your actual
Google account — those steps need you, and are marked below.

## What you got

1. **`NFL_Model_Workbook_Skeleton.xlsx`** — all 41 tabs from the spec, in the right
   order, with the 7 default tabs visible and everything else pre-hidden. Header
   rows are pre-filled wherever the spec gives an exact field list (RAW_SCHEDULE,
   RAW_TEAM_STATS, RAW_PLAYER_STATS, RAW_ODDS, RAW_ODDS_HISTORY, BET_LOG, TEAM_MAP,
   PLAYER_MAP, API_STATUS, ERROR_LOG). `91_TEAM_MAP` is fully populated with all 32
   teams. Everything else has a one-line note saying which phase builds it.
2. **This `appsscript/` folder** — every `.gs` file for Phase 0/1: menu, error
   logging, update lock, triggers, tab-visibility setup, and an automated Phase 1
   test suite.

## Setup steps (you do these — ~15–20 minutes)

1. **Import the workbook.** Go to sheets.google.com → File → Import → Upload →
   select `NFL_Model_Workbook_Skeleton.xlsx` → "Insert new sheet(s)" (or "Replace
   spreadsheet" if you're starting fresh). Google Sheets should preserve the hidden
   tabs; `setupTabVisibility()` below double-checks this.
2. **Open the bound Apps Script project.** In the Sheet: Extensions → Apps Script.
3. **Create each file listed below** (File → New → Script file, name it exactly,
   including the number prefix) and paste in the matching content from this folder:
   - `00_Config.gs`
   - `01_Menu.gs`
   - `02_Utilities.gs`
   - `05_ApiKeys.gs`
   - `10_Stubs.gs`
   - `20_MasterUpdate.gs`
   - `90_ErrorHandling.gs`
   - `91_Triggers.gs`
   - `92_Setup.gs`
   - `99_Phase1_Tests.gs`
   (Apps Script doesn't care about file order the way the numbers imply — the
   numbers just keep the list readable, matching the spec's own convention.)
4. **Save the project** (the disk icon or Ctrl/Cmd+S). Reload the Google Sheet tab
   in your browser so `onOpen()` fires and the **NFL MODEL** menu appears.
5. The first time you click any menu item, Google will ask you to **authorize** the
   script (it needs permission to edit the sheet and make external requests later).
   Review and accept.
6. From the Apps Script editor, select `setupTabVisibility` in the function dropdown
   and click **Run** once, to confirm/enforce tab visibility.
7. **Phase 0 accounts (you do this part):**
   - nflverse data needs no account — it's public.
   - Register for **The Odds API** (the-odds-api.com) and copy your key.
   - Register for **SportsDataIO** (sportsdata.io) — or another injury/depth-chart
     provider if you prefer — and copy your key.
   - Open `05_ApiKeys.gs` in the Apps Script editor, paste your real keys into the
     `keys` object, run `setApiKeys()` once, then **delete the real key values**
     from the file (leave the quotes empty) and save again. The keys now live in
     PropertiesService, not in visible code.
   - Run `testApiKeys()`. Check the execution log (View → Executions) and the
     `93_API_STATUS` tab for OK/ERROR per provider.

## Testing Phase 1's exit criteria

Once the above is done, run the automated suite:

- From the Sheet: **NFL MODEL → Run Phase 1 Exit Tests**, or
- From the Apps Script editor: select `runPhase1ExitTests`, click Run.

It checks the five things Phase 1 needs to be "done":

1. Every menu-wired function runs without an uncaught error.
2. A deliberate test error gets caught and correctly logged to `94_ERROR_LOG`.
3. The update lock actually blocks a second simultaneous run.
4. Only the 7 default tabs are visible; everything else is hidden.
5. `91_TEAM_MAP` has all 32 teams with no blank codes.

You'll get a pop-up summary (PASS/FAIL per check) and the same detail in the
execution log. **Paste that summary back to me** — if anything fails, send me the
FAIL line(s) and I'll fix the corresponding script before we move to Phase 2.

Also worth clicking through manually once: **NFL MODEL → Update Everything** should
run to completion and end with a toast saying "Ready" (steps report as not-yet-
implemented — that's correct at this stage) rather than a raw script error dialog.

## Manually verifying the update lock (real cross-execution blocking)

`test3` in the automated suite can only confirm the lock acquires and releases
cleanly — `LockService` blocks *other* concurrent executions, not a second call
from within the same one, so a single test function can't fake real concurrency.
To see the actual blocking behavior:

1. Open the Sheet in two browser tabs (same account is fine).
2. In Tab A's Apps Script editor, open `20_MasterUpdate.gs`, select `updateAllData`
   in the function dropdown, and click **Run** — but don't wait for it to finish.
3. Immediately switch to Tab B and click **NFL MODEL → Update Everything** from the
   Sheet's menu.
4. Tab B should show a toast reading **"UPDATE ALREADY IN PROGRESS — try again in a
   moment."** instead of running — that's the lock doing its job. (Since Phase 1's
   steps are instant stubs, Tab A's run finishes in well under a second, so you may
   need to try steps 2–3 quickly, or temporarily add `Utilities.sleep(5000)` inside
   one stub function to give yourself a bigger window — remove it afterward.)

---

## Phase 2 — Core NFL Data Pipeline

Phase 2 adds real external data: schedule, team stats, and player stats from
nflverse (public, no account needed). Five new files, one changed file, and one
removed pair of stubs.

### New/changed files

Add these to the Apps Script project the same way as Phase 1 (File → New →
Script file, exact name, paste content):

- `13_Phase2Setup.gs`
- `15_NflverseClient.gs`
- `16_ImportSchedule.gs`
- `17_ImportTeamStats.gs`
- `18_ImportPlayerStats.gs`
- `19_DataValidation.gs`
- `99_Phase2_Tests.gs`

Then **replace the full contents** of these two existing files with the updated
versions in this zip (both changed for Phase 2):

- `00_Config.gs` — added RAW_*_HEADERS constants
- `01_Menu.gs` — "Update NFL Stats" now calls `updateNflStats` (schedule + team
  stats together); added a "Run Phase 2 Exit Tests" menu item
- `10_Stubs.gs` — removed `updateSchedule`/`updateTeamStats`/`updatePlayerStats`
  stubs (they're real now, defined in the new files above) — **important**: if
  you don't replace this file, you'll have two definitions of those functions
  floating around, and it becomes luck-of-load-order which one wins.

### One-time setup (run each once from the Apps Script editor)

1. `setDefaultBackfillSeasons` — sets `BACKFILL_SEASONS` to `2023,2024,2025` in
   `90_CONFIG`. Deliberately narrow at first — prove the pipeline works before
   widening toward the spec's suggested 2018+ backfill. To widen later, either
   edit the `90_CONFIG` sheet directly or re-run a copy of this function with a
   longer list.
2. `patchAddSeasonToPlayerStats` — **required**. The Master Spec's own field
   list for `12_RAW_PLAYER_STATS` is missing a `season` column, which breaks
   multi-season backfill (a player's Week 1 in 2023 and Week 1 in 2024 become
   indistinguishable without it). This inserts it as the 5th column. Safe to
   run on the empty Phase-1 tab; if you'd already put other data in that tab,
   back it up first.

### Running it

- **NFL MODEL → Update NFL Stats** runs schedule + team stats.
- **NFL MODEL → Update Player Stats** runs player stats.
- Or run `updateSchedule`, `updateTeamStats`, `updatePlayerStats` individually
  from the Apps Script editor while you're checking things over.

### Testing Phase 2's exit criteria

**NFL MODEL → Run Phase 2 Exit Tests** (or `runPhase2ExitTests` from the
editor). This actually calls the real importers — it's a live network smoke
test, not a mock — so it takes longer than Phase 1's and needs both setup
steps above done first. It checks:

1. Schedule import lands a sane row count (no duplicate `game_id`, no blank
   key fields).
2. Re-running the schedule import doesn't duplicate rows.
3. Team stats import lands rows with no duplicate team/season/week.
4. Player stats import lands rows with no duplicate player_id/season/week.
5. `93_API_STATUS` shows an entry for all three.

**Paste me the PASS/FAIL summary.** A likely failure mode: team stats and/or
player stats coming back with `rows=0`. That means nflverse's real filenames
for those seasons didn't match any of the guessed patterns in
`17_ImportTeamStats.gs` / `18_ImportPlayerStats.gs` — nflverse has reorganized
this release's file naming before, and I didn't have a confirmed-current
filename to hardcode against, so those two importers *discover* the file by
pattern instead of assuming one. If that happens:

1. From the Apps Script editor, run `logAvailableNflverseAssets('stats_team')`
   (or `'stats_player'`).
2. Check View → Executions (or the Logger output) for the printed list of real
   filenames.
3. Paste that list back to me and I'll lock in the exact pattern/column names
   instead of the current best-guess fallbacks.

This is expected troubleshooting, not a sign anything is broken — it's exactly
why the timeline's Phase 2 testing gate exists.

---

## Phase 3 — Odds Data Pipeline

Phase 3 adds live betting odds from The Odds API (the account you already set
up and confirmed with `testApiKeys`). Six new files, two changed files.

### New files

Add these the same way as before (File → New → Script file, exact name, paste content):

- `21_OddsMath.gs`
- `23_ImportOdds.gs`
- `24_PlayerPropOdds.gs`
- `99_Phase3_Tests.gs`

### Changed files

Replace the full contents of these two:

- `01_Menu.gs` — added "Update Player Prop Odds" and "Run Phase 3 Exit Tests" menu items
- `10_Stubs.gs` — removed the old `updateOdds`/`archiveOddsSnapshot` stubs (they're real now)

### What each piece does

- **`updateOdds()`** — pulls current moneyline/spread/total odds from every US
  bookmaker for NFL in one bulk call, writes one row per outcome into
  `16_RAW_ODDS`. Cheap on your quota (3 markets × 1 region = 3 credits).
- **`archiveOddsSnapshot()`** — copies whatever's currently in `16_RAW_ODDS`
  into `17_RAW_ODDS_HISTORY`, tagged with a timestamp. Never overwrites —
  this is what makes closing-line-value tracking possible later (Phase 10).
- **`updatePlayerPropOdds()`** — pulls anytime-TD/rush/rec/pass prop odds for
  a small number of upcoming games (`MAX_PROP_EVENTS`, default 3) — this one
  actually costs meaningful quota per run (6 markets × up to 3 events), so
  it's a separate menu item, not part of `updateOdds()`.
- **`rebuildPlayerMapFromStats()`** — populates `92_PLAYER_MAP` from your
  latest season of player stats. Run this once before the first prop-odds
  pull, and again any time you refresh player stats for a new season.
- **Odds math** (`21_OddsMath.gs`) — American odds ↔ probability, no-vig
  calculations. Every model from Phase 4 onward depends on these being exactly right.

### One-time setup

Run **`rebuildPlayerMapFromStats`** once from the Apps Script editor before
your first player-prop test (needs `12_RAW_PLAYER_STATS` populated already,
which it is from Phase 2).

### Testing Phase 3's exit criteria

**NFL MODEL → Run Phase 3 Exit Tests** (or `runPhase3ExitTests` from the
editor). This one costs real Odds API quota (it calls `updateOdds()` and
`updatePlayerPropOdds()` for real), so don't run it repeatedly back to back.
It checks:

1. The odds-math utilities exactly match the spec's own worked examples.
2. Game odds import lands real rows.
3. Odds history actually accumulates a new snapshot without overwriting.
4. Player-name mapping match rate (an audit, not a hard pass/fail below 70%).
5. Stale-odds detection correctly reports "fresh" right after a live update.

**Paste me the summary.** A likely rough edge: some player names not
matching (test 4's detail line lists any unmatched names) — that's expected
to need a little tuning once we see real names that didn't match (nicknames,
suffixes, etc.), not a sign of a deeper bug.

### Quick add: keeping PLAYER_MAP's team column current

`RAW_PLAYER_STATS` only has data through the last completed season, so
anyone who signed or was traded this offseason will show their *old* team in
`92_PLAYER_MAP` (stats for unplayed games can't exist yet). `25_RosterRefresh.gs`
fixes just that one column using nflverse's separate, always-current roster
data. Add that file, then run **`refreshPlayerMapTeams`** once (also
available from the menu as "Refresh Player Map Teams"). It's safe to re-run
any time rosters change — it only touches the `team` column, nothing else.

---

## Phase 4 — Basic Team Models (Power Rating, Recent Form, Elo, Matchup)

Four independent team-strength models, all leak-free (each uses only data through the PRIOR week).

### New files

- `20_TeamFeatures.gs` — **read the naming note at the top of this file first.** Despite the name, this populates `11_RAW_TEAM_STATS`'s advanced columns (EPA, success rate, explosiveness, etc.), not the `20_TEAM_FEATURES` tab — that tab is unused. Explained in full in the file's own header comment.
- `26_TeamMapFixes.gs` — one-off fix for a Rams team-code mismatch (`LAR` vs `LA`) found during testing. Run `fixRamsTeamCode` once if you haven't already.
- `30_Power.gs` — Power Rating. Z-scored composite, cross-season carryover for Week 1.
- `31_RecentForm.gs` — decay-weighted recent performance vs. season baseline.
- `32_Elo.gs` — Elo with home-field advantage, margin-of-victory scaling, season-carryover regression.
- `33_Matchup.gs` — offense-vs-opponent-defense comparison per scheduled game. Same unused-tab naming note as `20_TeamFeatures.gs` (`22_MATCHUP_FEATURES`).

### Running it

Order matters — each depends on `11_RAW_TEAM_STATS` being current, and Matchup depends on nothing else in this phase:

1. `updateTeamStats` (in `20_TeamFeatures.gs`) — re-run this whenever you want fresh advanced team stats; it re-aggregates from full play-by-play, so it takes a couple minutes.
2. `updatePowerRatings`
3. `updateRecentForm`
4. `updateMatchupModel`

### Known limitation

Power Rating's Week 1 carryover fix only applies when a team's *entire season* has zero games — mid-season gaps aren't a real scenario so this hasn't been an issue, but worth knowing the logic assumes "either zero games this season, or use this season's own data," not a smooth blend across the transition.

---

## Phase 5 — Game-Level Forecasting (Regression, Logistic, Monte Carlo, Market Model, Ensemble, Fair Odds)

This is where the four Phase 4 models actually get combined into a single prediction, priced against the market.

### New files

- `34_Regression.gs` — real fitted OLS (not spec-example weights) predicting margin from the four Phase 4 components.
- `35_Logistic.gs` — independently-fitted win probability via IRLS (own implementation, no external library).
- `38_MonteCarlo.gs` — simulates outcome distributions around Regression's projection; includes a closed-form cross-check.
- `39_MarketModel.gs` — de-vigged, sharp-weighted consensus across every sportsbook currently imported (now including Pinnacle via the `eu` region). **Comparison signal only** — not blended into the fitted prediction, since no historical odds data exists yet to responsibly fit that blend (see Known Gaps below).
- `40_Ensemble.gs` — combines everything into `model_margin`; uses fitted Regression coefficients once available, falls back to spec weights before that.
- `42_FairOdds.gs` — blends Monte Carlo + Logistic into a final probability, applies sample-size shrinkage (toward market/50-50 when a team has few real current-season games) and Platt-scaling calibration, then computes real Fair Odds/Edge/EV against the best available live price.

### Running it (in order — each step depends on the one before it)

1. `updateEnsembles`
2. `updateRegression` (needs completed games in Ensemble output to fit on)
3. `updateEnsembles` again (now uses the freshly-fitted Regression coefficients instead of spec weights)
4. `updateLogistic`
5. `updateMonteCarlo`
6. `updateOdds` (if odds aren't current)
7. `updateMarketModel`
8. `updateProbabilityCalibration`
9. `updateFairOdds`

### Sportsbook whitelist — flagged, not yet built

`03_BET_FINDER`'s "best price" currently picks the single highest-paying book among all ~27 imported, which is sometimes a betting exchange (Betfair, Matchbook) the user may not actually have access to. The fix — a `BETTABLE_BOOKS` config list restricting which books count for "best actionable price" while keeping all 27 for market-consensus math — is designed but not yet implemented.

---

## Phase 6 — Sheets UI Layer (Bet Finder, Home, Settings, Bet Analyzer, Today's Games, Model Performance)

The first "cockpit" layer, entirely inside the Sheet, deliberately built to mirror what the eventual website should show.

### New files

- `03_BetFinder.gs` — ranked, filterable table of every bettable side (moneyline only for now), with a documented confidence rubric (sample size + model agreement + market data presence — NOT the same thing as win probability).
- `00_Home.gs` — dashboard: current week, Bet Finder summary stats, latest backtest performance, data health.
- `01_Settings.gs` — curated, documented view of every adjustable config parameter.
- `02_BetAnalyzer.gs` — deep-dive explainer for one game at a time (enter a team code — either side works — into input cells).
- `04_TodaysGames.gs` — one row per game (not per side) for the current/upcoming week, auto-detected.
- `06_ModelPerformance.gs` — readable view of the backtest/calibration results.

### Running it

Each of these reads from the Phase 5 outputs, so run those first. Then, in any order:

1. `updateBetFinder`
2. `updateTodaysGames`
3. `updateHome`
4. `updateSettings`
5. `setupBetAnalyzer` (one-time), then fill in the input cells and run `updateBetAnalyzer`
6. `updateModelPerformance` (needs `runBacktest` from the backtesting section below to have run at least once)

---

## Backtesting & Calibration

Genuine out-of-sample validation — fits on 2023+2024, evaluates purely on 2025 (never touched during fitting). This is stricter than any in-sample metric quoted elsewhere in this project.

### New files

- `50_Backtest.gs` — the backtest engine itself, plus a from-scratch, verified implementation of isotonic regression (Pool Adjacent Violators algorithm) tested head-to-head against Platt scaling on the same held-out data.

### Running it

1. `runBacktest` — writes to `50_BACKTEST` (append — keeps history across runs) and `51_CALIBRATION` (overwritten each run).
2. `debugBacktestResults` / `debugCalibrationBuckets` to inspect.

**Current result (as of this session): Platt scaling beats isotonic regression out-of-sample** (0.2216 vs. 0.2250 Brier score) — isotonic's extra flexibility appears to have overfit the smaller training set. `CALIBRATION_METHOD` in `90_CONFIG` should stay `platt` unless a future re-run with more data shows otherwise. **Don't switch without re-checking `runBacktest` first.**

### 52_CLV_ANALYSIS — genuinely blocked

Needs historical *closing* line data; `17_RAW_ODDS_HISTORY` only has live snapshots starting from when this project began collecting them (no 2025 coverage). This isn't a bug — there's no way to backfill true historical closing lines without a paid historical odds provider. It becomes buildable once enough weeks of real snapshot history accumulate going forward.

---

## Phase 7 — Player Props (in progress)

### New files

- `21_PlayerFeatures.gs` — red-zone/goal-line usage per player-week (carries, targets, and touchdowns split by red-zone/inside-10/inside-5), aggregated directly from play-by-play. This is the real fix for a data gap flagged back in Phase 2/3: nflverse's standard player-stats file simply doesn't have these fields at all — they only exist computed from PBP, same situation team-level EPA was in.

### Status

**Anytime TD model is designed but not yet shipped** — the build was interrupted mid-session. The intended approach (documented for whoever picks this back up): cumulative, current-season-only (no cross-season carryover for players — their roles change too much year to year) red-zone/goal-line opportunity as predictors, fit via the same logistic IRLS already built for the game model, validated on the same train/test split as the game-level backtest.

**Naming caution for next time:** `37_BAYESIAN` is already a reserved tab number in the original spec — don't accidentally reuse `37_` for a new player model file.

---

## Website Output Contract Layer

### New files

- `60_Output.gs` — stable, versioned tables specifically for the website to read, instead of the website reading internal working tabs (like `03_BET_FINDER`) directly. Per the Master Brief: "Create dedicated output tables... do not expose every raw tab directly." These are NOT new calculations — every value is a thin, reshaped copy of something already computed and validated elsewhere.

Produces: `60_OUTPUT_GAMES`, `61_OUTPUT_BETS`, `62_OUTPUT_MODEL_BREAKDOWN`, `63_OUTPUT_EXPLANATIONS`, `64_OUTPUT_PERFORMANCE`, `65_OUTPUT_PARLAY_INPUTS` (intentionally empty shell — no Parlay Builder exists yet).

**The website should point at these tabs going forward, not at `03_BET_FINDER` directly** — this is the insulation layer that lets internal tabs keep evolving without breaking whatever's built on the website side.

### Running it

`updateAllOutputs` — runs every output table in the correct order in one call. Requires the full upstream pipeline (Phase 4 through Bet Finder) to already be current; this layer only reshapes what already exists, it doesn't compute anything new.

Note: `getSheet()` was changed during this cleanup pass to auto-create a missing tab instead of throwing an error — this is what lets brand-new tabs like the `OUTPUT_*` ones get created automatically on first use, rather than needing manual creation in the Sheet UI first.

---

## MASTER PIPELINE ORDER

The single most useful thing missing from this README before this cleanup pass. Full correct sequence, start to finish, for a completely fresh run:

```
1.  updateSchedule, updateNflStats           (Phase 2 — raw data)
2.  updateTeamStats                          (20_TeamFeatures.gs — advanced stats from PBP)
3.  updatePowerRatings
4.  updateRecentForm
5.  updateMatchupModel
6.  updateEnsembles                          (first pass — uses spec weights)
7.  updateRegression                         (fits real coefficients from Ensemble output)
8.  updateEnsembles                          (second pass — now uses fitted coefficients)
9.  updateLogistic
10. updateMonteCarlo
11. updateOdds                               (if odds aren't current)
12. updateMarketModel
13. updateProbabilityCalibration
14. updateFairOdds
15. updateBetFinder
16. updateTodaysGames / updateHome / updateSettings / updateModelPerformance
17. runBacktest                              (whenever you want a fresh out-of-sample check)
18. updateAllOutputs                         (website contract layer — last, once everything above is current)
```

Steps 6-8 look redundant but aren't: Ensemble has to run once before Regression has anything to fit on, then again afterward so its own output actually reflects the fitted coefficients instead of the cold-start spec weights.

---

## Known Gaps / Honest Status (as of this cleanup pass)

- `13_RAW_PBP`, `14_RAW_INJURIES`, `15_RAW_DEPTH_CHARTS`, `18_RAW_WEATHER` — never populated. PBP is deliberately never stored (fetched and streamed fresh each time for memory reasons); the other three are genuinely Phase 9, not started.
- `20_TEAM_FEATURES`, `22_MATCHUP_FEATURES` — unused tabs, explained in the relevant files' own header comments.
- `36_POISSON`, `37_BAYESIAN` — spec'd model families, never built this project.
- `53_MODEL_WEIGHTS` — spec'd, never built as its own tab (the closest equivalent is the fitted coefficients stored alongside each `50_BACKTEST` run).
- `41_ENSEMBLE_PLAYER` — empty; the Anytime TD model that would populate it is designed but not shipped (see Phase 7 section above).
- `05_BET_LOG` — correctly unbuilt; no live tracked bets exist yet.
