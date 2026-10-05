/* ===========================================================
   首頁：食譜總覽 + 搜尋 + 標籤篩選
   =========================================================== */
(function () {
  'use strict';

  var K = window.RecipeKit;
  var recipes = window.RECIPES || [];
  var grid = document.getElementById('grid');
  var empty = document.getElementById('empty');
  var countEl = document.getElementById('count');
  var input = document.getElementById('q');
  var chipBox = document.getElementById('tagChips');
  var clearBtn = document.getElementById('clearFilters');

  var activeTags = [];

  /* ---------- 標籤 ---------- */
  var allTags = [];
  recipes.forEach(function (r) {
    (r.tags || []).forEach(function (t) { if (allTags.indexOf(t) < 0) allTags.push(t); });
  });

  allTags.forEach(function (tag) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.textContent = tag;
    b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', function () {
      var i = activeTags.indexOf(tag);
      if (i < 0) { activeTags.push(tag); } else { activeTags.splice(i, 1); }
      b.setAttribute('aria-pressed', i < 0 ? 'true' : 'false');
      render();
    });
    chipBox.appendChild(b);
  });

  /* ---------- 搜尋 ---------- */
  function haystack(r) {
    return [
      r.name, r.subtitle, (r.tags || []).join(' '), r.difficulty,
      (r.ingredients || []).map(function (i) { return i.name + ' ' + (i.note || ''); }).join(' '),
      (r.steps || []).map(function (s) { return s.title; }).join(' ')
    ].join(' ').toLowerCase();
  }

  function filtered() {
    var q = (input.value || '').trim().toLowerCase();
    return recipes.filter(function (r) {
      var okTags = activeTags.every(function (t) { return (r.tags || []).indexOf(t) >= 0; });
      var okQ = !q || haystack(r).indexOf(q) >= 0;
      return okTags && okQ;
    });
  }

  /* ---------- 卡片 ---------- */
  function card(r) {
    var a = document.createElement('a');
    a.className = 'card';
    a.href = 'recipe.html?id=' + encodeURIComponent(r.id);
    a.innerHTML =
      '<div class="card-art"><img src="' + r.image + '" alt="' + K.escapeHtml(r.name) + '成品插畫" loading="lazy"></div>' +
      '<div class="card-body">' +
        '<h3 class="card-title">' + K.escapeHtml(r.name) + '</h3>' +
        '<p class="card-desc">' + K.escapeHtml(r.subtitle) + '</p>' +
        '<div class="card-meta">' +
          '<span class="pill">⏱ ' + K.humanMinutes(r.totalMinutes) + '</span>' +
          '<span class="pill">🍚 ' + r.baseServings + ' 人份</span>' +
          '<span class="pill">✦ ' + K.escapeHtml(r.difficulty) + '</span>' +
        '</div>' +
      '</div>';
    return a;
  }

  function render() {
    var list = filtered();
    grid.innerHTML = '';
    list.forEach(function (r) { grid.appendChild(card(r)); });

    var hasFilter = activeTags.length || (input.value || '').trim();
    countEl.innerHTML = hasFilter
      ? '找到 <b>' + list.length + '</b> 道食譜'
      : '共 <b>' + recipes.length + '</b> 道食譜';
    empty.hidden = list.length > 0;
    grid.hidden = list.length === 0;
    if (clearBtn) clearBtn.hidden = !hasFilter;
  }

  input.addEventListener('input', render);
  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      input.value = '';
      activeTags = [];
      Array.prototype.forEach.call(chipBox.querySelectorAll('.chip'), function (c) {
        c.setAttribute('aria-pressed', 'false');
      });
      render();
      input.focus();
    });
  }

  /* 按 / 快速聚焦搜尋 */
  document.addEventListener('keydown', function (e) {
    if (e.key === '/' && document.activeElement !== input) {
      e.preventDefault();
      input.focus();
    }
  });

  render();
})();
