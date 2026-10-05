/* ===========================================================
   食譜資料
   -----------------------------------------------------------
   新增食譜：複製一整個物件放進 RECIPES 陣列即可，
   首頁與詳細頁都會自動帶出來。

   ingredients[].kind 決定換算與進位方式：
     mass   公克 / 公斤（自動在 1000 g 以上換成 kg）
     volume 公升 / 毫升（1 L 以下自動換成 ml）
     count  可數單位（片、顆、把…），四捨五入且最少 1
     spoon  小匙 / 大匙，進位到 1/4 並顯示分數
     fixed  不隨人數變動（例如「適量」）

   steps[].body 可用的標記：
     {{食材id}}        → 食材名 + 換算後份量，例如「白蘿蔔 600 g」
     {{食材id|qty}}    → 只顯示份量，例如「600 g」
     {{食材id|name}}   → 只顯示名稱
     **粗體**          → 重點提示
   steps[].timer 為秒數，有值就會出現倒數計時器。
   =========================================================== */

window.RECIPES = [
  {
    id: 'daikon-corn-pork-rib-soup',
    name: '蘿蔔玉米排骨湯',
    subtitle: '背骨熬湯底、軟骨吃肉，加入紅棗、玉米和娃娃菜，湯頭清甜不用味精也好喝。',
    image: 'assets/img/dish-daikon-corn-pork-rib-soup.svg',
    tags: ['湯品', '中式家常', '燉煮', '蔬菜多', '低油'],

    baseServings: 6,
    servingSize: '每人約 450–500 ml（含料）',
    yieldNote: '整鍋約 3 L 湯 + 1.5 kg 料',
    servingDetail: '當一餐主要的湯品約 4–5 人份；當配菜湯（每碗 350 ml）可分到 8 碗以上。',
    totalMinutes: 110,
    handsOnMinutes: 25,
    difficulty: '簡單',
    potHintBase: 6,

    groups: ['主料', '辛香・乾貨', '液體', '調味'],

    ingredients: [
      { id: 'backbone',     name: '豬背骨',       qty: 300, unit: 'g',  kind: 'mass',   group: '主料',        icon: 'ing-pork-backbone.svg',  note: '熬湯底用，膠質香氣都在這' },
      { id: 'cartilage',    name: '豬軟骨',       qty: 200, unit: 'g',  kind: 'mass',   group: '主料',        icon: 'ing-pork-cartilage.svg', note: '燉軟了拿來吃肉' },
      { id: 'daikon',       name: '白蘿蔔',       qty: 600, unit: 'g',  kind: 'mass',   group: '主料',        icon: 'ing-daikon.svg',         note: '削厚皮、切滾刀塊' },
      { id: 'corn',         name: '甜玉米',       qty: 200, unit: 'g',  kind: 'mass',   group: '主料',        icon: 'ing-corn.svg',           note: '即食玉米，最後才下' },
      { id: 'babyCabbage',  name: '娃娃菜',       qty: 200, unit: 'g',  kind: 'mass',   group: '主料',        icon: 'ing-baby-cabbage.svg',   note: '洗淨剝開' },
      { id: 'jujube',       name: '紅棗',         qty: 5,   unit: '顆', kind: 'count',  group: '辛香・乾貨',  icon: 'ing-jujube.svg',         note: '各剪一個開口比較出味' },
      { id: 'goji',         name: '枸杞',         qty: 10,  unit: 'g',  kind: 'mass',   group: '辛香・乾貨',  icon: 'ing-goji.svg',           note: '約一把，最後 5 分鐘下' },
      { id: 'gingerBlanch', name: '薑片',         qty: 4,   unit: '片', kind: 'count',  group: '辛香・乾貨',  icon: 'ing-ginger.svg',         note: '汆燙排骨用' },
      { id: 'gingerStew',   name: '薑片',         qty: 4,   unit: '片', kind: 'count',  group: '辛香・乾貨',  icon: 'ing-ginger.svg',         note: '燉湯用' },
      { id: 'water1',       name: '水',           qty: 2,   unit: 'L',  kind: 'volume', group: '液體',        icon: 'ing-water.svg',          note: '燉湯底' },
      { id: 'water2',       name: '水',           qty: 1.5, unit: 'L',  kind: 'volume', group: '液體',        icon: 'ing-water.svg',          note: '中途加入，用熱水' },
      { id: 'salt',         name: '鹽',           qty: 5,   unit: '小匙', kind: 'spoon', group: '調味',       icon: 'ing-salt.svg',           note: '先放一半，試味再補' },
      { id: 'umami',        name: '鮮味炒手',     qty: 2,   unit: '小匙', kind: 'spoon', group: '調味',       icon: 'ing-seasoning.svg',      note: '本身也有鹹味' }
    ],

    waterIds: ['water1', 'water2'],

    steps: [
      {
        title: '備料',
        body: '{{daikon}} 削厚皮，削到看不見皮下那圈白色纖維，再切成滾刀塊。{{jujube}} 各剪一個開口，{{babyCabbage}} 洗淨剝開，{{goji}} 用水稍微沖洗。',
        tip: '蘿蔔皮下那圈纖維帶苦味也嚼不爛，寧可削厚一點。'
      },
      {
        title: '汆燙蘿蔔',
        body: '水煮滾後放入蘿蔔塊，**不蓋鍋蓋**煮 3 分 30 秒，撈起備用。',
        timer: 210,
        timerNote: '水滾、蘿蔔下鍋後開始計時。',
        tip: '不蓋鍋蓋讓蘿蔔的生嗆味散掉，湯頭才會清甜。'
      },
      {
        title: '汆燙排骨',
        body: '{{backbone}}、{{cartilage}} 和 {{gingerBlanch}} **冷水下鍋**，煮滾後再煮 3 分鐘，然後關火。',
        timer: 180,
        timerNote: '水滾之後才開始計時。',
        tip: '冷水下鍋才能慢慢把血水逼出來；一滾就撈反而洗不乾淨。'
      },
      {
        title: '沖洗排骨',
        body: '撈起排骨，用**溫水**沖洗乾淨，把表面的浮沫和雜質都洗掉。',
        tip: '用溫水沖，肉不會瞬間緊縮，湯也比較清。'
      },
      {
        title: '燉湯底',
        body: '另起一鍋，加入 {{water1|qty}} 的水，放入排骨、{{gingerStew}} 和 {{jujube}}。中小火保持**微滾**，燉 1 小時。',
        timer: 3600,
        timerNote: '轉成中小火、水面微滾後開始計時。',
        tip: '湯面只要「邊緣冒小泡」就好。大滾會把湯煮濁。'
      },
      {
        title: '加水和蘿蔔',
        body: '加入 {{water2|qty}} 的水（用熱水比較不會打斷滾度），放入汆燙過的蘿蔔，再煮 25 分鐘。',
        timer: 1500,
        tip: '這時候蘿蔔只要煮到透、還有一點口感，等最後調味還會再煮 5 分鐘。'
      },
      {
        title: '加蔬菜調味',
        body: '放入 {{babyCabbage}}、{{corn}} 和 {{goji}}，加 {{salt|qty}} 鹽、{{umami|qty}} 鮮味炒手，煮約 5 分鐘到娃娃菜變軟。試過味道後就可以起鍋。',
        timer: 300,
        tip: '鹽和鮮味炒手都先下一半，試味後再補，比較不會回不來。'
      }
    ],

    notes: [
      '鹽和鮮味炒手是用小匙（茶匙）記錄的。鮮味炒手本身就有鹹味，建議先放一半，試味後再補。',
      '枸杞和最後那 5 分鐘是後來補上的流程，原本的筆記沒有寫。',
      '以 6 人份為基準抓的份量：整鍋約 3 L 湯加 1.5 kg 料。當主菜湯約 4–5 人，當配菜湯可以分到 8 碗以上。',
      '隔餐再加熱更入味，但娃娃菜會變得很軟，想保留口感可以吃之前再下。',
      '沒有鮮味炒手就用等量的雞粉，或是乾脆不加——湯底本身已經夠甜。'
    ]
  }
];
