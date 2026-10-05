/* ===========================================================
   食譜詳細頁：人數換算 + 步驟倒數計時器
   =========================================================== */
(function () {
  'use strict';

  var K = window.RecipeKit;
  var recipes = window.RECIPES || [];
  var params = new URLSearchParams(location.search);
  var id = params.get('id');
  var recipe = recipes.filter(function (r) { return r.id === id; })[0] || (id ? null : recipes[0]);

  var root = document.getElementById('recipeRoot');
  var missing = document.getElementById('notFound');

  if (!recipe) {
    if (root) root.hidden = true;
    if (missing) missing.hidden = false;
    return;
  }
  if (missing) missing.hidden = true;

  var ingById = {};
  recipe.ingredients.forEach(function (i) { ingById[i.id] = i; });

  var MIN_SERVINGS = 1, MAX_SERVINGS = 24;
  var servings = parseInt(K.LS.get('recipe.servings.' + recipe.id, recipe.baseServings), 10);
  if (!servings || servings < MIN_SERVINGS || servings > MAX_SERVINGS) servings = recipe.baseServings;

  function factor() { return servings / recipe.baseServings; }

  /* =========================================================
     1. 標題區
     ========================================================= */
  document.title = recipe.name + '｜暖食手記';
  var descMeta = document.querySelector('meta[name="description"]');
  if (descMeta) descMeta.setAttribute('content', recipe.subtitle);

  document.getElementById('rName').textContent = recipe.name;
  document.getElementById('rLede').textContent = recipe.subtitle;
  var heroImg = document.getElementById('rImage');
  heroImg.src = recipe.image;
  heroImg.alt = recipe.name + '成品插畫';

  document.getElementById('rMeta').innerHTML = [
    '<span class="pill">⏱ 總共 <b>' + K.humanMinutes(recipe.totalMinutes) + '</b></span>',
    '<span class="pill">🖐 手忙 <b>' + K.humanMinutes(recipe.handsOnMinutes) + '</b></span>',
    '<span class="pill">✦ <b>' + K.escapeHtml(recipe.difficulty) + '</b></span>',
    '<span class="pill">🍲 <b>' + K.escapeHtml(recipe.yieldNote) + '</b></span>'
  ].join('');

  document.getElementById('rTags').innerHTML = (recipe.tags || []).map(function (t) {
    return '<span class="pill">#' + K.escapeHtml(t) + '</span>';
  }).join('');

  var servingDetail = document.getElementById('rServingDetail');
  if (servingDetail) servingDetail.textContent = recipe.servingDetail || '';

  /* =========================================================
     2. 食材清單
     ========================================================= */
  var checkedKey = 'recipe.checked.' + recipe.id;
  var checked = {};
  try { JSON.parse(K.LS.get(checkedKey, '[]')).forEach(function (k) { checked[k] = true; }); } catch (e) {}

  function saveChecked() {
    K.LS.set(checkedKey, JSON.stringify(Object.keys(checked).filter(function (k) { return checked[k]; })));
  }

  var ingBox = document.getElementById('ingredients');
  (recipe.groups || ['食材']).forEach(function (group) {
    var items = recipe.ingredients.filter(function (i) { return (i.group || '食材') === group; });
    if (!items.length) return;

    var wrap = document.createElement('div');
    wrap.className = 'ing-group';
    var h = document.createElement('h3');
    h.textContent = group;
    wrap.appendChild(h);

    var ul = document.createElement('ul');
    ul.className = 'ing-list';
    items.forEach(function (ing) {
      var li = document.createElement('li');
      var cid = 'ing-' + ing.id;
      li.innerHTML =
        '<label class="ing" for="' + cid + '">' +
          '<input type="checkbox" id="' + cid + '" data-ing-check="' + ing.id + '"' + (checked[ing.id] ? ' checked' : '') + '>' +
          '<img class="ing-thumb" src="assets/img/' + ing.icon + '" alt="' + K.escapeHtml(ing.name) + '插畫" loading="lazy">' +
          '<span class="ing-name">' + K.escapeHtml(ing.name) +
            (ing.note ? '<small>' + K.escapeHtml(ing.note) + '</small>' : '') +
          '</span>' +
          '<span class="ing-qty" data-qty="' + ing.id + '"></span>' +
        '</label>';
      ul.appendChild(li);
    });
    wrap.appendChild(ul);
    ingBox.appendChild(wrap);
  });

  /* 勾選狀態：label 內的 checkbox 由 :has() 控制外觀，這裡只負責記住 */
  ingBox.addEventListener('change', function (e) {
    var t = e.target;
    if (!t.dataset || !t.dataset.ingCheck) return;
    checked[t.dataset.ingCheck] = t.checked;
    saveChecked();
  });

  /* =========================================================
     3. 步驟（含計時器）
     ========================================================= */
  var PLACEHOLDER = /\{\{([a-zA-Z0-9_]+)(?:\|(qty|name|full))?\}\}/g;

  function renderBody(text) {
    var html = K.escapeHtml(text)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(PLACEHOLDER, function (m, key, mode) {
        if (!ingById[key]) return m;
        return '<b class="q" data-ing="' + key + '" data-mode="' + (mode || 'full') + '"></b>';
      });
    return html;
  }

  var doneKey = 'recipe.done.' + recipe.id;
  var doneSteps = {};
  try { JSON.parse(K.LS.get(doneKey, '[]')).forEach(function (i) { doneSteps[i] = true; }); } catch (e) {}

  var stepsBox = document.getElementById('steps');
  var RING = 2 * Math.PI * 40;

  recipe.steps.forEach(function (step, i) {
    var li = document.createElement('li');
    li.className = 'step' + (doneSteps[i] ? ' done' : '');
    li.id = 'step-' + (i + 1);

    var html =
      '<div class="step-head">' +
        '<span class="step-no" aria-hidden="true">' + (i + 1) + '</span>' +
        '<h3 class="step-title">' + K.escapeHtml(step.title) + '</h3>' +
        '<span class="step-check">' +
          '<button type="button" class="nm-btn" data-done="' + i + '" aria-pressed="' + (doneSteps[i] ? 'true' : 'false') + '">' +
            (doneSteps[i] ? '✓ 已完成' : '標記完成') +
          '</button>' +
        '</span>' +
      '</div>' +
      '<p class="step-body">' + renderBody(step.body) + '</p>';

    if (step.timer) {
      html +=
        '<div class="timer" data-timer="' + i + '">' +
          '<div class="timer-ring">' +
            '<svg viewBox="0 0 100 100" aria-hidden="true">' +
              '<circle class="track" cx="50" cy="50" r="40"></circle>' +
              '<circle class="bar" cx="50" cy="50" r="40" stroke-dasharray="' + RING.toFixed(2) + '" stroke-dashoffset="0"></circle>' +
            '</svg>' +
            '<span class="timer-readout" data-readout>' + K.clock(step.timer) + '</span>' +
          '</div>' +
          '<div class="timer-main">' +
            '<div class="timer-label" data-label>倒數 ' + K.humanDuration(step.timer) + '</div>' +
            (step.timerNote ? '<p class="timer-note">' + K.escapeHtml(step.timerNote) + '</p>' : '') +
            '<div class="timer-controls">' +
              '<button type="button" class="nm-btn primary" data-act="toggle">▶ 開始</button>' +
              '<button type="button" class="nm-btn" data-act="reset">重設</button>' +
              '<button type="button" class="nm-btn" data-act="plus">+1 分</button>' +
            '</div>' +
          '</div>' +
          '<span class="sr-only" role="status" aria-live="polite" data-live></span>' +
        '</div>';
    }

    if (step.tip) html += '<p class="step-tip">' + K.escapeHtml(step.tip) + '</p>';

    li.innerHTML = html;
    stepsBox.appendChild(li);
  });

  /* 完成進度 */
  var progressBar = document.getElementById('progressBar');
  var progressLabel = document.getElementById('progressLabel');
  function updateProgress() {
    var total = recipe.steps.length;
    var n = Object.keys(doneSteps).filter(function (k) { return doneSteps[k]; }).length;
    progressBar.style.width = (n / total * 100) + '%';
    progressLabel.textContent = '已完成 ' + n + ' / ' + total + ' 個步驟';
  }

  stepsBox.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-done]');
    if (!btn) return;
    var i = btn.dataset.done;
    doneSteps[i] = !doneSteps[i];
    btn.setAttribute('aria-pressed', doneSteps[i] ? 'true' : 'false');
    btn.textContent = doneSteps[i] ? '✓ 已完成' : '標記完成';
    document.getElementById('step-' + (Number(i) + 1)).classList.toggle('done', !!doneSteps[i]);
    K.LS.set(doneKey, JSON.stringify(Object.keys(doneSteps).filter(function (k) { return doneSteps[k]; })));
    updateProgress();
  });
  updateProgress();

  /* =========================================================
     4. 備註 + 插畫牆
     ========================================================= */
  document.getElementById('notes').innerHTML = (recipe.notes || []).map(function (n) {
    return '<li>' + K.escapeHtml(n) + '</li>';
  }).join('');

  var seen = {};
  document.getElementById('artWall').innerHTML = recipe.ingredients.filter(function (i) {
    if (seen[i.icon]) return false;
    seen[i.icon] = true;
    return true;
  }).map(function (i) {
    return '<figure><div class="frame"><img src="assets/img/' + i.icon + '" alt="' + K.escapeHtml(i.name) + '插畫" loading="lazy"></div>' +
      '<figcaption>' + K.escapeHtml(i.name) + '</figcaption></figure>';
  }).join('');

  /* =========================================================
     5. 人數換算
     ========================================================= */
  var valueEl = document.getElementById('servingValue');
  var hintEl = document.getElementById('scaleHint');

  function qtyText(ing, mode) {
    var s = K.scaleIngredient(ing, factor());
    if (mode === 'qty') return s.text;
    if (mode === 'name') return ing.name;
    return ing.name + ' ' + s.text;
  }

  function renderQuantities() {
    valueEl.textContent = servings;

    Array.prototype.forEach.call(document.querySelectorAll('[data-qty]'), function (el) {
      var ing = ingById[el.dataset.qty];
      if (ing) el.textContent = K.scaleIngredient(ing, factor()).text;
    });

    Array.prototype.forEach.call(document.querySelectorAll('.q[data-ing]'), function (el) {
      var ing = ingById[el.dataset.ing];
      if (ing) el.textContent = qtyText(ing, el.dataset.mode);
    });

    Array.prototype.forEach.call(document.querySelectorAll('[data-preset]'), function (b) {
      b.setAttribute('aria-pressed', Number(b.dataset.preset) === servings ? 'true' : 'false');
    });

    /* 水量與鍋具提示 */
    var water = (recipe.waterIds || []).reduce(function (sum, wid) {
      return ingById[wid] ? sum + ingById[wid].qty : sum;
    }, 0) * factor();
    var solidsKg = recipe.ingredients.reduce(function (sum, i) {
      return (i.kind === 'mass' && i.group === '主料') ? sum + i.qty : sum;
    }, 0) * factor() / 1000;
    var pot = Math.ceil((water + solidsKg) * 1.2);

    hintEl.innerHTML =
      '以 <b>' + recipe.baseServings + ' 人份</b>為基準換算（×' + Math.round(factor() * 100) / 100 + '）。' +
      K.escapeHtml(recipe.servingSize || '') + '。<br>' +
      '總水量約 <b>' + (Math.round(water * 10) / 10) + ' L</b>，加上食材建議用 <b>' + pot + ' L</b> 以上的湯鍋。';
  }

  function setServings(n) {
    servings = Math.min(MAX_SERVINGS, Math.max(MIN_SERVINGS, n));
    K.LS.set('recipe.servings.' + recipe.id, servings);
    renderQuantities();
  }

  document.getElementById('minus').addEventListener('click', function () { setServings(servings - 1); });
  document.getElementById('plus').addEventListener('click', function () { setServings(servings + 1); });
  document.getElementById('presets').addEventListener('click', function (e) {
    var b = e.target.closest('[data-preset]');
    if (b) setServings(Number(b.dataset.preset));
  });

  /* 複製食材清單 */
  var copyBtn = document.getElementById('copyList');
  copyBtn.addEventListener('click', function () {
    var lines = [recipe.name + '（' + servings + ' 人份）', ''];
    (recipe.groups || []).forEach(function (g) {
      var items = recipe.ingredients.filter(function (i) { return i.group === g; });
      if (!items.length) return;
      lines.push('【' + g + '】');
      items.forEach(function (i) {
        lines.push('· ' + i.name + ' ' + K.scaleIngredient(i, factor()).text + (i.note ? '（' + i.note + '）' : ''));
      });
      lines.push('');
    });
    var text = lines.join('\n').trim();
    var done = function () {
      copyBtn.textContent = '✓ 已複製';
      setTimeout(function () { copyBtn.textContent = '複製食材清單'; }, 1800);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { window.prompt('複製下面的清單：', text); });
    } else {
      window.prompt('複製下面的清單：', text);
    }
  });

  document.getElementById('resetChecks').addEventListener('click', function () {
    checked = {};
    saveChecked();
    Array.prototype.forEach.call(ingBox.querySelectorAll('input[type=checkbox]'), function (c) { c.checked = false; });
  });

  renderQuantities();

  /* =========================================================
     6. 倒數計時器
     ========================================================= */
  var TKEY = 'recipe.timers.' + recipe.id;
  var state = {};   /* index -> { remaining, endsAt, running, finished } */

  try {
    var saved = JSON.parse(sessionStorage.getItem(TKEY) || '{}');
    Object.keys(saved).forEach(function (k) { state[k] = saved[k]; });
  } catch (e) {}

  function persist() {
    try { sessionStorage.setItem(TKEY, JSON.stringify(state)); } catch (e) {}
  }

  function getState(i) {
    if (!state[i]) state[i] = { remaining: recipe.steps[i].timer, endsAt: 0, running: false, finished: false };
    return state[i];
  }

  function remainingOf(i) {
    var s = getState(i);
    if (s.running) return Math.max(0, (s.endsAt - Date.now()) / 1000);
    return s.remaining;
  }

  /* 提示音 */
  var audioCtx = null;
  function chime() {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      [0, 0.42, 0.84].forEach(function (offset) {
        var t = audioCtx.currentTime + offset;
        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, t);
        osc.frequency.setValueAtTime(1180, t + 0.14);
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.3, t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.36);
      });
    } catch (e) { /* 不支援音訊就算了 */ }
    if (navigator.vibrate) navigator.vibrate([180, 90, 180]);
  }

  function paint(i) {
    var el = document.querySelector('[data-timer="' + i + '"]');
    if (!el) return;
    var step = recipe.steps[i];
    var s = getState(i);
    var rem = remainingOf(i);

    var frac = Math.max(0, Math.min(1, rem / step.timer));
    el.querySelector('[data-readout]').textContent = K.clock(rem);
    el.querySelector('.bar').style.strokeDashoffset = (RING * (1 - frac)).toFixed(2);

    var label = el.querySelector('[data-label]');
    var toggle = el.querySelector('[data-act="toggle"]');

    el.classList.toggle('running', !!s.running);
    el.classList.toggle('finished', !!s.finished);

    if (s.finished) {
      label.textContent = '⏰ 時間到了！';
      toggle.textContent = '▶ 再計時';
    } else if (s.running) {
      label.textContent = '倒數中…';
      toggle.textContent = '⏸ 暫停';
    } else if (Math.abs(rem - step.timer) > 0.5) {
      label.textContent = '已暫停　剩 ' + K.humanDuration(Math.round(rem));
      toggle.textContent = '▶ 繼續';
    } else {
      label.textContent = '倒數 ' + K.humanDuration(step.timer);
      toggle.textContent = '▶ 開始';
    }
  }

  function start(i) {
    var s = getState(i);
    if (s.finished) { s.remaining = recipe.steps[i].timer; s.finished = false; }
    if (s.remaining <= 0) s.remaining = recipe.steps[i].timer;
    s.endsAt = Date.now() + s.remaining * 1000;
    s.running = true;
    persist();
    paint(i);
    loop();
  }

  function pause(i) {
    var s = getState(i);
    s.remaining = remainingOf(i);
    s.running = false;
    s.endsAt = 0;
    persist();
    paint(i);
  }

  function reset(i) {
    state[i] = { remaining: recipe.steps[i].timer, endsAt: 0, running: false, finished: false };
    persist();
    paint(i);
    updateMini();
  }

  function finish(i) {
    var s = getState(i);
    s.running = false;
    s.finished = true;
    s.remaining = 0;
    s.endsAt = 0;
    persist();
    paint(i);
    var live = document.querySelector('[data-timer="' + i + '"] [data-live]');
    if (live) live.textContent = '步驟 ' + (Number(i) + 1) + '「' + recipe.steps[i].title + '」時間到';
    chime();
  }

  stepsBox.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-act]');
    if (!btn) return;
    var i = btn.closest('[data-timer]').dataset.timer;
    var act = btn.dataset.act;
    if (act === 'toggle') {
      getState(i).running ? pause(i) : start(i);
    } else if (act === 'reset') {
      reset(i);
    } else if (act === 'plus') {
      var s = getState(i);
      if (s.running) { s.endsAt += 60000; }
      else { s.remaining = Math.max(0, (s.finished ? 0 : s.remaining)) + 60; s.finished = false; }
      persist();
      paint(i);
    }
  });

  /* ---------- 浮動計時列 ---------- */
  var mini = document.getElementById('miniTimer');
  var miniText = document.getElementById('miniText');
  var miniJump = document.getElementById('miniJump');
  var miniTarget = null;

  function updateMini() {
    var running = [], alarmed = [];
    recipe.steps.forEach(function (step, i) {
      if (!step.timer) return;
      var s = state[i];
      if (!s) return;
      if (s.running) running.push(i);
      else if (s.finished) alarmed.push(i);
    });

    if (alarmed.length) {
      var a = alarmed[0];
      miniTarget = a;
      miniText.innerHTML = '⏰ 步驟 ' + (Number(a) + 1) + '「' + K.escapeHtml(recipe.steps[a].title) + '」<b>時間到</b>';
      mini.classList.add('show', 'alarm');
      return;
    }
    if (running.length) {
      running.sort(function (x, y) { return remainingOf(x) - remainingOf(y); });
      var r = running[0];
      miniTarget = r;
      miniText.innerHTML = '步驟 ' + (Number(r) + 1) + '「' + K.escapeHtml(recipe.steps[r].title) + '」<b>' + K.clock(remainingOf(r)) + '</b>' +
        (running.length > 1 ? '　+' + (running.length - 1) + ' 個計時中' : '');
      mini.classList.add('show');
      mini.classList.remove('alarm');
      return;
    }
    mini.classList.remove('show', 'alarm');
    miniTarget = null;
  }

  miniJump.addEventListener('click', function () {
    if (miniTarget === null) return;
    var el = document.getElementById('step-' + (Number(miniTarget) + 1));
    if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  });

  /* ---------- 主迴圈 ---------- */
  var handle = null;
  var baseTitle = document.title;
  var flash = false;

  function anyActive() {
    return Object.keys(state).some(function (k) { return state[k].running || state[k].finished; });
  }

  function loop() {
    if (handle) return;
    handle = setInterval(function () {
      recipe.steps.forEach(function (step, i) {
        if (!step.timer) return;
        var s = state[i];
        if (!s || !s.running) return;
        if (remainingOf(i) <= 0.05) { finish(i); } else { paint(i); }
      });
      updateMini();

      /* 分頁在背景時，用標題閃爍提醒 */
      var alarm = Object.keys(state).some(function (k) { return state[k].finished; });
      if (alarm && document.hidden) {
        flash = !flash;
        document.title = flash ? '⏰ 時間到！' : baseTitle;
      } else if (document.title !== baseTitle) {
        document.title = baseTitle;
      }

      if (!anyActive()) { clearInterval(handle); handle = null; }
    }, 250);
  }

  /* 還原重新整理前的狀態 */
  recipe.steps.forEach(function (step, i) {
    if (!step.timer) return;
    if (state[i]) {
      if (state[i].running && (state[i].endsAt - Date.now()) <= 0) {
        state[i].running = false;
        state[i].finished = true;
        state[i].remaining = 0;
      }
      paint(i);
    }
  });
  updateMini();
  if (anyActive()) loop();

  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) {
      document.title = baseTitle;
      recipe.steps.forEach(function (step, i) { if (step.timer && state[i]) paint(i); });
      updateMini();
    }
  });
})();
