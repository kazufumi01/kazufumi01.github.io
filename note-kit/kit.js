/* Study Note kit: moves a lab's existing elements into the notebook layout. The lab's own code (DSP, drawing, events) is untouched. */
(function () {
  var C = window.NK; if (!C) return;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var ja = C.lang !== 'en';
  var root = document.documentElement; root.classList.add('nk'); root.setAttribute('data-theme', 'light');
  var mq = matchMedia('(min-width:1100px) and (min-height:660px)');
  /* ---- header ---- */
  var head = document.createElement('header'); head.className = 'nk-head';
  head.innerHTML = '<div class="nk-brand"><span class="nk-eb">' + (ja ? 'Study Note' : 'Study Note') + '</span><h1>' + C.title + '<small>' + C.sub + '</small></h1></div>' +
    '<nav class="nk-nav">' + (C.links || []).map(function (l) { return '<a href="' + l[1] + '"' + (l[2] ? ' ' + l[2] : '') + '>' + l[0] + '</a>'; }).join('') + '</nav><div class="nk-tp"></div>';
  var tp = $('.nk-tp', head);
  [].concat(C.transport).forEach(function (q) { $$(q).forEach(function (el) { tp.appendChild(el); }); });
  /* ---- main ---- */
  var main = document.createElement('div'); main.className = 'nk-main';
  main.style.setProperty('--nk-areas', C.areas); main.style.setProperty('--nk-cols', C.cols); main.style.setProperty('--nk-rows', C.rows);
  if (C.cw) main.style.setProperty('--nk-cw', C.cw);
  var graphs = document.createElement('section'); graphs.className = 'nk-graphs';
  var ctrls = document.createElement('section'); ctrls.className = 'nk-ctrls nk-card';
  var notes = document.createElement('aside'); notes.className = 'nk-notes';
  var tabs = document.createElement('div'); tabs.className = 'nk-tabs'; tabs.setAttribute('role', 'tablist');
  var body = document.createElement('div'); body.className = 'nk-body';
  notes.appendChild(tabs); notes.appendChild(body);
  main.appendChild(graphs); main.appendChild(ctrls); main.appendChild(notes);
  document.body.insertBefore(head, document.body.firstChild);
  head.parentNode.insertBefore(main, head.nextSibling);
  var guide = [];
  C.graphs.forEach(function (g) {
    var el = typeof g.sel === 'string' ? $(g.sel) : g.sel(); if (!el) return;
    el.classList.add('nk-card'); el.style.gridArea = g.area; graphs.appendChild(el);
    (g.fill || []).forEach(function (s) {
      var cv = $(s, el); if (!cv) return;
      var w = document.createElement('div'); w.className = 'nk-cv'; cv.parentNode.insertBefore(w, cv); w.appendChild(cv);
    });
    var h = $('h2', el), parts = [];
    $$('.legend', el).forEach(function (lg) { parts.push('<div class="nk-leg">' + lg.innerHTML + '</div>'); });
    $$('p.note', el).forEach(function (p) { parts.push('<p>' + p.innerHTML + '</p>'); });
    if (g.guide) parts.push(g.guide);
    if (h && parts.length) guide.push('<section><h4>' + h.textContent + '</h4>' + parts.join('') + '</section>');
  });
  [].concat(C.ctrls).forEach(function (q) { $$(q).forEach(function (el) { ctrls.appendChild(el); }); });
  var panes = [];
  (C.notes || []).forEach(function (n) {
    var el = $(n.sel); if (!el) return;
    el.classList.add('nk-pane'); body.appendChild(el); panes.push({ el: el, label: n.label });
  });
  if (guide.length) {
    var gd = document.createElement('div'); gd.className = 'nk-pane nk-guide';
    gd.innerHTML = '<p class="eyebrow">How to read</p><h3>' + (ja ? 'グラフの読み方' : 'How to read the graphs') + '</h3>' + guide.join('');
    body.appendChild(gd); panes.splice(1, 0, { el: gd, label: ja ? '読み方' : 'Graphs' });
  }
  var ab = document.createElement('div'); ab.className = 'nk-pane nk-about';
  ab.innerHTML = '<p class="eyebrow">About</p><h3>' + (ja ? 'このページについて' : 'About this page') + '</h3>' + (C.lead ? '<p class="nk-lead">' + C.lead + '</p>' : '') +
    '<p>' + (ja ? 'PCでは一画面にグラフ・操作・解説を並べ、スマホでは縦にスクロールして読むノートとして使えます。DSPと機能は旧版と同じです。' : 'On desktop the graphs, controls and notes fit on one screen; on a phone it reads as a scrolling notebook. The DSP and features are the same as the previous version.') + '</p>';
  $$(C.about || '').forEach(function (el) { ab.appendChild(el); });
  body.appendChild(ab); panes.push({ el: ab, label: ja ? 'このページ' : 'About' });
  var cur = 0;
  function setTab(i) {
    cur = i; var pc = mq.matches;
    panes.forEach(function (p, k) { p.el.hidden = pc ? k !== i : false; });
    $$('button', tabs).forEach(function (b, k) { b.setAttribute('aria-selected', k === i); });
    body.scrollTop = 0;
  }
  panes.forEach(function (p, k) {
    var b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'tab'); b.textContent = p.label;
    b.addEventListener('click', function () { setTab(k); }); tabs.appendChild(b);
  });
  /* ---- mount ---- */
  $$(C.hide || '').forEach(function (el) { el.classList.add('nk-pc-hide'); el.style.display = 'none'; });
  setTab(0);
  mq.addEventListener ? mq.addEventListener('change', function () { setTab(cur); }) : mq.addListener(function () { setTab(cur); });
  /* first explanation pane: back to it when a control is used */
  ctrls.addEventListener('pointerdown', function () { if (mq.matches && cur !== 0) setTab(0); }, true);
  if (C.toEx) document.addEventListener('click', function (e) { if (mq.matches && cur !== 0 && e.target.closest && e.target.closest(C.toEx)) setTab(0); }, true);
  /* ---- 聴き比べ・見比べ：目立つ枠に入れて解説の冒頭へ ---- */
  function lift(pane) {
    if (pane.__nkBusy) return; pane.__nkBusy = true;
    $$('.nk-try', pane).forEach(function (b) { if (!b.isConnected) return; });
    var tr = (C.trySel ? $$(C.trySel, pane) : $$('.tries', pane)).filter(function (t) { return !t.closest('.nk-try'); });
    tr.forEach(function (t) {
      var box = document.createElement('div'); box.className = 'nk-try';
      var h = t.previousElementSibling; if (h && /^H4$/.test(h.tagName)) box.appendChild(h);
      else { var hh = document.createElement('h4'); hh.textContent = ja ? '聴き比べ・見比べ' : 'Listen & compare'; box.appendChild(hh); }
      t.parentNode.insertBefore(box, t); box.appendChild(t);
      var after = $(C.tryAfter || '.what', pane) || $('h3', pane);
      if (after && after.parentNode === box.parentNode) after.parentNode.insertBefore(box, after.nextSibling);
    });
    pane.__nkBusy = false;
  }
  if (panes[0]) { var p0 = panes[0].el; lift(p0); new MutationObserver(function () { lift(p0); }).observe(p0, { childList: true, subtree: false }); }
  /* ---- canvas sizes follow the card on PC ---- */
  window.NK_H = function (cv, h) {
    if (!mq.matches) return h; var w = cv.parentElement;
    return w && w.classList.contains('nk-cv') && w.clientHeight > 20 ? w.clientHeight : h;
  };
  var t = 0; function kick() { clearTimeout(t); t = setTimeout(function () { window.dispatchEvent(new Event('resize')); if (C.redraw) C.redraw(); }, 60); }
  if (window.ResizeObserver) { var ro = new ResizeObserver(kick); $$('.nk-cv').forEach(function (w) { ro.observe(w); }); }
  kick();
})();
