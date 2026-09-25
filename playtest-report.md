# Playtest Report (in progress)

Black-box playtest notes. No game files or settings have been changed. Test actions so far have used the visible game UI in the user-provided `http://localhost:8000/` tab.

## Environment and method

- Game tab: `DDM Essence Merge — Melanin Boss Battle` at `localhost:8000`.
- Learning games L1–L4 were played before setting a viewport override; the available screenshot was 814 × 741, with the game scaled inside it. For L5 and the formal phase, the browser viewport was set to the requested 1600 × 900.
- Inputs are ordinary visible clicks, paced about 2–3 seconds apart to observe settling and attacks. No debug controls, console, game functions, or state edits used.
- User-requested phases: 5 learning games, then at least 20 formal games. All 5 learning games are complete; 20 formal games remain.

## Learning phase (in progress)

### Game L1 — completed (learning)

- Boss: not defeated. At Game Over the visible UI showed **5,275 / 8,000 HP remaining**.
- Continue: no. WHITE SCORE: not reached.
- Highest level shown at Game Over: **Lv6**. Player level stayed **DDM Guard +0**; no MAX merge, level-up, or skill refill observed.
- Skills: DDM used once on a visible Lv2 ball; UI showed `−5 HP` and the ball disappeared. SSW+1 used once on a visible Lv1 ball; UI showed `Lv 1 → Lv 2` and no damage notice. Both skill counters reached 0 and stayed there.
- Game Over followed a crowded board with multiple Lv5/Lv6 balls and smaller balls stacked around the danger line. The line turned red; a chain briefly cleared space, then Game Over appeared on the next placement. Main pressure: the stack occupied most of the width and balls reached the line before Boss HP was low.
- Rough play time: about 10–15 minutes (estimated from the interaction session; no in-game timer was visible).
- Subjective difficulty: **7/10**. Early game was forgiving; late board pressure rose quickly. The visible combo sometimes dealt a noticeable chunk of damage, but Boss HP remained high at death.

### Game L2 — completed (learning)

- Boss: not defeated. At Game Over the visible UI showed **4,805 / 8,000 HP remaining**.
- Continue: no. WHITE SCORE: not reached.
- Highest level shown at Game Over: **Lv7**. Player level stayed **DDM Guard +0**; no MAX merge, level-up, or skill refill observed.
- Skills: DDM was used on a visible Lv4 ball; the UI showed `−10 HP`. SSW+1 changed a visible Lv4 to Lv5 without a damage notice. Both skill counters reached 0 and stayed there.
- Careful drops and repeated aiming into same-level clusters produced two Lv6 and two Lv7 balls. A later Lv3 chain displayed `COMBO ×5` and about 320 damage, but overall Boss HP was still above 60% when the stack reached the danger area and Game Over appeared. Smaller balls accumulated around the large spheres and narrowed the remaining drop space.
- No clear technical error observed. The number of clicks needed and the late-board crowding may make the run feel long for a first-time player; play time was not timed.
- Subjective difficulty: **7/10**. Higher merges made progress feel rewarding, but did not offset the remaining Boss HP before the board filled.

### Game L3 — completed (learning)

- Boss: not defeated. At Game Over the visible UI showed **3,775 / 8,000 HP remaining**.
- Continue: no. WHITE SCORE: not reached.
- Highest level shown at Game Over: **Lv8**. Player level stayed **DDM Guard +0**; no MAX merge, level-up, or skill refill observed.
- Skills: DDM on a visible Lv3 showed `−5 HP` and removed it. SSW+1 showed `Lv 2 → Lv 3` and no damage notice. Both counters reached 0.
- I began with loose placement, then aimed repeated pieces at visible same-level clusters. This produced two Lv6 and later Lv7/Lv8, with several combos and some large HP drops. Even with the most deliberate play so far, Game Over arrived with nearly half the Boss HP remaining. The late pile had two Lv8 and several Lv5–Lv7 spheres, narrowing the usable area.
- Subjective difficulty: **7/10**. Merges are satisfying and visible, but skill use feels limited to one early use each, and the board can still end the run well before the Boss is defeated.

### Game L4 — completed (learning)

- Boss: not defeated. At Game Over the visible UI showed **3,962.5 / 8,000 HP remaining**.
- Continue: no. WHITE SCORE: not reached. Highest level: **Lv8**. Player level stayed **DDM Guard +0**; no MAX refill or level-up observed.
- Skills were spent early and stayed at 0. SSW+1 upgraded Lv1 → Lv2 with no damage notice. DDM on Lv2 showed `−2.5 HP`; the ball disappeared. This felt weak compared with spending a drop to merge.
- I switched from vibrant to warm colors and back during this run. The warm palette looked very pale and made balls/level labels hard to distinguish at this viewport scale; the vibrant palette was easier to parse. This is a visual observation at the available scaled viewport, not at 1600 × 900.
- The run reached Lv8 and had one `COMBO ×3` burst dealing about 300 HP, but several small balls remained wedged around larger balls. The danger line turned red with Boss HP still near half; the next drop triggered Game Over. Most recent pre-loss Boss value remained 3,962.5, indicating that final placement did not reduce HP.
- Play time: not precisely timed; no in-game timer was visible. Subjective difficulty: **7/10**. A large combo felt rewarding, but the pressure from small balls and one-use skills remained.

### Game L5 — completed (learning)

- Boss: not defeated. At Game Over the visible UI showed **3,785 / 8,000 HP remaining**.
- Continue: no. WHITE SCORE: not reached. Highest level: **Lv8**. Player level stayed **DDM Guard +0**.
- SSW+1 upgraded Lv3 → Lv4 with no damage notice. DDM on Lv6 showed `−40 HP` and removed that sphere. Both skills reached 0; no MAX refill or player upgrade occurred.
- The run generated a `COMBO ×5` burst while Boss HP fell from 5,175 to 4,545, a visible 630-point drop. Other chains also built Lv5, Lv6, Lv7, and Lv8 while the board remained manageable for a long stretch. Later small and mid-level balls accumulated along the left side; the danger line was eventually crossed and Game Over appeared with the Boss still at 3,785.
- Play time: not precisely timed; no in-game timer was visible. Subjective difficulty: **7/10**. Deliberate same-level placement made the long chains satisfying, but the Boss still had nearly half its health when the left-side pile ended the run.

## Formal results

Formal target: at least 20 games (current tally: 5/20; 15 remain). The first five formal runs are assigned to the beginner group, followed by 10 regular and five skilled-player runs.

### Game G1 — beginner — completed

- Start: 2026-09-25 04:16:36 UTC; ended at about 04:41 UTC (roughly 25 minutes).
- Boss: not defeated. Game Over showed **3,820 / 8,000 HP remaining**. The modal read “好可惜，再挑戰一次吧！” and said the Boss was not defeated.
- Continue: no. WHITE SCORE: not reached. Highest level: **Lv8**. Player level stayed **DDM守衛 +0**.
- Skills: DDM on Lv3 showed `−5 HP`; SSW+1 changed Lv1 → Lv2 without a damage notice. Both counters were spent; no MAX skill refill or player upgrade was seen.
- I began with less deliberate placements, then targeted visible same-level groups (including repeated Lv1/Lv2 drops to the left side). A `COMBO ×3` and several larger merges appeared; one observed chain lowered Boss HP from 4,035 to 3,885. HP was still 3,820 when the danger line flashed red and the next placement triggered Game Over. The pile had climbed above the line at the left edge, while large Lv6/Lv7/Lv8 spheres and many small balls occupied much of the board.
- No technical errors or frozen controls observed. The health, NEXT level, disabled skill counters, and terminal modal were visible. Difficulty: **7/10**; the game was readable at 1600 × 900, but the prolonged run and small per-drop damage made the Boss feel far away from defeat.

### Game G2 — beginner — completed

- Start: about 04:41 UTC; ended at about 04:59 UTC (roughly 18 minutes).
- Boss: not defeated. At Game Over the UI showed **about 3,730 / 8,000 HP remaining**. The modal said “好可惜，再挑戰一次吧！” and “黑色素暴君還沒被擊敗”.
- Continue: no. WHITE SCORE: not reached. Highest level: **Lv8**. Player level stayed **DDM守衛 +0**.
- Skills: DDM used once on Lv5 (`−20 HP`); SSW+1 upgraded Lv3 → Lv4. Both counters reached 0. No MAX skill refill or player upgrade occurred.
- I placed several balls without precision, then tried aiming at visible same-level groups as the danger area filled. Several chains produced `COMBO ×3` and reduced Boss HP in bursts (for example, about 4,010 → 3,880); the final stretch still had roughly half the Boss HP left. Once the red danger line was crossed by the crowded stack, further balls could still be placed for many turns; Game Over appeared on a later placement. The terminal screen showed highest level Lv8.
- No Continue, White Score, or victory flow was encountered. No visible input failure or freeze observed. Difficulty: **7/10**; matching can produce satisfying chain damage, but the large amount of play needed to clear the remaining HP kept the run under pressure.

### Game G3 — beginner — completed

- Start: about 05:00 UTC; ended at 05:15 UTC (roughly 15 minutes).
- Boss: not defeated. Game Over showed the Boss still had **4,930 / 8,000 HP**. The modal said “好可惜，再挑戰一次吧！” and showed highest level **Lv7**.
- Continue: no. WHITE SCORE: not reached. Player level stayed **DDM守衛 +0**.
- Skills: DDM on Lv4 showed `−10 HP`; SSW+1 changed Lv3 → Lv4 without a damage notice. Both skill counters reached 0; no refill was seen.
- I alternated loose drops with a few visible same-level targets. An early Lv1 collision produced a large HP drop (about 5,350 → 5,100); later Lv2/Lv3/Lv4 drops mostly dealt only a small amount, with one later merge sequence reducing HP about 50. Several Lv5–Lv7 spheres occupied the center and lower board while smaller balls accumulated around them. The danger line turned red and parts of the pile rose above it; Game Over arrived on a later placement, with the Boss still above 60% HP.
- No Continue, White Score, or victory flow was encountered. No visible input failure or freeze observed. Difficulty: **7/10**; a chain can make a conspicuous early difference, but maintaining clear space and damage output was difficult once larger spheres blocked lower matches.

### Game G4 — beginner — completed

- Start: about 05:16 UTC; ended at about 05:33 UTC (roughly 17 minutes).
- Boss: not defeated. The last readable active-play value was **4,665 / 8,000 HP** immediately before the losing placement; the Game Over modal blurred the health card. The modal said “好可惜，再挑戰一次吧！” and showed highest level **Lv7**.
- Continue: no. WHITE SCORE: not reached. Player level stayed **DDM守衛 +0**.
- Skills: SSW+1 changed Lv1 → Lv2; DDM on Lv3 showed `−5 HP`. Both counters reached 0; no MAX refill or player upgrade occurred.
- Deliberate same-lane placement produced a visible `COMBO ×4` and reduced Boss HP from about 5,220 to 4,910. This was the strongest burst in the run, but the board remained crowded with Lv6/Lv7 balls and small spheres between them. Balls stacked along the danger line; the final placement triggered Game Over.
- No Continue, White Score, or victory flow was encountered. The game remained responsive. Difficulty: **7/10**; matching the visible Lv4/Lv3 groups created a satisfying chain, while the stack quickly narrowed safe placement space and the Boss remained over half health.

### Game G5 — beginner — completed

- Start: about 05:33 UTC; ended at about 05:45 UTC (roughly 12 minutes).
- Boss: not defeated. The last readable active-play value was **5,610 / 8,000 HP** immediately before the losing placement; the Game Over modal blurred the health card. The modal showed highest level **Lv7** and said the Boss had not been defeated.
- Continue: no. WHITE SCORE: not reached. Player level stayed **DDM守衛 +0**.
- Skills: DDM used on Lv4 for `−10 HP` and removed that sphere. SSW+1 upgraded Lv4 → Lv5 with no damage. Both counters reached 0; no MAX refill or player upgrade occurred.
- Several planned same-lane matches produced long chains: `COMBO ×3` lowered HP by about 150, and later `COMBO ×4` lowered it by about 85. Another visible transition reduced HP from about 6,410 to 6,150. The board reached Lv7 and held two Lv6 spheres, but groups of small and mid-level balls filled the gaps and built a tall central/right pile; the next placement triggered Game Over.
- No Continue, White Score, or victory flow was encountered. The game remained responsive. Difficulty: **7/10**; repeated targeting created more chains than earlier runs, but the Boss still had most of its health when board space ran out.
