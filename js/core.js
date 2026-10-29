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

  var base = 'themes/' + th.id + '/', q = '?v=' + th.v;
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

  // pemilih tampilan: hanya muncul bila ada lebih dari satu; otomatis dari registry
  function switcher() {
    if (T.length < 2) return;
    var st = add('style', { textContent: '.skins{position:fixed;left:12px;bottom:12px;z-index:60;display:flex;gap:4px;padding:4px;border-radius:999px;background:#111318;font:600 11px/1 ui-monospace,Menlo,monospace;letter-spacing:.06em;text-transform:uppercase}' +
      '.skins button{border:0;border-radius:999px;padding:8px 12px;background:none;color:#cfd3dc;cursor:pointer;font:inherit}.skins button[aria-pressed=true]{background:#fff;color:#111318}' });
    var nav = add('nav', { className: 'skins' }); nav.setAttribute('aria-label', 'Design');
    T.forEach(function (t) {
      var b = add('button', { type: 'button', textContent: t.name }); b.setAttribute('aria-pressed', t === th ? 'true' : 'false');
      b.onclick = function () {
        if (t === th) return;
        try { localStorage.setItem('afw-skin', t.id); } catch (e) {}
        var u = new URL(location.href); if (t === T[0]) u.searchParams.delete('skin'); else u.searchParams.set('skin', t.id);
        location.href = u.href;
      };
      nav.appendChild(b);
    });
    document.head.appendChild(st); document.body.appendChild(nav);
  }
})();
