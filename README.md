# 暖食手記 — 蠟筆插畫風食譜網站

純靜態網站（HTML + CSS + 原生 JS，零建置、零依賴），可直接丟上 GitHub Pages。

## 功能

| 功能 | 說明 |
| --- | --- |
| 食譜總覽 | 卡片式列表，附成品插畫、總時間、人份、難度 |
| 搜尋 | 比對食譜名稱、簡介、標籤、**食材名稱**與步驟標題；按 `/` 可快速聚焦搜尋框 |
| 標籤篩選 | 可多選，與搜尋條件並用 |
| 人數換算 | 1–24 人份，所有食材與步驟內文的份量同步換算，並提示總水量與建議鍋具容量 |
| 步驟計時器 | 需要等待的步驟都有倒數計時：開始／暫停／重設／+1 分，完成時響鈴＋震動 |
| 浮動計時列 | 捲到別處時底部顯示最快結束的計時器，可一鍵跳回該步驟 |
| 狀態記憶 | 人份、食材勾選、步驟完成記在 `localStorage`；計時器記在 `sessionStorage`，重新整理不會歸零 |
| 深色模式 | 自動跟隨系統，也可手動切換 |
| 列印 | 右上角「列印」會輸出去掉互動元件的單欄版面 |

## 本機預覽

```bash
python3 -m http.server 8000
```

然後開 <http://localhost:8000/>。（直接雙擊 `index.html` 也能跑。）

## 放上 GitHub Pages

```bash
git init
git add .
git commit -m "feat: 暖食手記食譜網站"
git branch -M main
git remote add origin git@github.com:<你的帳號>/<repo>.git
git push -u origin main
```

接著在 GitHub repo 的 **Settings → Pages** 把 Source 設成 `Deploy from a branch`、
branch 選 `main` / `(root)`，網址就是 `https://<你的帳號>.github.io/<repo>/`。

專案已經放了 `.nojekyll`，Jekyll 不會去動 `assets/` 底下的檔案。

## 新增一道食譜

只改 `assets/js/data.js` 一個檔案：複製 `RECIPES` 裡的整個物件，改掉內容即可，
首頁卡片與詳細頁都會自動帶出來。

```js
{
  id: 'my-recipe',               // 網址用：recipe.html?id=my-recipe
  name: '食譜名稱',
  subtitle: '一句話介紹',
  image: 'assets/img/dish-xxx.svg',
  tags: ['湯品', '快速'],
  baseServings: 4,               // 下面 ingredients 的份量是「幾人份」
  servingSize: '每人約 400 ml',
  yieldNote: '整鍋約 2 L',
  totalMinutes: 40,
  handsOnMinutes: 15,
  difficulty: '簡單',
  groups: ['主料', '調味'],       // 食材分組顯示順序
  ingredients: [ /* 見下表 */ ],
  waterIds: ['water1'],          // 哪些食材要算進「總水量」提示
  steps: [ /* 見下表 */ ],
  notes: ['補充說明…']
}
```

### 食材欄位

```js
{ id: 'daikon', name: '白蘿蔔', qty: 600, unit: 'g', kind: 'mass',
  group: '主料', icon: 'ing-daikon.svg', note: '削厚皮、切滾刀塊' }
```

`kind` 決定換算與進位方式：

| kind | 用途 | 進位規則 |
| --- | --- | --- |
| `mass` | 公克 | <10 g 進 0.5、<50 g 進 1、<200 g 進 5、<1000 g 進 10，其餘進 25；≥1000 g 自動換成 kg |
| `volume` | 公升 | 進到 0.1 L，不足 1 L 自動換成 ml |
| `count` | 片／顆／把 | 四捨五入，最少 1 |
| `spoon` | 小匙／大匙 | 進到 ¼，顯示成 ½、1¼ 這種分數 |
| `fixed` | 「適量」這類 | 不隨人數變動 |

### 步驟欄位

```js
{
  title: '燉湯底',
  body: '加入 {{water1|qty}} 的水，放入排骨和 {{gingerStew}}。保持**微滾**燉 1 小時。',
  timer: 3600,                   // 秒數，有值才會出現計時器；不用等就省略
  timerNote: '水滾後才開始計時。',
  tip: '湯面只要邊緣冒小泡就好。'
}
```

`body` 可用的標記：

- `{{食材id}}` → 食材名 + 換算後份量，例如「白蘿蔔 600 g」
- `{{食材id|qty}}` → 只顯示份量，例如「600 g」
- `{{食材id|name}}` → 只顯示名稱
- `**粗體**` → 重點提示

## 插畫

`assets/img/` 底下全部是手寫的 SVG，用 `feTurbulence` + `feDisplacementMap` 做邊緣的
蠟筆抖動，再疊一層 `mix-blend-mode: multiply` 的雜訊當蠟筆顆粒。檔名規則：

- `dish-*.svg` — 成品插畫（viewBox 800×540）
- `ing-*.svg` — 食材插畫（viewBox 160×160，背景透明）

畫新的食材時，從既有檔案複製 `<defs>` 的兩個 filter 來用最快，記得換 `seed`，
不同的 seed 會給出不同的筆觸。

## 檔案結構

```
.
├── index.html            總覽 + 搜尋
├── recipe.html           詳細頁（?id=食譜編號）
├── .nojekyll
└── assets
    ├── css/style.css     設計 token 與 Neumorphism 元件
    ├── js/data.js        ← 食譜內容都在這
    ├── js/common.js      主題切換、份量換算、格式化
    ├── js/index.js       總覽頁邏輯
    ├── js/recipe.js      詳細頁邏輯（換算 + 計時器）
    └── img/*.svg         插畫
```
