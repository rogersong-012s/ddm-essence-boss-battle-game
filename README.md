# Melanin Merge — DDM 淡化救援

純 HTML、CSS、JavaScript 的 16:9 瀏覽器小遊戲概念版。無需建置流程；可直接開啟 `index.html`，也可部署到 GitHub Pages。遊戲物理使用 Matter.js 0.20.0 CDN，Google Fonts 為選用字體，因此首次遊玩需要網路連線才能載入外部資源。

## 本機遊玩

直接開啟 `index.html`，或在本目錄執行：

```sh
python -m http.server 8000 --bind 127.0.0.1
```

接著瀏覽 `http://127.0.0.1:8000/`。此方式與 GitHub Pages 一樣使用原生靜態檔案，不需要 npm 或建置工具。

## 操作

- currentBall 會持續顯示預覽；必須在中央 playfield 內按下並在 playfield 內放開才會掉球。容器外點擊、從外滑入後放開、從內滑出後放開都不會掉球。
- 兩顆相同等級自動合成並加分：Lv 1 + Lv 1 → Lv 2，依序至 Lv 8 + Lv 8 → Lv 9。
- Lv 9 播放成功動畫後淡化消失，並補充 1 次 DDM；DDM 次數最多為 3。
- 點擊「DDM 救援」，再於 playfield 內選取場上 Lv 1–8 淡化移除。DDM 模式會優先處理目標選取，不會同時放球；Lv 9 不可使用 DDM，再次點擊按鈕或提示列的 × 可取消選取。
- 黑色素越過危險線並持續 2 秒會結束遊戲；按右上角重新開始可重置本局。

## 主要設定

`game.js` 開頭集中遊戲尺寸、等級、分數、重力與物理步進設定：

| 設定 | 數值 |
| --- | ---: |
| 邏輯畫面 | 1600 × 900 |
| 中央遊戲區 | 460 × 630（寬高比約 0.73）；頂端 GAME_TOP = 156 |
| 危險線 | `PLAYFIELD_BOTTOM - Lv8 直徑 × 2.05`；標準尺寸的可見容器底部為 810、Lv8 直徑為 244，故 `810 - 244 × 2.05 = 309.8`，越線持續 2 秒結束 |
| DDM 初始／上限 | 3／3 |
| DDM 淡化時間 | 420 ms |
| 物理更新 | 固定 60 Hz |
| 黑色素球直徑 Lv 1–9 | 36、52、72、96、124、158、198、244、298 px |

`REFERENCE_WIDTH = 1600`、`REFERENCE_HEIGHT = 900` 是正式設計基準。`getUIScale()` 以目前 16:9 game frame 的寬度除以 1600；1280、1600、1920 寬度的 scale 分別為 0.8、1、1.2。`LAYOUT` 以這個參考框的比例定義 playfield、出生點、容器邊界與球徑。Matter.js 碰撞地板在 Y=786；可見玻璃容器另有 24px 底部留白，故 `PLAYFIELD_BOTTOM=810`，危險線以這個可見底部計算。CSS 在 game wrapper 內使用 `cqw`，所以 `1cqw = 16px × UI scale`；主要字級、間距與面板尺寸共用此比例。

球體尺寸、主色、內部明暗、高光、標籤和五官比例集中在 `game.js` 的主題等級設定。`BALL_THEMES` 是兩套球色系的來源；`MELANIN_LEVELS` 指向目前選用的等級設定，場上球與 NEXT 預覽共用 `drawMelanin()`。球體不繪製外部投影，保留球內部漸層與高光。`styles.css` 的 `:root` 集中管理面板寬度、邊距、間距、底部提示樣式和字體尺度。1600 × 900 時，主標題 28 px、分數 40 px、面板標題 18 px、一般文字 16 px、輔助文字 14 px；各自依 frame 等比縮放，極小尺寸再由 `clamp()` 保護可讀性。視窗寬度 700 px 以下沿用精簡字級；中等寬度會將旅程卡往下調整。DEBUG 標籤在標準尺寸為 12 px。

滑鼠／觸控必須在 playfield 內按下且在有效區內放開才有掉球權限；游標預覽位置則獨立更新。`getLayoutMetrics()` 以當前 frame、canvas 與 playfield 的瀏覽器座標建立映射，點擊判定和 Canvas 座標共用同一份尺寸資訊。

新球生成池依本局最高出現等級擴張：最高未達 Lv5 時為 Lv1–Lv2，達 Lv5 後為 Lv1–Lv3，達 Lv7 後為 Lv1–Lv4。此進度以 `currentRunHighestLevel` 記錄，重新開始時重置；NEXT 與實際掉落共用同一個待生成等級。合成旅程只會解鎖本局已成為當前可玩球或實際生成的等級，單純 NEXT 預覽不會解鎖。

## 球色系

右下角的「球色系」切換器可在暖色與繽紛彩色之間切換；新開遊戲預設使用暖色。切換只改變球的視覺，不會重置分數、DDM、NEXT 或本局進度。每一套主題都由 Lv1 淺色逐步加深至 Lv9，並由場上球、待放置球、NEXT 與已解鎖的合成旅程共用。未解鎖的旅程球維持灰階。

暖色主題是蜜桃、珊瑚與暖玫瑰色階：Lv1 `#FCEEE8`、Lv2 `#F9E1D7`、Lv3 `#F6D1C2`、Lv4 `#F2C0AF`、Lv5 `#EEAE9B`、Lv6 `#E99988`、Lv7 `#E28379`、Lv8 `#D96E69`、Lv9 `#CC5C5D`。

繽紛彩色主題依序使用：Lv1 `#EF89AB`、Lv2 `#F18477`、Lv3 `#F3A15F`、Lv4 `#E7C45D`、Lv5 `#94C56E`、Lv6 `#67BBC5`、Lv7 `#7298D9`、Lv8 `#8D82D1`、Lv9 `#B174C2`。不同亮度下會搭配深色或奶白色表情與標籤，確保五官和等級文字清楚。

Score、合成旅程、NEXT 與 DDM 卡片共用 23% 寬度及左右 6.5% 邊距；合成旅程在原有卡片高度中分為標題、九階進度、合成說明與底部目標 badge，進度球仍依解鎖狀態及目前 Theme 換色。底部操作提示與 DEBUG 提示各有獨立淺色底框。

Lv9 完成自動淡化並補充 DDM 時，`currentRunMaxMergeCount` 記錄本局成功完成的最高級次數；Game Over 文案依 0 次、1 次或多次完成顯示，Restart 時重設。

DDM 與正常合成都經由同一個 `removeEntity()` 清除 Matter body 和 JavaScript entity。物理引擎關閉 sleeping，移除支撐球後 `wakeAllMelaninBodies()` 也會喚醒所有剩餘動態球；下一個固定步進會繼續解算碰撞與重力。

## 開發快捷鍵

`DEBUG` 預設為 `true`：按 `1`–`8` 在碗中放入指定等級、`D` 補充一次 DDM（不超過上限）、`R` 重新開始。發布正式版本時可在 `game.js` 將 `DEBUG` 設為 `false`，開發提示也會隱藏。

## 16:9 與縮放

`.game-wrapper` 以 `aspect-ratio: 16 / 9` 維持完整遊戲畫面比例，依 viewport 寬高等比例縮放並置中；非 16:9 視窗保留置中的 16:9 遊戲框，周圍顯示背景。Matter.js 使用正規化 1600 × 900 參考座標；ResizeObserver 重新計算 UI scale、Lv8 直徑與危險線，再更新 Canvas backing store 和畫面座標映射，不重建 Matter 世界，因此縮放或改變視窗大小不會重設分數、場上球、DDM、主題或本局進度。畫布以裝置像素比繪製，畫面與碰撞共用同一套比例，球體保持正圓且頁面不顯示 scrollbar。
