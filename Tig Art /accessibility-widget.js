/*!
 * ווידג'ט נגישות לשופיפיי
 * Shopify Accessibility Widget — תקן ישראלי IS 5568 / WCAG 2.0 AA
 * Version: 1.0.0
 * License: MIT
 * ============================================================
 * הנחיות הגדרה: ראה SHOPIFY-SETUP.md
 * Setup instructions: see SHOPIFY-SETUP.md
 */
(function (window, document) {
  'use strict';

  // ============================================================
  // הגדרות — שנה כאן לפי הצורך
  // ============================================================
  var CONFIG = {
    storageKey:    'a11y_settings_v1',
    statementUrl:  'accessibility.html', // עמוד הצהרת הנגישות של TIG ART
    widgetTitle:   'כלי נגישות',
    openBtnLabel:  'פתח / סגור כלי נגישות',
    position:      'bottom-left', // 'bottom-left' | 'bottom-right'
  };

  // ============================================================
  // ברירות מחדל
  // ============================================================
  var DEFAULTS = {
    fontSize:          0,        // 0=רגיל 1=גדול 2=גדול מאוד 3=ענק
    contrast:          'normal', // 'normal' | 'high' | 'dark' | 'grayscale'
    stopAnimations:    false,
    dyslexiaFont:      false,
    highlightLinks:    false,
    highlightHeadings: false,
    readingGuide:      false,
    bigCursor:         false,
    letterSpacing:     false,
    lineHeight:        false,
    enhancedFocus:     false,
  };

  // ============================================================
  // מצב
  // ============================================================
  var state = loadState();
  var panelOpen = false;
  var readingGuideEl = null;
  var dyslexiaFontLink = null;

  // ============================================================
  // CSS
  // ============================================================
  var STYLES = [

    /* ── Skip link ─────────────────────────────────────── */
    '#a11y-skip-link{',
      'position:absolute;top:-100px;left:0;',
      'background:#0057B7;color:#fff;',
      'padding:12px 20px;font-size:16px;font-weight:700;',
      'text-decoration:none;z-index:9999999;',
      'border-radius:0 0 10px 0;transition:top .2s;',
    '}',
    '#a11y-skip-link:focus{top:0;}',

    /* ── Floating button ────────────────────────────────── */
    '#a11y-btn{',
      'position:fixed;z-index:999997;',
      CONFIG.position === 'bottom-right' ? 'bottom:30px;right:30px;' : 'bottom:30px;left:30px;',
      'width:58px;height:58px;',
      'background:#0057B7;color:#fff;',
      'border:3px solid #fff;border-radius:50%;',
      'cursor:pointer;padding:0;',
      'display:flex;align-items:center;justify-content:center;',
      'box-shadow:0 4px 18px rgba(0,0,0,.32);',
      'transition:transform .2s,background .2s,box-shadow .2s;',
      'outline:none;',
    '}',
    '#a11y-btn:hover{background:#004299;transform:scale(1.08);}',
    '#a11y-btn:focus-visible{box-shadow:0 0 0 4px #fff,0 0 0 7px #0057B7;}',
    '#a11y-btn svg{width:28px;height:28px;fill:#fff;pointer-events:none;}',
    '#a11y-btn[aria-expanded=true]{background:#004299;}',

    /* ── Panel ──────────────────────────────────────────── */
    '#a11y-panel{',
      'position:fixed;z-index:999996;',
      CONFIG.position === 'bottom-right' ? 'bottom:104px;right:14px;' : 'bottom:104px;left:14px;',
      'width:318px;max-height:calc(100vh - 130px);',
      'background:#fff;border-radius:16px;',
      'box-shadow:0 12px 50px rgba(0,0,0,.22);',
      'display:flex;flex-direction:column;overflow:hidden;',
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Rubik,Arial,sans-serif;',
      'font-size:15px;direction:rtl;',
      'opacity:0;transform:translateY(14px) scale(.97);pointer-events:none;',
      'transition:opacity .22s ease,transform .22s ease;',
    '}',
    '#a11y-panel.a11y-open{opacity:1;transform:translateY(0) scale(1);pointer-events:all;}',

    /* Panel header */
    '#a11y-panel-header{',
      'display:flex;align-items:center;justify-content:space-between;',
      'padding:14px 16px;background:#0057B7;color:#fff;',
    '}',
    '#a11y-panel-header h2{',
      'all:unset;font-size:16px;font-weight:700;color:#fff;',
      'font-family:inherit;display:flex;align-items:center;gap:8px;',
    '}',
    '#a11y-close-btn{',
      'background:rgba(255,255,255,.18);border:2px solid rgba(255,255,255,.45);',
      'color:#fff;border-radius:7px;width:30px;height:30px;',
      'cursor:pointer;font-size:15px;',
      'display:flex;align-items:center;justify-content:center;',
      'transition:background .15s;flex-shrink:0;',
    '}',
    '#a11y-close-btn:hover,#a11y-close-btn:focus{background:rgba(255,255,255,.35);}',
    '#a11y-close-btn:focus-visible{outline:2px solid #fff;outline-offset:2px;}',

    /* Panel body */
    '#a11y-panel-body{overflow-y:auto;padding:12px;flex:1;}',
    '#a11y-panel-body::-webkit-scrollbar{width:5px;}',
    '#a11y-panel-body::-webkit-scrollbar-thumb{background:#cdd7e0;border-radius:3px;}',

    /* Section card */
    '.a11y-section{margin-bottom:10px;background:#f4f7fb;border-radius:11px;padding:10px 12px;}',
    '.a11y-section-title{font-size:11px;font-weight:700;color:#5a6779;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px;}',

    /* Button group (font size / contrast) */
    '.a11y-btn-group{display:flex;gap:5px;flex-wrap:wrap;}',
    '.a11y-opt-btn{',
      'flex:1;min-width:60px;padding:7px 4px;',
      'background:#fff;border:2px solid #d2dae4;border-radius:9px;',
      'cursor:pointer;font-size:12px;font-family:inherit;color:#2d3a47;',
      'text-align:center;transition:border-color .15s,background .15s,color .15s;',
      'display:flex;flex-direction:column;align-items:center;gap:2px;',
      'line-height:1.3;',
    '}',
    '.a11y-opt-btn:hover{border-color:#0057B7;background:#edf3ff;}',
    '.a11y-opt-btn:focus-visible{outline:3px solid #0057B7;outline-offset:2px;}',
    '.a11y-opt-btn.a11y-active{background:#0057B7;border-color:#0057B7;color:#fff;font-weight:600;}',
    '.a11y-btn-icon{font-size:17px;}',
    '.a11y-btn-lbl{font-size:11px;}',

    /* Toggle rows */
    '.a11y-toggle-row{',
      'display:flex;align-items:center;justify-content:space-between;',
      'padding:8px 0;border-bottom:1px solid #e5ecf3;cursor:pointer;',
    '}',
    '.a11y-toggle-row:last-child{border-bottom:none;padding-bottom:0;}',
    '.a11y-toggle-label{',
      'font-size:13.5px;color:#2d3a47;',
      'display:flex;align-items:center;gap:8px;',
      'user-select:none;',
    '}',
    '.a11y-t-icon{font-size:16px;width:22px;text-align:center;}',

    /* Toggle switch */
    '.a11y-switch{position:relative;width:40px;height:22px;flex-shrink:0;}',
    '.a11y-switch input{opacity:0;width:0;height:0;position:absolute;}',
    '.a11y-track{',
      'position:absolute;inset:0;background:#bcc8d4;border-radius:11px;',
      'cursor:pointer;transition:background .2s;',
    '}',
    '.a11y-track::after{',
      'content:"";position:absolute;top:3px;right:3px;',
      'width:16px;height:16px;background:#fff;border-radius:50%;',
      'transition:right .2s;box-shadow:0 1px 3px rgba(0,0,0,.2);',
    '}',
    '.a11y-switch input:checked+.a11y-track{background:#0057B7;}',
    '.a11y-switch input:checked+.a11y-track::after{right:calc(100% - 19px);}',
    '.a11y-switch input:focus-visible+.a11y-track{box-shadow:0 0 0 3px rgba(0,87,183,.5);}',

    /* Footer */
    '#a11y-panel-footer{',
      'padding:10px 12px 12px;border-top:1px solid #e5ecf3;',
      'display:flex;gap:8px;',
    '}',
    '.a11y-foot-btn{',
      'flex:1;padding:9px 6px;border-radius:9px;',
      'border:2px solid #d2dae4;background:#fff;',
      'cursor:pointer;font-size:13px;font-family:inherit;color:#2d3a47;',
      'transition:border-color .15s,background .15s;text-align:center;',
      'text-decoration:none;display:flex;align-items:center;justify-content:center;gap:5px;',
    '}',
    '.a11y-foot-btn:hover{border-color:#0057B7;background:#edf3ff;color:#0057B7;}',
    '.a11y-foot-btn:focus-visible{outline:3px solid #0057B7;outline-offset:2px;}',
    '#a11y-reset-btn{border-color:#d44;color:#d44;}',
    '#a11y-reset-btn:hover{background:#fff0f0;border-color:#c33;color:#c33;}',

    /* ── Reading Guide ──────────────────────────────────── */
    '#a11y-reading-guide{',
      'position:fixed;left:0;right:0;height:34px;',
      'background:rgba(0,87,183,.11);',
      'border-top:2px solid rgba(0,87,183,.38);',
      'border-bottom:2px solid rgba(0,87,183,.38);',
      'pointer-events:none;z-index:999994;display:none;',
    '}',

    /* ── Applied feature classes ────────────────────────── */

    /* Font size — applied on html root so rem units scale everywhere */
    'html.a11y-f1{font-size:115% !important;}',
    'html.a11y-f2{font-size:130% !important;}',
    'html.a11y-f3{font-size:150% !important;}',

    /* High contrast — exclude widget root */
    'body.a11y-high *:not(#a11y-widget-root):not(#a11y-widget-root *){',
      'background-color:#000 !important;color:#ff0 !important;border-color:#ff0 !important;',
    '}',
    'body.a11y-high a:not(#a11y-widget-root a):not(#a11y-widget-root *){color:#0ff !important;}',
    'body.a11y-high button:not(#a11y-widget-root *),',
    'body.a11y-high input:not(#a11y-widget-root *),',
    'body.a11y-high select:not(#a11y-widget-root *),',
    'body.a11y-high textarea:not(#a11y-widget-root *){',
      'background:#000 !important;color:#ff0 !important;border:2px solid #ff0 !important;',
    '}',
    'body.a11y-high img:not(#a11y-widget-root *){filter:contrast(1.3) brightness(1.1) !important;}',

    /* Dark contrast */
    'body.a11y-dark *:not(#a11y-widget-root):not(#a11y-widget-root *){',
      'background-color:#12121e !important;color:#ddd !important;border-color:#444 !important;',
    '}',
    'body.a11y-dark a:not(#a11y-widget-root a):not(#a11y-widget-root *){color:#6eb5ff !important;}',
    'body.a11y-dark img:not(#a11y-widget-root *){filter:brightness(.82) !important;}',

    /* Grayscale */
    'body.a11y-gray>*:not(#a11y-widget-root){filter:grayscale(100%);}',

    /* Stop animations */
    'body.a11y-no-anim *:not(#a11y-widget-root *),',
    'body.a11y-no-anim *:not(#a11y-widget-root *)::before,',
    'body.a11y-no-anim *:not(#a11y-widget-root *)::after{',
      'animation-duration:.001ms !important;animation-iteration-count:1 !important;',
      'transition-duration:.001ms !important;scroll-behavior:auto !important;',
    '}',

    /* Dyslexia font */
    'body.a11y-dyslexia *:not(#a11y-widget-root *){',
      'font-family:"Lexend",Arial,sans-serif !important;',
      'letter-spacing:.03em !important;word-spacing:.08em !important;line-height:1.75 !important;',
    '}',

    /* Highlight links */
    'body.a11y-links a:not(#a11y-widget-root *){',
      'outline:2px solid #0057B7 !important;text-decoration:underline !important;',
      'background:rgba(0,87,183,.09) !important;padding:1px 3px !important;border-radius:3px !important;',
    '}',

    /* Highlight headings */
    'body.a11y-heads h1:not(#a11y-widget-root *),body.a11y-heads h2:not(#a11y-widget-root *),',
    'body.a11y-heads h3:not(#a11y-widget-root *),body.a11y-heads h4:not(#a11y-widget-root *),',
    'body.a11y-heads h5:not(#a11y-widget-root *),body.a11y-heads h6:not(#a11y-widget-root *){',
      'outline:3px solid #e05500 !important;outline-offset:3px !important;',
      'background:rgba(224,85,0,.07) !important;',
    '}',

    /* Big cursor */
    'body.a11y-cursor,body.a11y-cursor *{',
      'cursor:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'48\' height=\'48\' viewBox=\'0 0 48 48\'%3E%3Cpath d=\'M6 4L6 42L18 30L24 46L32 43L26 29L40 29Z\' fill=\'%23000\' stroke=\'%23fff\' stroke-width=\'2\'/%3E%3C/svg%3E") 6 4,auto !important;',
    '}',

    /* Letter spacing */
    'body.a11y-lspacing p:not(#a11y-widget-root *),',
    'body.a11y-lspacing li:not(#a11y-widget-root *),',
    'body.a11y-lspacing span:not(#a11y-widget-root *),',
    'body.a11y-lspacing div:not(#a11y-widget-root *){',
      'letter-spacing:.12em !important;word-spacing:.16em !important;',
    '}',

    /* Line height */
    'body.a11y-lheight p:not(#a11y-widget-root *),',
    'body.a11y-lheight li:not(#a11y-widget-root *),',
    'body.a11y-lheight div:not(#a11y-widget-root *){',
      'line-height:1.9 !important;',
    '}',

    /* Enhanced focus */
    'body.a11y-focus *:not(#a11y-widget-root *):focus,',
    'body.a11y-focus *:not(#a11y-widget-root *):focus-visible{',
      'outline:4px solid #e05500 !important;outline-offset:3px !important;',
      'box-shadow:0 0 0 7px rgba(224,85,0,.25) !important;',
    '}',

    /* Responsive */
    '@media(max-width:400px){',
      '#a11y-panel{width:calc(100vw - 20px);',
      CONFIG.position === 'bottom-right' ? 'right:10px;' : 'left:10px;',
      'bottom:88px;}',
      '#a11y-btn{',
      CONFIG.position === 'bottom-right' ? 'right:16px;' : 'left:16px;',
      'bottom:18px;}',
    '}',

  ].join('');

  // ============================================================
  // HTML BUILDER
  // ============================================================
  function buildHTML() {
    return [
      /* Skip link */
      '<a id="a11y-skip-link" href="#main-content">דלג לתוכן הראשי</a>',

      /* Floating button */
      '<button id="a11y-btn"',
      ' aria-label="' + CONFIG.openBtnLabel + '"',
      ' aria-expanded="false"',
      ' aria-controls="a11y-panel"',
      ' title="' + CONFIG.widgetLabel + '"',
      '>',
        '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" fill="none">',
          '<!-- ראש -->',
          '<circle cx="50" cy="16" r="11" fill="white"/>',
          '<!-- גוף -->',
          '<line x1="50" y1="28" x2="50" y2="65" stroke="white" stroke-width="9" stroke-linecap="round"/>',
          '<!-- ידיים פרושות -->',
          '<line x1="12" y1="44" x2="88" y2="44" stroke="white" stroke-width="9" stroke-linecap="round"/>',
          '<!-- רגל שמאל -->',
          '<line x1="50" y1="65" x2="26" y2="92" stroke="white" stroke-width="9" stroke-linecap="round"/>',
          '<!-- רגל ימין -->',
          '<line x1="50" y1="65" x2="74" y2="92" stroke="white" stroke-width="9" stroke-linecap="round"/>',
        '</svg>',
      '</button>',

      /* Panel */
      '<div id="a11y-panel" role="dialog" aria-label="' + CONFIG.widgetTitle + '" aria-modal="false">',

        /* Header */
        '<div id="a11y-panel-header">',
          '<h2><span aria-hidden="true">♿</span>' + CONFIG.widgetTitle + '</h2>',
          '<button id="a11y-close-btn" aria-label="סגור">✕</button>',
        '</div>',

        /* Body */
        '<div id="a11y-panel-body">',

          /* Font size */
          '<div class="a11y-section">',
            '<div class="a11y-section-title">גודל טקסט</div>',
            '<div class="a11y-btn-group" role="group" aria-label="גודל טקסט">',
              makeOptBtn('fontSize', '0', '', 'רגיל', '14px'),
              makeOptBtn('fontSize', '1', '', 'גדול', '17px'),
              makeOptBtn('fontSize', '2', '', 'גדול מאוד', '20px'),
              makeOptBtn('fontSize', '3', '', 'ענק', '23px'),
            '</div>',
          '</div>',

          /* Contrast */
          '<div class="a11y-section">',
            '<div class="a11y-section-title">ניגודיות וצבע</div>',
            '<div class="a11y-btn-group" role="group" aria-label="מצב ניגודיות">',
              makeOptBtn('contrast', 'normal',    '☀️',  'רגיל'),
              makeOptBtn('contrast', 'high',      '🔆',  'גבוהה'),
              makeOptBtn('contrast', 'dark',      '🌙',  'כהה'),
              makeOptBtn('contrast', 'grayscale', '◑',  'אפור'),
            '</div>',
          '</div>',

          /* Toggles */
          '<div class="a11y-section">',
            '<div class="a11y-section-title">כלים נוספים</div>',
            makeToggle('stopAnimations',    '🎬', 'עצור אנימציות'),
            makeToggle('dyslexiaFont',      '📖', 'גופן לדיסלקציה'),
            makeToggle('highlightLinks',    '🔗', 'הדגש קישורים'),
            makeToggle('highlightHeadings', '📌', 'הדגש כותרות'),
            makeToggle('readingGuide',      '👁',  'מדריך קריאה'),
            makeToggle('bigCursor',         '🖱',  'סמן גדול'),
            makeToggle('letterSpacing',     'אב', 'מרווח אותיות'),
            makeToggle('lineHeight',        '≡',  'גובה שורה'),
            makeToggle('enhancedFocus',     '🎯', 'מיקוד מוגבר'),
          '</div>',

        '</div>', /* end body */

        /* Footer */
        '<div id="a11y-panel-footer">',
          '<button class="a11y-foot-btn" id="a11y-reset-btn" aria-label="איפוס כל ההגדרות">',
            '🔄 איפוס',
          '</button>',
          '<a class="a11y-foot-btn" href="' + CONFIG.statementUrl + '" target="_blank" rel="noopener">',
            '📋 הצהרת נגישות',
          '</a>',
        '</div>',

      '</div>', /* end panel */

      /* Reading guide */
      '<div id="a11y-reading-guide" aria-hidden="true"></div>',

    ].join('');
  }

  function makeOptBtn(action, value, icon, label, fontSize) {
    var style = fontSize ? ' style="font-size:' + fontSize + '"' : '';
    return [
      '<button class="a11y-opt-btn"',
      ' data-action="' + action + '"',
      ' data-value="' + value + '"',
      ' aria-pressed="false"',
      '>',
        icon ? '<span class="a11y-btn-icon" aria-hidden="true">' + icon + '</span>' : '',
        '<span class="a11y-btn-lbl"' + style + '>' + label + '</span>',
      '</button>',
    ].join('');
  }

  function makeToggle(id, icon, label) {
    return [
      '<label class="a11y-toggle-row" for="a11y-t-' + id + '">',
        '<span class="a11y-toggle-label">',
          '<span class="a11y-t-icon" aria-hidden="true">' + icon + '</span>',
          label,
        '</span>',
        '<span class="a11y-switch">',
          '<input type="checkbox" id="a11y-t-' + id + '" data-toggle="' + id + '"',
          ' role="switch" aria-label="' + label + '">',
          '<span class="a11y-track" aria-hidden="true"></span>',
        '</span>',
      '</label>',
    ].join('');
  }

  // ============================================================
  // STATE MANAGEMENT
  // ============================================================
  function loadState() {
    try {
      var saved = localStorage.getItem(CONFIG.storageKey);
      if (saved) {
        var parsed = JSON.parse(saved);
        var merged = {};
        for (var k in DEFAULTS) merged[k] = DEFAULTS[k];
        for (var k in parsed)   merged[k] = parsed[k];
        return merged;
      }
    } catch (e) {}
    return copyDefaults();
  }

  function saveState() {
    try { localStorage.setItem(CONFIG.storageKey, JSON.stringify(state)); } catch (e) {}
  }

  function copyDefaults() {
    var o = {};
    for (var k in DEFAULTS) o[k] = DEFAULTS[k];
    return o;
  }

  function resetState() {
    state = copyDefaults();
    saveState();
    applyAll();
    syncUI();
  }

  // ============================================================
  // APPLY SETTINGS TO DOM
  // ============================================================
  var CONTRAST_CLASSES = { high: 'a11y-high', dark: 'a11y-dark', grayscale: 'a11y-gray' };
  var TOGGLE_CLASSES = {
    stopAnimations:    'a11y-no-anim',
    dyslexiaFont:      'a11y-dyslexia',
    highlightLinks:    'a11y-links',
    highlightHeadings: 'a11y-heads',
    bigCursor:         'a11y-cursor',
    letterSpacing:     'a11y-lspacing',
    lineHeight:        'a11y-lheight',
    enhancedFocus:     'a11y-focus',
  };

  function applyAll() {
    var b = document.body;
    var r = document.documentElement;

    /* Font size — on html root so rem units scale everywhere */
    r.classList.remove('a11y-f1', 'a11y-f2', 'a11y-f3');
    if (state.fontSize > 0) r.classList.add('a11y-f' + state.fontSize);

    /* Contrast */
    b.classList.remove('a11y-high', 'a11y-dark', 'a11y-gray');
    if (state.contrast !== 'normal' && CONTRAST_CLASSES[state.contrast]) {
      b.classList.add(CONTRAST_CLASSES[state.contrast]);
    }

    /* Toggles */
    for (var key in TOGGLE_CLASSES) {
      b.classList.toggle(TOGGLE_CLASSES[key], !!state[key]);
    }

    /* Dyslexia font — load on demand */
    handleDyslexiaFont(state.dyslexiaFont);

    /* Reading guide */
    if (readingGuideEl) {
      readingGuideEl.style.display = state.readingGuide ? 'block' : 'none';
    }
  }

  function handleDyslexiaFont(enable) {
    if (enable && !dyslexiaFontLink) {
      dyslexiaFontLink = document.createElement('link');
      dyslexiaFontLink.rel = 'stylesheet';
      dyslexiaFontLink.href = 'https://fonts.googleapis.com/css2?family=Lexend:wght@400;600;700&display=swap';
      document.head.appendChild(dyslexiaFontLink);
    }
  }

  // ============================================================
  // SYNC UI TO STATE
  // ============================================================
  function syncUI() {
    /* Font size buttons */
    forEachQuery('[data-action="fontSize"]', function (btn) {
      var active = parseInt(btn.dataset.value) === state.fontSize;
      btn.classList.toggle('a11y-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    /* Contrast buttons */
    forEachQuery('[data-action="contrast"]', function (btn) {
      var active = btn.dataset.value === state.contrast;
      btn.classList.toggle('a11y-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    /* Toggle checkboxes */
    var toggleKeys = Object.keys(TOGGLE_CLASSES).concat(['readingGuide']);
    toggleKeys.forEach(function (key) {
      var el = document.getElementById('a11y-t-' + key);
      if (el) el.checked = !!state[key];
    });
  }

  // ============================================================
  // EVENTS
  // ============================================================
  function bindEvents() {
    var openBtn  = document.getElementById('a11y-btn');
    var closeBtn = document.getElementById('a11y-close-btn');
    var resetBtn = document.getElementById('a11y-reset-btn');
    var panel    = document.getElementById('a11y-panel');

    openBtn.addEventListener('click', togglePanel);
    closeBtn.addEventListener('click', closePanel);
    resetBtn.addEventListener('click', resetState);

    /* Close on outside click */
    document.addEventListener('click', function (e) {
      if (panelOpen && !panel.contains(e.target) && e.target !== openBtn) closePanel();
    });

    /* Close on Escape */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panelOpen) { closePanel(); openBtn.focus(); }
    });

    /* Font size buttons */
    forEachQuery('[data-action="fontSize"]', function (btn) {
      btn.addEventListener('click', function () {
        state.fontSize = parseInt(this.dataset.value, 10);
        saveState(); applyAll(); syncUI();
      });
    });

    /* Contrast buttons */
    forEachQuery('[data-action="contrast"]', function (btn) {
      btn.addEventListener('click', function () {
        state.contrast = this.dataset.value;
        saveState(); applyAll(); syncUI();
      });
    });

    /* Toggle checkboxes */
    forEachQuery('[data-toggle]', function (input) {
      input.addEventListener('change', function () {
        state[this.dataset.toggle] = this.checked;
        saveState(); applyAll();
      });
    });

    /* Reading guide — follow mouse */
    document.addEventListener('mousemove', function (e) {
      if (readingGuideEl && state.readingGuide) {
        readingGuideEl.style.top = (e.clientY - 17) + 'px';
      }
    });
  }

  // ============================================================
  // PANEL OPEN / CLOSE
  // ============================================================
  function togglePanel() { panelOpen ? closePanel() : openPanel(); }

  function openPanel() {
    panelOpen = true;
    document.getElementById('a11y-panel').classList.add('a11y-open');
    document.getElementById('a11y-btn').setAttribute('aria-expanded', 'true');
    setTimeout(function () { document.getElementById('a11y-close-btn').focus(); }, 30);
  }

  function closePanel() {
    panelOpen = false;
    document.getElementById('a11y-panel').classList.remove('a11y-open');
    document.getElementById('a11y-btn').setAttribute('aria-expanded', 'false');
  }

  // ============================================================
  // HELPERS
  // ============================================================
  function forEachQuery(selector, fn) {
    var els = document.querySelectorAll(selector);
    for (var i = 0; i < els.length; i++) fn(els[i]);
  }

  function ensureMainId() {
    if (!document.getElementById('main-content')) {
      var main = document.querySelector('main,[role="main"],#MainContent,.main-content,#shopify-section-main');
      if (main && !main.id) main.id = 'main-content';
    }
  }

  // ============================================================
  // INIT
  // ============================================================
  function init() {
    /* Inject CSS */
    var styleEl = document.createElement('style');
    styleEl.id = 'a11y-widget-css';
    styleEl.textContent = STYLES;
    document.head.appendChild(styleEl);

    /* Inject HTML */
    var root = document.createElement('div');
    root.id = 'a11y-widget-root';
    root.innerHTML = buildHTML();
    document.body.appendChild(root);

    /* Cache elements */
    readingGuideEl = document.getElementById('a11y-reading-guide');

    /* Restore saved settings */
    applyAll();
    syncUI();

    /* Bind events */
    bindEvents();

    /* Ensure main content landmark has an id for skip link */
    ensureMainId();
  }

  /* Run when DOM ready */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

}(window, document));
