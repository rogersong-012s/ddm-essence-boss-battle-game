# DDM Essence Merge — Melanin Boss Battle

純 HTML、CSS、JavaScript 的 16:9 瀏覽器遊戲。遊戲保留西瓜合成與 Matter.js 物理基底：球體代表 DDM 精華，左側的黑色素暴君是 Boss。玩家合成精華累積能量，再由左下方的 DDM 守衛向 Boss 發射流星能量彈。無需建置流程，可直接開啟 `index.html`，也可部署到 GitHub Pages。Matter.js 0.20.0 與 Google Fonts 使用 CDN，首次遊玩需網路連線。

## 本機遊玩

直接開啟 `index.html`，或在本目錄執行：

```sh
python -m http.server 8000 --bind 127.0.0.1
```

接著瀏覽 `http://127.0.0.1:8000/`。

## 操作與戰鬥流程

- 移動游標選擇中央容器內的位置，點擊或觸控放下 NEXT 顯示的 DDM 精華。只有在容器內按下並於容器內放開才會掉球。
- 兩顆同級精華自動合成並逐階升級，直到目前設定的 MAX 等級。
- 每次玩家成功放下一顆新球，玩家角色會發出一顆流星，命中後透過共用 combat pipeline 造成 10 點傷害；Continue 後同一數值會加到 WHITE SCORE。合成傷害沿用 `SCORE_TABLE`：Lv 1 合成 5、Lv 2 合成 10、Lv 3 合成 20，後續等級依表遞增。MAX 合成傷害保留原有額外獎勵值。
- 每次合成後，玩家角色會從法杖位置發出帶弧度的流星光彈。光彈抵達 Boss 後才扣除等同該次合成分數的 HP；合成點只保留球體生成與輕量粒子回饋。
- Boss 初始生命值為 8,000。首次擊敗後可選擇繼續遊玩；Continue 會切換為從 0 開始、沒有上限的 WHITE SCORE 累積模式，勝利後續戰失敗會顯示最終累積值。DDM 與 SSW+1 初始各 2 次、上限各 3 次。只有正常合成達到 MAX 才會在 MAX 球消失後隨機補充一種技能 1 次；已滿的技能不會被抽中，兩者都滿時不補充。SSW+1 升到 MAX 不給獎勵。
- 點擊右側「直接使用DDM」，再選取容器中的非 MAX 精華即可讓玩家發射流星攻擊，傷害為該等級標準傷害的 25%；Boss 戰中命中後扣 HP，WHITE SCORE 模式中命中後加到累積值。
- 點擊右側「使用SSW+1」，再選取非 MAX 精華即可直接升級一階，並保留球的當下位置、速度與角速度；SSW+1 本身不造成 Damage 或增加 WHITE SCORE。若升級抵達 MAX，MAX 球會短暫展示後消失，但不補充技能、不造成傷害，也不觸發合成攻擊。最高等級精華會顯示 MAX 且不可選取，不會消耗次數。
- DDM 與 SSW+1 使用互斥的選取模式；切換技能會取消前一個模式，選取中不能放球，按鈕或提示列的 × 可取消選取。
- DDM 精華越過危險線並持續 2 秒會結束遊戲；重新開始會重置本局。

## 主要設定

`js/config.js` 集中遊戲尺寸、球體尺寸比例、合成傷害、Boss 生命值、技能次數、放球傷害、重力與物理步進設定：

| 設定 | 數值 |
| --- | ---: |
| 邏輯畫面 | 1600 × 900 |
| 中央遊戲區 | 460 × 630；頂端 GAME_TOP = 156 |
| 危險線 | `PLAYFIELD_BOTTOM - SECOND_HIGHEST_LEVEL 直徑 × 2.2`；越線持續 2 秒結束 |
| Boss 初始生命值 | 8,000 |
| DDM 與 SSW+1 各自初始／上限 | 2／3 |
| 玩家每次成功放球傷害 | 10 |
| 直接使用DDM 傷害倍率 | 標準等級傷害 × 25% |
| 正常 MAX 合成技能補充 | 從尚未滿次數的技能中隨機補一種 +1；兩者皆滿則不補，SSW+1 升到 MAX 不給獎勵 |
| DDM 淡化時間 | 420 ms |
| 物理更新 | 固定 60 Hz |
| DDM 精華直徑 Lv 1–9 | 36、52、72、96、124、158、198、244、298 px |

`REFERENCE_WIDTH = 1600`、`REFERENCE_HEIGHT = 900` 是設計基準。`LAYOUT` 以此參考框定義 playfield、出生點、容器邊界與球徑。Matter.js 碰撞、球體繪製、容器操作都沿用既有座標系與合成流程。

`SCORE_TABLE` 是合成分數與戰鬥數值的共用來源；`calculateMergeDamage()` 沿用其結果與 MAX 完成加成，DDM 技能也透過同一張表套用 `SKILL_CONFIG.directDdmDamageMultiplier`。`applyCombatValue()` 依戰鬥模式將命中值導向 Boss HP 或 WHITE SCORE。`MAX_LEVEL` 由球體等級資料計算，`SECOND_HIGHEST_LEVEL` 定義為 `MAX_LEVEL - 1`，危險線依該等級的實際球徑計算。SSW+1 一般只替換 Matter.js 球體並保留位置、速度與角速度；升到 MAX 時共用 MAX 球生成／消失流程，但只有正常合成會呼叫 MAX 合成獎勵，不會呼叫攻擊管線。技能次數上限、初始值與隨機 MAX 獎勵政策集中管理。

攻擊光彈飛行維持 460 ms，命中殘留縮短為 360 ms，命中反應為 270 ms；各時間設定集中於 `BOSS_CONFIG`。

## JavaScript 結構

所有檔案以傳統 `<script defer>` 載入，不使用 ES Modules，確保遊戲仍可直接以 `file://.../index.html` 開啟。

- `game.js`：Matter.js 世界、輸入、掉球、合成、技能操作、結算狀態與各子系統協調。
- `js/config.js`：共用尺寸與玩法常數。
- `js/themes.js`：球體主題資料與色票。
- `js/skills.js`：MAX 隨機技能獎勵的可用技能與抽選規則。
- `js/combat.js`：Boss HP、戰鬥模式、WHITE SCORE 與統一 combat value 管線。
- `js/effects.js`：玩家流星攻擊、命中動畫及動畫物件清理。
- `js/renderer.js`：Canvas 球體、容器、粒子與預覽繪製。

玩家法杖發射點與 Boss SVG 中心都以實際 DOM 邊界定位，再轉換到共用的 1600 × 900 SVG 座標。投射物沿二次曲線飛行，包含發光核心、漸細拖尾、命中閃光與數值；有限時清理，不會累積在畫面中。Boss 與玩家的 X 軸由遊戲框左緣及容器左緣的實際 DOM 邊界計算，Boss 對齊 NEXT 上緣、玩家名稱底部對齊 SSW+1 卡片底部。玩家角色與 Boss 都在容器外，不參與 Matter.js 碰撞，也不攔截滑鼠或觸控。

## 精華色系

右下角「精華色系」切換器可在暖色與繽紛彩色之間切換；新載入遊戲預設使用繽紛彩色。切換只改變 DDM 精華外觀，不會重置 Boss HP、DDM、NEXT 或本局進度，重開本局也會保留目前選擇。兩套等級主題共用於場上精華與 NEXT 預覽。

暖色主題：Lv1 `#FCEEE8`、Lv2 `#F9E1D7`、Lv3 `#F6D1C2`、Lv4 `#F2C0AF`、Lv5 `#EEAE9B`、Lv6 `#E99988`、Lv7 `#E28379`、Lv8 `#D96E69`、Lv9 `#CC5C5D`。

繽紛彩色主題：Lv1 `#EF89AB`、Lv2 `#F18477`、Lv3 `#F3A15F`、Lv4 `#E7C45D`、Lv5 `#94C56E`、Lv6 `#67BBC5`、Lv7 `#7298D9`、Lv8 `#8D82D1`、Lv9 `#B174C2`。

## 開發快捷鍵

`DEBUG` 預設為 `true`：按數字鍵放入對應等級的 DDM 精華（MAX 等級除外）、`D` 各補充一次 DDM 與 SSW+1 次數（不超過各自上限）、`G` 直接測試 Game Over 結算、`R` 重新開始。快捷鍵保留給內部測試，不顯示在遊戲畫面；發布正式版本時可將 `DEBUG` 設為 `false`。

## Responsive 與物理

`.game-wrapper` 以 `aspect-ratio: 16 / 9` 等比例縮放與置中；非 16:9 視窗保留完整遊戲框。ResizeObserver 會更新 UI scale 和 Canvas backing store，不重建 Matter 世界，因此視窗縮放不會重置 Boss HP、球、DDM、主題或本局進度。容器外誤觸保護、球掉落、碰撞、合成、NEXT、危險線與 Game Over 沿用原系統。
