/* ===========================================================
   共用工具：主題切換、份量換算、格式化
   =========================================================== */
(function () {
  'use strict';

  var LS = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* 隱私模式 */ } }
  };

  /* ---------- 主題 ---------- */
  var THEME_KEY = 'recipe.theme';
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    var btn = document.getElementById('themeToggle');
    if (btn) {
      btn.setAttribute('aria-label', t === 'dark' ? '切換為淺色模式' : '切換為深色模式');
      btn.textContent = t === 'dark' ? '☀' : '☾';
    }
  }
  function initTheme() {
    var saved = LS.get(THEME_KEY, null);
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(saved || (prefersDark ? 'dark' : 'light'));
    /* 使用者沒手動選過的話，跟著系統設定走 */
    if (!saved && window.matchMedia) {
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      var onChange = function (e) {
        if (!LS.get(THEME_KEY, null)) applyTheme(e.matches ? 'dark' : 'light');
      };
      if (mq.addEventListener) { mq.addEventListener('change', onChange); }
      else if (mq.addListener) { mq.addListener(onChange); }
    }

    var btn = document.getElementById('themeToggle');
    if (btn) {
      btn.addEventListener('click', function () {
        var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        LS.set(THEME_KEY, next);
      });
    }
  }

  /* ---------- 數字 / 份量 ---------- */
  var FRACTIONS = { 0.25: '¼', 0.5: '½', 0.75: '¾' };

  function niceMass(v) {
    if (v < 10) return Math.round(v * 2) / 2;
    if (v < 50) return Math.round(v);
    if (v < 200) return Math.round(v / 5) * 5;
    if (v < 1000) return Math.round(v / 10) * 10;
    return Math.round(v / 25) * 25;
  }

  function stripZero(n) {
    return String(Number(n.toFixed(2)));
  }

  function fractionText(v) {
    var whole = Math.floor(v);
    var frac = Math.round((v - whole) * 100) / 100;
    var glyph = FRACTIONS[frac];
    if (!glyph) return stripZero(v);
    return (whole ? whole : '') + glyph;
  }

  /** 把食材換算到指定倍率，回傳 { value, unit, text } */
  function scaleIngredient(ing, factor) {
    var raw = ing.qty * factor;

    if (ing.kind === 'fixed') {
      return { value: ing.qty, unit: ing.unit, text: ing.unit };
    }
    if (ing.kind === 'mass') {
      var g = niceMass(raw);
      if (g >= 1000) {
        var kg = Math.round(g / 100) / 10;
        return { value: g, unit: 'kg', text: stripZero(kg) + ' kg' };
      }
      return { value: g, unit: 'g', text: stripZero(g) + ' g' };
    }
    if (ing.kind === 'volume') {
      if (raw < 1) {
        var ml = Math.round(raw * 1000 / 10) * 10;
        return { value: raw, unit: 'ml', text: ml + ' ml' };
      }
      var L = Math.round(raw * 10) / 10;
      return { value: raw, unit: 'L', text: stripZero(L) + ' L' };
    }
    if (ing.kind === 'spoon') {
      var sp = Math.max(0.25, Math.round(raw * 4) / 4);
      return { value: sp, unit: ing.unit, text: fractionText(sp) + ' ' + ing.unit };
    }
    /* count */
    var c = Math.max(1, Math.round(raw));
    return { value: c, unit: ing.unit, text: c + ' ' + ing.unit };
  }

  /** 秒數 → 01:30 / 1:00:00 */
  function clock(sec) {
    sec = Math.max(0, Math.round(sec));
    var h = Math.floor(sec / 3600);
    var m = Math.floor((sec % 3600) / 60);
    var s = sec % 60;
    var pad = function (n) { return n < 10 ? '0' + n : String(n); };
    return h ? h + ':' + pad(m) + ':' + pad(s) : pad(m) + ':' + pad(s);
  }

  /** 秒數 → 「3 分 30 秒」 */
  function humanDuration(sec) {
    var h = Math.floor(sec / 3600);
    var m = Math.floor((sec % 3600) / 60);
    var s = sec % 60;
    var out = [];
    if (h) out.push(h + ' 小時');
    if (m) out.push(m + ' 分');
    if (s) out.push(s + ' 秒');
    return out.join(' ') || '0 秒';
  }

  /** 分鐘 → 「1 小時 50 分」 */
  function humanMinutes(min) {
    var h = Math.floor(min / 60), m = min % 60;
    if (h && m) return h + ' 小時 ' + m + ' 分';
    if (h) return h + ' 小時';
    return m + ' 分鐘';
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  window.RecipeKit = {
    LS: LS,
    initTheme: initTheme,
    scaleIngredient: scaleIngredient,
    clock: clock,
    humanDuration: humanDuration,
    humanMinutes: humanMinutes,
    escapeHtml: escapeHtml
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
  } else {
    initTheme();
  }
})();
