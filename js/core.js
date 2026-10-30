// inti ringan: API bersama (bahasa, mode gelap, warna aksen) untuk semua tampilan, lalu muat tampilan yang dipilih
(function () {
  var d = document.documentElement, AFW = window.AFW = {};
  function emit(name) { window.dispatchEvent(new CustomEvent('afw:' + name)); }

  // ---- bahasa: `en` hanya menimpa teks; sisanya (gambar, kontak, dll.) diambil dari `id`
  function merge(a, b) {
    if (b === undefined) return a;
    if (Array.isArray(a)) return a.map(function (x, i) { return merge(x, b[i]); });
    if (a && typeof a === 'object') {
      var o = {}; Object.keys(a).forEach(function (k) { o[k] = merge(a[k], b[k]); }); return o;
    }
    return b;
  }
  var LANGS = ['id', 'en'], lang = 'en';
  try { lang = new URLSearchParams(location.search).get('lang') || localStorage.getItem('afw-lang') || ''; } catch (e) {}
  if (LANGS.indexOf(lang) < 0) lang = 'en'; // default English
  function useLang(code) {
    lang = code; AFW.lang = code;
    AFW.site = code === 'id' ? window.SITE.id : merge(window.SITE.id, window.SITE[code]);
  }
  // URL mengikuti bahasa yang tampil: English (default) tanpa parameter, Indonesia pakai ?lang=id
  function syncUrl() {
    try {
      var u = new URL(location.href);
      if (lang === 'en') u.searchParams.delete('lang'); else u.searchParams.set('lang', lang);
      history.replaceState(null, '', u.pathname + u.search + u.hash);
    } catch (e) {}
  }
  useLang(lang); syncUrl();
  AFW.langs = LANGS;
  // ganti bahasa; tampilan mengisi ulang kontennya sendiri (dengar event `afw:lang` atau panggil ulang render-nya)
  AFW.setLang = function (code) {
    if (LANGS.indexOf(code) < 0) return;
    useLang(code);
    try { localStorage.setItem('afw-lang', code); } catch (e) {}
    syncUrl(); emit('lang');
  };

  // ---- mode gelap: pilihan tersimpan, diterapkan sebelum render oleh skrip kecil di <head>
  var metaTheme = document.querySelector('meta[name=theme-color]');
  function metaSync() { if (metaTheme) metaTheme.setAttribute('content', AFW.dark ? '#0a0b0f' : '#111318'); }
  Object.defineProperty(AFW, 'dark', { get: function () { return d.dataset.theme === 'dark'; } });
  metaSync();
  AFW.setDark = function (dark) {
    d.classList.add('theme-switch'); // tampilan boleh memakai kelas ini untuk mematikan transisi saat ganti tema
    if (dark) d.dataset.theme = 'dark'; else delete d.dataset.theme;
    metaSync();
    void d.offsetWidth;
    requestAnimationFrame(function () { requestAnimationFrame(function () { d.classList.remove('theme-switch'); }); });
    try { localStorage.setItem('afw-theme', dark ? 'dark' : 'light'); } catch (e) {}
    emit('theme');
  };

  // ---- warna aksen acak (hue bebas) dengan kontras setara biru awal #1D4ED8: lightness dicari per-hue supaya
  // luminans relatifnya ~0.10 (teks putih di atasnya tetap terbaca); tidak disimpan. Mengatur --ab dan --h (hue latar gelap).
  // AFW.accentRGB (0–1, sedikit lebih terang) untuk shader di latar hitam.
  AFW.accentRGB = [0.26, 0.42, 0.93];
  function hsl2rgb(h, s, l) {
    var a = s * Math.min(l, 1 - l);
    var f = function (n) { var k = (n + h / 30) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
    return [f(0), f(8), f(4)];
  }
  function lum(c) {
    var q = c.map(function (v) { return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * q[0] + 0.7152 * q[1] + 0.0722 * q[2];
  }
  function setHue(c) {
    var mx = Math.max(c[0], c[1], c[2]), mn = Math.min(c[0], c[1], c[2]), dd = mx - mn, hue = 0;
    if (dd) hue = mx === c[0] ? ((c[1] - c[2]) / dd) % 6 : mx === c[1] ? (c[2] - c[0]) / dd + 2 : (c[0] - c[1]) / dd + 4;
    d.style.setProperty('--h', Math.round(((hue * 60) + 360) % 360));
  }
  AFW.randomAccent = function () {
    var h = Math.random() * 360, sat = 0.72 + Math.random() * 0.12, lo = 0.12, hi = 0.65, rgb;
    for (var k = 0; k < 18; k++) {
      var mid = (lo + hi) / 2; rgb = hsl2rgb(h, sat, mid);
      if (lum(rgb) > 0.10) hi = mid; else lo = mid;
    }
    rgb = hsl2rgb(h, sat, (lo + hi) / 2);
    d.style.setProperty('--ab', 'rgb(' + rgb.map(function (v) { return Math.round(v * 255); }).join(' ') + ')');
    AFW.accentRGB = rgb.map(function (v) { return v + (1 - v) * 0.15; });
    setHue(rgb);
    d.classList.add('accent-picked');
    emit('accent');
  };

  // ---- tooltip: satu elemen .tip di <body> (gaya diatur tampilan), posisi dihitung JS; tampilan memanggil AFW.tip.bind(el)
  // dan mengisi atribut data-tip. Desktop (mouse): hover/fokus. Layar sentuh: tampilan memakai show/hide sendiri.
  var tipEl, tipFor = null;
  var canHover = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  function tipPlace() {
    if (!tipFor) return;
    var r = tipFor.getBoundingClientRect(), w = tipEl.offsetWidth, vw = d.clientWidth;
    var left = Math.max(8, Math.min(r.right - w, vw - w - 8));
    tipEl.style.left = left + 'px';
    tipEl.style.top = (r.top - tipEl.offsetHeight - 12) + 'px';
    tipEl.style.setProperty('--ax', Math.max(14, Math.min(w - 14, r.left + r.width / 2 - left)) + 'px');
  }
  // elemen bisa masih bergerak (animasi reveal), jadi posisi dilacak per frame ±1,3 dtk
  function tipTrack() { var t0 = performance.now(); (function f() { if (!tipFor || performance.now() - t0 > 1300) return; tipPlace(); requestAnimationFrame(f); })(); }
  AFW.canHover = canHover;
  AFW.tip = {
    show: function (b) {
      if (!tipEl) {
        tipEl = document.createElement('div'); tipEl.className = 'tip'; tipEl.setAttribute('role', 'tooltip'); tipEl.setAttribute('aria-hidden', 'true');
        document.body.appendChild(tipEl);
        window.addEventListener('scroll', tipPlace, { passive: true }); window.addEventListener('resize', tipPlace);
      }
      tipFor = b; tipEl.textContent = b.getAttribute('data-tip'); tipPlace(); tipEl.classList.add('on'); tipTrack();
    },
    hide: function (b) { if (tipFor === b) { tipFor = null; tipEl.classList.remove('on'); } },
    refresh: function (b) { if (tipFor === b) { tipEl.textContent = b.getAttribute('data-tip'); tipPlace(); } },
    bind: function (b) {
      if (!canHover) return;
      b.addEventListener('mouseenter', function () { AFW.tip.show(b); });
      b.addEventListener('mouseleave', function () { AFW.tip.hide(b); });
      b.addEventListener('focus', function () { if (b.matches(':focus-visible')) AFW.tip.show(b); });
      b.addEventListener('blur', function () { AFW.tip.hide(b); });
    }
  };

  // ---- pilih & muat tampilan
  var T = window.THEMES || [];
  var want = '';
  try { want = new URLSearchParams(location.search).get('skin') || localStorage.getItem('afw-skin') || ''; } catch (e) {}
  var th = T.filter(function (t) { return t.id === want; })[0] || T[0];
  d.dataset.skin = th.id;
  d.classList.add('js');
  // layar loader hanya untuk tampilan yang punya (th.loader), di kunjungan pertama per tab
  if (th.loader) { try { if (!sessionStorage.getItem('afw-seen')) d.classList.add('loading'); } catch (e) {} }
  // cadangan: kalau tampilan tidak memberi tanda siap (window.__rv), tampilkan semua konten
  setTimeout(function () { if (!window.__rv) d.classList.remove('js', 'loading'); }, 2500);

  // URL mengikuti tampilan: yang pertama (default) tanpa parameter
  try {
    var u = new URL(location.href);
    if (th === T[0]) u.searchParams.delete('skin'); else u.searchParams.set('skin', th.id);
    history.replaceState(null, '', u.pathname + u.search + u.hash);
  } catch (e) {}

  // `dir`: tampilan boleh memakai berkas tampilan lain (varian CSS); bedakan lewat html[data-skin=<id>]
  var base = 'themes/' + (th.dir || th.id) + '/', q = '?v=' + th.v;
  function add(tag, attrs) { var e = document.createElement(tag); for (var k in attrs) e[k] = attrs[k]; return e; }

  // CSS, markup, dan skrip diminta bersamaan supaya tidak berantai
  if (th.fonts) document.head.appendChild(add('link', { rel: 'stylesheet', href: th.fonts }));
  document.head.appendChild(add('link', { rel: 'stylesheet', href: base + 'style.css' + q }));
  document.head.appendChild(add('link', { rel: 'preload', as: 'script', href: base + 'main.js' + q }));
  fetch(base + 'body.html' + q).then(function (r) { if (!r.ok) throw 0; return r.text(); }).then(function (html) {
    document.body.insertAdjacentHTML('afterbegin', html);
    var s = add('script', { src: base + 'main.js' + q }); s.async = false;
    document.body.appendChild(s);
    switcher();
  }).catch(function () { d.classList.remove('js', 'loading'); });

  // pemilih tampilan: tombol "Layout" + panel kartu berisi thumbnail tiap tampilan (dari registry); hanya bila ada lebih dari satu.
  // Komponen inti dengan gaya dasar netral yang mengikuti mode gelap; tiap tampilan boleh menimpanya lewat html[data-skin=..] .lp*
  // (lihat akhir themes/neo/style.css). Ajakan sekali per sesi di awal.
  // tampilan bisa minta tombol Layout diangkat (mis. saat ada strip sticky di dasar layar HP): AFW.dock(true/false)
  var lpRoot = null, lifted = false;
  AFW.dock = function (on) { lifted = !!on; if (lpRoot) lpRoot.classList.toggle('lift', lifted); };
  function switcher() {
    if (T.length < 2) return;
    var css =
      '.lp{position:fixed;z-index:60;right:14px;bottom:14px;font:600 13px/1 -apple-system,BlinkMacSystemFont,"Inter",system-ui,sans-serif;color:#14161c;--lp-bg:rgba(255,255,255,.82);--lp-brd:rgba(20,22,28,.14);--lp-mut:rgba(20,22,28,.6)}' +
      'html[data-theme=dark] .lp{color:#f2f4f8;--lp-bg:rgba(24,26,36,.82);--lp-brd:rgba(255,255,255,.16);--lp-mut:rgba(242,244,248,.6)}' +
      '.lp *{box-sizing:border-box}' +
      '.lp-btn,.lp-panel,.lp-tip{background:var(--lp-bg);border:1px solid var(--lp-brd);box-shadow:0 10px 30px -10px rgba(0,0,0,.35);-webkit-backdrop-filter:blur(18px) saturate(160%);backdrop-filter:blur(18px) saturate(160%)}' +
      '.lp-btn{display:flex;align-items:center;gap:8px;height:42px;padding:0 16px 0 12px;border-radius:999px;color:inherit;font:inherit;cursor:pointer}' +
      '.lp-btn svg{width:18px;height:18px}' +
      '.lp-panel{position:absolute;right:0;bottom:54px;width:min(380px,calc(100vw - 28px));padding:12px;border-radius:20px;display:none;grid-template-columns:1fr 1fr;gap:10px}' +
      '.lp.open .lp-panel{display:grid;animation:lp-in .22s cubic-bezier(.16,1,.3,1)}' +
      '.lp-h{grid-column:1/-1;margin:4px 4px 0;font-size:15px;font-weight:600;letter-spacing:-.01em}' +
      '.lp-s{grid-column:1/-1;margin:0 4px 4px;font-size:12.5px;font-weight:500;color:var(--lp-mut)}' +
      '.lp-card{display:flex;flex-direction:column;gap:8px;padding:6px 6px 10px;border:2px solid transparent;border-radius:14px;background:none;color:inherit;font:inherit;text-align:left;cursor:pointer;transition:background .2s,border-color .2s}' +
      '.lp-card{position:relative}.lp-card::after{content:"";position:absolute;inset:-7px}' + // area hover menutup celah antar kartu (gap 10px + border) agar sorotan tidak mati-nyala saat mouse melintas
      '.lp-card:hover{background:rgba(127,127,127,.12)}.lp-card[aria-current=true]{border-color:#2f6df6}' +
      '.lp-card img{width:100%;height:auto;aspect-ratio:16/10;object-fit:cover;object-position:top;border-radius:9px;display:block;border:1px solid var(--lp-brd);background:rgba(127,127,127,.15)}' +
      '.lp-card span{padding:0 4px}' +
      '.lp-tip{position:absolute;right:0;bottom:54px;white-space:nowrap;padding:9px 14px;border-radius:12px;font-weight:500;opacity:0;transform:translateY(6px);pointer-events:none;transition:opacity .25s,transform .3s cubic-bezier(.16,1,.3,1)}' +
      '.lp-tip.on{opacity:1;transform:none}.lp.open .lp-tip{display:none}' +
      '@keyframes lp-in{from{opacity:0;transform:translateY(8px) scale(.98)}}' +
      '@media (max-width:640px){.lp{bottom:calc(14px + env(safe-area-inset-bottom));transition:bottom .3s cubic-bezier(.16,1,.3,1)}.lp.lift{bottom:calc(76px + env(safe-area-inset-bottom))}.lp-btn span{display:none}.lp-btn{width:42px;padding:0;justify-content:center}}' +
      '@media (prefers-reduced-motion:reduce){.lp-panel,.lp-tip{animation:none;transition:none}}' +
      'html.skin-leave body{opacity:0;transition:opacity .22s ease}';
    var st = add('style', { textContent: css });
    var root = lpRoot = add('div', { className: 'lp' + (lifted ? ' lift' : '') });
    var btn = add('button', { type: 'button', className: 'lp-btn' });
    btn.setAttribute('aria-haspopup', 'true'); btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/></svg><span>Layout</span>';
    var panel = add('div', { className: 'lp-panel', role: 'dialog' }); panel.setAttribute('aria-label', 'Layout');
    // judul panel & thumbnail mengikuti bahasa dan mode terang/gelap yang sedang aktif
    var TXT = { id: ['Pilih tampilan favoritmu', 'Isi sama, gaya beda. Coba saja.', 'Coba tampilan lain ↓'],
                en: ['Pick a look you like', 'Same content, different style. Try one.', 'Try another layout ↓'] };
    var head = add('div', { className: 'lp-h' }), sub = add('div', { className: 'lp-s' }), imgs = [];
    panel.appendChild(head); panel.appendChild(sub);
    T.forEach(function (t) {
      var c = add('button', { type: 'button', className: 'lp-card' }); if (t === th) c.setAttribute('aria-current', 'true');
      c.innerHTML = (t.thumb ? '<img alt="" loading="lazy" width="480" height="300">' : '') + '<span>' + t.name + '</span>';
      if (t.thumb) imgs.push({ el: c.querySelector('img'), t: t });
      c.onclick = function () {
        if (t === th) { close(); return; }
        try { localStorage.setItem('afw-skin', t.id); } catch (e) {}
        var u = new URL(location.href); if (t === T[0]) u.searchParams.delete('skin'); else u.searchParams.set('skin', t.id);
        d.classList.add('skin-leave'); setTimeout(function () { location.href = u.href; }, 230);
      };
      panel.appendChild(c);
    });
    var tip = add('div', { className: 'lp-tip' });
    tip.setAttribute('aria-hidden', 'true');
    function texts() { var x = TXT[AFW.lang] || TXT.en; head.textContent = x[0]; sub.textContent = x[1]; tip.textContent = x[2]; }
    function thumbs() { imgs.forEach(function (o) { o.el.src = ((AFW.dark && o.t.thumbDark) || o.t.thumb) + '?v=' + o.t.v; }); }
    texts(); thumbs();
    window.addEventListener('afw:lang', texts); window.addEventListener('afw:theme', thumbs);
    root.appendChild(tip); root.appendChild(panel); root.appendChild(btn);
    function open() { root.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); }
    function close() { root.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
    btn.onclick = function () { root.classList.contains('open') ? close() : open(); };
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    document.addEventListener('pointerdown', function (e) { if (!root.contains(e.target)) close(); });
    document.head.appendChild(st); document.body.appendChild(root);
    // ajakan sekali per sesi, beberapa detik setelah halaman siap
    try { if (sessionStorage.getItem('afw-lp-tip')) return; sessionStorage.setItem('afw-lp-tip', '1'); } catch (e) { return; }
    setTimeout(function () { tip.classList.add('on'); setTimeout(function () { tip.classList.remove('on'); }, 5000); }, 3500);
  }
})();
