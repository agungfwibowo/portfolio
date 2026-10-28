(function () {
  // bahasa: `en` hanya menimpa teks; sisanya (gambar, kontak, dll.) diambil dari `id`
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

  var SITE, A, UI, DATA = {};
  function useLang(code) {
    lang = code;
    SITE = code === 'id' ? window.SITE.id : merge(window.SITE.id, window.SITE[code]);
    A = SITE.assets; UI = SITE.ui;
    DATA.jobs = SITE.jobs;
    DATA.pros = SITE.projects.map(function (p, i) {
      var no = (i < 9 ? '0' : '') + (i + 1);
      return Object.assign({}, p, { no: no, label: no + ' · ' + p.cat });
    });
  }
  useLang(lang);

  // URL mengikuti bahasa yang tampil: English (default) tanpa parameter, Indonesia pakai ?lang=id
  function syncUrl() {
    try {
      var u = new URL(location.href);
      if (lang === 'en') u.searchParams.delete('lang'); else u.searchParams.set('lang', lang);
      history.replaceState(null, '', u.pathname + u.search + u.hash);
    } catch (e) {}
  }
  syncUrl();

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var CFG = { jobs: { dur: 6000 }, pros: { dur: 5000 } };
  var state = {
    jobs: { i: 0, t: 0, paused: reduce, seen: false },
    pros: { i: 0, t: 0, paused: reduce, seen: false }
  };
  var ICON_PAUSE = '<svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="2" x2="4" y2="10"/><line x1="8" y1="2" x2="8" y2="10"/></svg>';
  var ICON_PLAY = '<svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M3 1.5 L10.5 6 L3 10.5 Z"/></svg>';

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function buildList(key) {
    var list = document.querySelector('[data-list="' + key + '"]');
    DATA[key].forEach(function (d, k) {
      var b = el('button', 'tab ' + (key === 'jobs' ? 'job' : 'pro'));
      b.type = 'button'; b.setAttribute('role', 'tab');
      b.innerHTML = key === 'jobs'
        ? '<span class="period">' + esc(d.period) + '</span><span class="co">' + esc(d.company) + '</span>'
        : '<span class="no">' + esc(d.no) + '</span><span class="nm"><b>' + esc(d.name) + '</b><small>' + esc(d.cat) + '</small></span>';
      b.addEventListener('click', function () { pick(key, k); });
      b.addEventListener('keydown', function (e) {
        var n = DATA[key].length, j = null;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') j = (k + 1) % n;
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') j = (k - 1 + n) % n;
        if (j !== null) { e.preventDefault(); pick(key, j); list.children[j].focus(); }
      });
      list.appendChild(b);
    });
  }

  function render(key) {
    var s = state[key], d = DATA[key][s.i];
    var tabs = document.querySelector('[data-list="' + key + '"]').children;
    for (var k = 0; k < tabs.length; k++) {
      tabs[k].setAttribute('aria-selected', k === s.i ? 'true' : 'false');
      tabs[k].tabIndex = k === s.i ? 0 : -1;
    }
    scrollTab(tabs[0].parentNode, tabs[s.i]);
    document.querySelectorAll('[data-f^="' + key + '."]').forEach(function (n) {
      n.textContent = d[n.getAttribute('data-f').split('.')[1]];
    });
    if (key === 'pros') {
      var hero = document.querySelector('[data-hero]');
      hero.src = A + d.imgs[0]; hero.alt = d.name + ' — ' + UI.mainView; hero.decoding = 'async';
      var th = document.querySelector('[data-thumbs]'); th.innerHTML = '';
      d.imgs.slice(1).forEach(function (src, k) {
        var im = el('img', 'shot'); im.src = A + src; im.alt = d.name + ' — ' + UI.view + ' ' + (k + 2); im.loading = 'lazy'; im.decoding = 'async'; th.appendChild(im);
      });
    }
    renderCtrl(key);
    animateIn(key);
    if (key === 'pros') preload((s.i + 1) % DATA.pros.length);
  }

  // transisi isi panel saat berganti tab: muncul berurutan, halus
  var PARTS = { jobs: '.job-panel .when, .job-panel h3, .job-panel .role, .job-panel .desc', pros: '.pro-top, .shot.hero, .thumbs, .meta' };
  function animateIn(key) {
    if (reduce || !Element.prototype.animate) return;
    document.querySelectorAll(PARTS[key]).forEach(function (n, i) {
      n.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }],
        { duration: 450, delay: i * 60, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
    });
  }

  // di mobile tablist berupa strip horizontal: geser tab aktif ke kiri strip, tanpa menggulir halaman
  function scrollTab(list, tab) {
    if (list.scrollWidth <= list.clientWidth) return;
    var left = list.scrollLeft + tab.getBoundingClientRect().left - list.getBoundingClientRect().left - (parseFloat(getComputedStyle(list).paddingLeft) || 0);
    list.scrollTo({ left: left, behavior: reduce ? 'auto' : 'smooth' });
  }

  function edges(list) {
    var max = list.scrollWidth - list.clientWidth;
    list.classList.toggle('fl', list.scrollLeft > 2);
    list.classList.toggle('fr', list.scrollLeft < max - 2);
  }

  // muat gambar proyek berikutnya saja, bukan semuanya sekaligus
  function preload(k) { DATA.pros[k].imgs.forEach(function (src) { var i = new Image(); i.src = A + src; }); }

  function renderCtrl(key) {
    var b = document.querySelector('[data-ctrl="' + key + '"]'), p = state[key].paused;
    b.innerHTML = p ? ICON_PLAY + UI.play : ICON_PAUSE + UI.pause;
    b.setAttribute('aria-label', p ? UI.ariaPlay : UI.ariaPause);
  }

  function select(key, k) { state[key].i = k; state[key].t = 0; render(key); bar(key); }
  // dipilih user (klik / panah): autoplay istirahat 1 menit supaya isi tab sempat dibaca, lalu jalan lagi
  var HOLD = 60000;
  function pick(key, k) { state[key].hold = performance.now() + HOLD; select(key, k); }
  function bar(key) {
    document.querySelector('[data-bar="' + key + '"]').style.width = Math.min(100, state[key].t / CFG[key].dur * 100) + '%';
  }

  // isi konten statis dari window.SITE (js/data.js)
  function get(path) { return path.split('.').reduce(function (o, k) { return o && o[k]; }, SITE); }
  function icon(key) {
    var d = key && window.ICONS && window.ICONS[key];
    return d ? '<svg class="ico" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" fill-rule="evenodd"><path d="' + d + '"/></svg>' : '';
  }
  function fillStatic() {
    var P = SITE.profile, C = SITE.contact;
    document.querySelectorAll('[data-t]').forEach(function (n) { n.textContent = get(n.getAttribute('data-t')); });
    document.querySelectorAll('[data-lines]').forEach(function (n) {
      var v = n.getAttribute('data-lines').split(',');
      var lines = v.length > 1 ? v.map(get) : get(v[0]);
      n.innerHTML = lines.map(esc).join('<br>');
    });
    document.querySelector('[data-headline]').innerHTML =
      '<span class="hl">' + esc(P.headline.highlight) + '</span> ' + esc(P.headline.rest) + '<br>' + esc(P.headline.line2);
    document.querySelector('[data-roles]').innerHTML = P.roles.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('');
    document.querySelectorAll('[data-mail]').forEach(function (m) { m.href = 'mailto:' + C.email; m.textContent = C.email; });
    var ct = UI.cta.title;
    document.querySelector('[data-cta-title]').innerHTML = esc(ct[0]) + ' <b class="cta-mark" aria-hidden="true">' + esc(get('profile.mark')) + '</b><br><span class="cta-hl">' + esc(ct[1]) + '</span>';
    var tel = document.querySelector('[data-tel]'); tel.href = 'tel:' + C.phone.replace(/[^+\d]/g, ''); tel.textContent = C.phone;
    var k = 0, cls = { dark: 'pill dark', light: 'pill', ai: 'pill ai' };
    document.querySelector('[data-list="jobs"]').setAttribute('aria-label', UI.jobsList);
    document.querySelector('[data-list="pros"]').setAttribute('aria-label', UI.prosList);
    var lb = document.querySelector('[data-lang]'); lb.textContent = UI.lang; lb.setAttribute('aria-label', UI.langAria);
    document.documentElement.lang = lang; document.title = SITE.meta.title;
    var PLUS = '<svg class="tape-plus" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c.7 6.4 5.6 11.3 12 12-6.4.7-11.3 5.6-12 12-.7-6.4-5.6-11.3-12-12C6.4 11.3 11.3 6.4 12 0z"/></svg>';
    var groups = SITE.skills.groups, list = groups.filter(function (g) { return !g.marquee; });
    document.querySelector('[data-skills]').innerHTML = list.map(function (g) {
      return '<div class="group"><span class="group-label' + (g.style === 'ai' ? ' accent' : '') + '">' + esc(g.label) + '</span><ul class="pills">' +
        g.items.map(function (it) { return '<li class="' + cls[g.style] + ' r' + (k++ % 8 + 1) + '">' + icon(it.icon) + esc(it.name) + '</li>'; }).join('') + '</ul></div>';
    }).join('');
    // grup dengan marquee: true jadi pita berjalan; isi digandakan agar loop mulus, salinan kedua disembunyikan dari pembaca layar
    var tapes = groups.filter(function (g) { return g.marquee; }), tapesEl = document.querySelector('[data-tapes]');
    tapesEl.hidden = !tapes.length;
    tapesEl.innerHTML = tapes.map(function (g) {
      // ulangi item dalam satu segmen (min. 12) supaya segmen selalu lebih lebar dari pita, tanpa celah kosong
      var reps = Math.ceil(12 / g.items.length), one = g.items.map(function (it) { return '<span class="tape-item">' + icon(it.icon) + esc(it.name) + '</span>' + PLUS; }).join('');
      var seg = new Array(reps + 1).join(one);
      return '<div class="tape-zone tape-' + g.style + '"><span class="group-label tape-title">' + esc(g.label) + '</span>' +
        '<div class="tape" style="--mq-dur:' + (g.items.length * reps * 4) + 's"><div class="tape-track"><div class="tape-seg">' + seg +
        '</div><div class="tape-seg" aria-hidden="true">' + seg + '</div></div></div></div>';
    }).join('');
    document.querySelector('.skills-list').hidden = !list.length;
    // baris foto di grid mobile: pita di baris 1, grup biasa sesudahnya; foto sebaris dengan grup terakhir,
    // atau di baris sendiri di bawah pita kalau semua grup berupa pita
    var off = tapes.length ? 1 : 0;
    var wrap = document.querySelector('.skills-wrap');
    wrap.style.setProperty('--pr', list.length ? list.length + off : off + 1);
    wrap.classList.toggle('only-tapes', !list.length);
    var ph = SITE.skills.photo, img = document.querySelector('[data-photo]');
    img.src = A + ph.src; img.alt = ph.alt; img.width = ph.width; img.height = ph.height;
    img.setAttribute('aria-label', UI.photoLink);
    img.setAttribute('data-cursor', UI.cursorIn);
    var st = document.querySelectorAll('.stickers .st'), sk = SITE.skills.stickers;
    st.forEach(function (n, i) { var v = sk[i] || ''; n.innerHTML = (Array.isArray(v) ? v : [v]).map(esc).join('<br>'); });
    document.querySelectorAll('[data-in]').forEach(function (li) { li.href = C.linkedin; li.textContent = UI.linkedin; });
    document.querySelectorAll('[data-wa]').forEach(function (w) { w.href = 'https://wa.me/' + C.whatsapp.replace(/\D/g, '') + '?text=' + encodeURIComponent(UI.waText); w.textContent = UI.whatsapp; });
  }
  fillStatic();

  ['jobs', 'pros'].forEach(function (key) {
    buildList(key); render(key); bar(key);
    document.querySelector('[data-ctrl="' + key + '"]').addEventListener('click', function () {
      state[key].paused = !state[key].paused; renderCtrl(key);
    });
    var list = document.querySelector('[data-list="' + key + '"]');
    // autoplay berhenti sementara selama kursor di atas daftar tab (mouse saja, bukan sentuhan)
    list.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') state[key].hover = true; });
    list.addEventListener('pointerleave', function () { state[key].hover = false; });
    list.addEventListener('scroll', function () { edges(list); }, { passive: true });
    window.addEventListener('resize', function () { edges(list); });
    edges(list);
  });

  // tinggi panel slider hanya boleh naik (min-height = tertinggi yang pernah terlihat), supaya tidak loncat tiap ganti slide;
  // diulang dari nol hanya kalau lebar panel berubah (rotasi/resize), bukan saat URL bar HP muncul-hilang
  if ('ResizeObserver' in window) {
    ['.job-panel', '.pro-panel'].forEach(function (sel) {
      var p = document.querySelector(sel); if (!p) return;
      var maxH = 0, lastW = 0;
      new ResizeObserver(function () {
        var w = p.clientWidth;
        if (w !== lastW) { lastW = w; maxH = 0; p.style.minHeight = ''; }
        var h = p.getBoundingClientRect().height;
        if (h > maxH + 0.5) { maxH = h; p.style.minHeight = maxH + 'px'; }
      }).observe(p);
    });
  }

  // toggle warna / mono untuk screenshot proyek (default mono), diingat di browser
  var toneBtn = document.querySelector('[data-tone]'), proPanel = document.querySelector('.pro-panel');
  var ICON_TONE = '<svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12"><circle cx="6" cy="6" r="5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M6 1a5 5 0 0 1 0 10z" fill="currentColor"/></svg>';
  function setTone(mono) {
    proPanel.classList.toggle('mono', mono);
    toneBtn.setAttribute('aria-pressed', mono ? 'true' : 'false');
    toneBtn.innerHTML = ICON_TONE + (mono ? UI.mono : UI.color);
    toneBtn.setAttribute('aria-label', mono ? UI.ariaColor : UI.ariaMono);
    try { localStorage.setItem('afw-tone', mono ? 'mono' : 'warna'); } catch (e) {}
  }
  var savedTone = null;
  try { savedTone = localStorage.getItem('afw-tone'); } catch (e) {}
  setTone(savedTone !== 'warna'); // default mono
  toneBtn.addEventListener('click', function () { setTone(!proPanel.classList.contains('mono')); });

  // warna aksen acak (hue bebas: merah, hijau, oranye, biru, ...) dengan kontras setara biru awal #1D4ED8:
  // lightness dicari per-hue supaya luminans relatifnya ~0.10 (teks putih di atasnya tetap terbaca); tidak disimpan.
  // accentRGB dipakai shader kain (sedikit lebih terang karena latarnya hitam)
  var accentRGB = [0.26, 0.42, 0.93];
  function hsl2rgb(h, s, l) {
    var a = s * Math.min(l, 1 - l);
    var f = function (n) { var k = (n + h / 30) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
    return [f(0), f(8), f(4)];
  }
  function lum(c) {
    var q = c.map(function (v) { return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * q[0] + 0.7152 * q[1] + 0.0722 * q[2];
  }
  document.querySelector('[data-accent]').addEventListener('click', function () {
    var h = Math.random() * 360, sat = 0.72 + Math.random() * 0.12, lo = 0.12, hi = 0.65, rgb;
    for (var k = 0; k < 18; k++) {
      var mid = (lo + hi) / 2; rgb = hsl2rgb(h, sat, mid);
      if (lum(rgb) > 0.10) hi = mid; else lo = mid;
    }
    rgb = hsl2rgb(h, sat, (lo + hi) / 2);
    document.documentElement.style.setProperty('--ab', 'rgb(' + rgb.map(function (v) { return Math.round(v * 255); }).join(' ') + ')');
    accentRGB = rgb.map(function (v) { return v + (1 - v) * 0.15; });
    setHue(rgb);
    document.documentElement.classList.add('accent-picked');
  });

  // tema gelap: hue latar mengikuti aksen; toggle menyimpan pilihan
  function setHue(c) {
    var mx = Math.max(c[0], c[1], c[2]), mn = Math.min(c[0], c[1], c[2]), d = mx - mn, hue = 0;
    if (d) hue = mx === c[0] ? ((c[1] - c[2]) / d) % 6 : mx === c[1] ? (c[2] - c[0]) / d + 2 : (c[0] - c[1]) / d + 4;
    document.documentElement.style.setProperty('--h', Math.round(((hue * 60) + 360) % 360));
  }
  var themeBtn = document.querySelector('[data-theme-toggle]'), metaTheme = document.querySelector('meta[name=theme-color]');
  function applyTheme(dark) {
    if (dark) document.documentElement.dataset.theme = 'dark'; else delete document.documentElement.dataset.theme;
    themeBtn.setAttribute('aria-pressed', dark ? 'true' : 'false');
    if (metaTheme) metaTheme.setAttribute('content', dark ? '#0a0b0f' : '#111318');
  }
  applyTheme(document.documentElement.dataset.theme === 'dark');
  themeBtn.addEventListener('click', function () {
    var dark = document.documentElement.dataset.theme !== 'dark', root = document.documentElement;
    root.classList.add('theme-switch');
    applyTheme(dark);
    void root.offsetWidth;
    requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.remove('theme-switch'); }); });
    try { localStorage.setItem('afw-theme', dark ? 'dark' : 'light'); } catch (e) {}
  });

  // ganti bahasa: isi ulang konten tanpa reload, posisi tab tetap
  document.querySelector('[data-lang]').addEventListener('click', function () {
    useLang(lang === 'id' ? 'en' : 'id');
    try { localStorage.setItem('afw-lang', lang); } catch (e) {}
    syncUrl();
    fillStatic();
    document.querySelectorAll('.group').forEach(function (g) { g.classList.add('rv', 'in'); }); // grup baru tidak perlu reveal ulang
    ['jobs', 'pros'].forEach(function (key) {
      document.querySelector('[data-list="' + key + '"]').innerHTML = '';
      buildList(key); render(key);
    });
    setTone(proPanel.classList.contains('mono'));
  });

  // rotasi hanya berjalan saat section terlihat minimal menutupi 40% tinggi layar, di desktop & mobile
  // (section yang lebih pendek dari itu cukup terlihat utuh)
  var secs = ['jobs', 'pros'].map(function (key) {
    return { key: key, el: document.querySelector('[data-list="' + key + '"]').closest('section') };
  });
  var vTick = false;
  var checkSeen = function () {
    vTick = false;
    var vh = window.innerHeight;
    secs.forEach(function (o) {
      var r = o.el.getBoundingClientRect();
      var vis = Math.min(r.bottom, vh) - Math.max(r.top, 0);
      state[o.key].seen = vis >= Math.min(vh * 0.4, r.height) - 1;
    });
  };
  var onSeen = function () { if (!vTick) { vTick = true; requestAnimationFrame(checkSeen); } };
  window.addEventListener('scroll', onSeen, { passive: true });
  window.addEventListener('resize', onSeen);
  checkSeen();

  // reveal saat scroll: elemen yang masuk layar bersamaan muncul berurutan
  // daftar selector sama dengan di css/style.css
  var RV = '.mark, .id p, .title h1, .roles, .years, .tagline p, .sec-head, .tabs-wrap, .half > *, .skills-head > *, .group, .skills-photo, .stickers, .plus, .cta-in';
  var rvs = document.querySelectorAll(RV);
  window.__rv = true;
  function startReveal() {
  if (!('IntersectionObserver' in window) || reduce) {
    rvs.forEach(function (n) { n.classList.add('in'); });
  } else {
    var rio = new IntersectionObserver(function (entries) {
      var n = 0;
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.style.setProperty('--d', (0.1 + n++ * 0.12) + 's');
        e.target.classList.add('in'); rio.unobserve(e.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    rvs.forEach(function (n) { n.classList.add('rv'); rio.observe(n); });
  }
  }

  // loader: hitung 0–100% dari font + gambar non-lazy, minimal 700ms, maksimal 2.5s
  var root = document.documentElement;
  if (root.classList.contains('loading')) {
    var t0 = performance.now(), v = 0, loaded = 0, pageDone = false;
    var pctEl = document.querySelector('[data-pct]'), line = document.querySelector('.loader i');
    var imgs = Array.prototype.filter.call(document.images, function (im) { return im.loading !== 'lazy'; });
    var total = imgs.length + 1;
    var bump = function () { loaded++; };
    imgs.forEach(function (im) {
      if (im.complete) bump(); else { im.addEventListener('load', bump); im.addEventListener('error', bump); }
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(bump); else bump();
    if (document.readyState === 'complete') pageDone = true; else window.addEventListener('load', function () { pageDone = true; });

    var step = function (now) {
      var el = now - t0;
      var target = (pageDone || el > 2500) ? 100 : Math.min(99, loaded / total * 100);
      v = Math.min(target, v + Math.max(0.6, (target - v) * 0.1));
      pctEl.textContent = Math.round(v) + '%';
      line.style.setProperty('--p', v / 100);
      if (v >= 100 && el >= 700) return finish();
      requestAnimationFrame(step);
    };
    var finish = function () {
      root.classList.add('loaded');
      try { sessionStorage.setItem('afw-seen', '1'); } catch (e) {}
      setTimeout(function () {
        root.classList.remove('loading', 'loaded');
        var l = document.querySelector('.loader'); if (l) l.remove();
      }, 500);
      startReveal();
    };
    requestAnimationFrame(step);
  } else {
    startReveal();
  }

  // ukuran kotak grid: tetap persegi ~28px, tapi dibagi rata ke lebar section supaya tepi kiri & kanan tidak terpotong
  var fitGrid = function (el) {
    var w = el.clientWidth; if (!w) return;
    el.style.setProperty('--cell', (w / Math.max(1, Math.round(w / 28))).toFixed(3) + 'px');
  };
  var gridEls = document.querySelectorAll('.gridbg, .cta');
  gridEls.forEach(fitGrid);
  if ('ResizeObserver' in window) {
    var gro = new ResizeObserver(function (entries) { entries.forEach(function (en) { fitGrid(en.target); }); });
    gridEls.forEach(function (el) { gro.observe(el); });
  } else window.addEventListener('resize', function () { gridEls.forEach(fitGrid); });

  // grid bergulir hanya jalan saat section-nya terlihat; di luar layar animasinya dijeda (.grid-on)
  if ('IntersectionObserver' in window) {
    var gio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { e.target.classList.toggle('grid-on', e.isIntersecting); });
    });
    document.querySelectorAll('.tagline.gridbg, .skills-wrap, .cta').forEach(function (el) { gio.observe(el); });
  } else document.querySelectorAll('.tagline.gridbg, .skills-wrap, .cta').forEach(function (el) { el.classList.add('grid-on'); });

  // abaikan mousemove palsu: di layar penuh (toolbar browser muncul/hilang) Chrome bisa mengirim mousemove tanpa gerakan nyata
  // (movementX/Y = 0) tapi koordinatnya melompat jauh; kursor follower & badge "7+ years" jadi ikut terbang ke sana.
  // Hasil dicache di event supaya dua listener mousemove memakai penilaian yang sama.
  var lastMove = null;
  function bogusMove(e) {
    if (e.__bogus !== undefined) return e.__bogus;
    var bad = false;
    if (lastMove) {
      var dy = Math.abs(e.clientY - lastMove.y), vh = window.innerHeight;
      // (1) tanpa gerakan nyata tapi koordinat melompat; (2) "teleport" dari strip atas layar (zona toolbar layar penuh macOS)
      // ke bagian bawah layar dalam satu event — mustahil untuk gerakan tangan, koordinat Y-nya terbalik
      bad = (e.movementX === 0 && e.movementY === 0 && Math.abs(e.clientX - lastMove.x) + dy > 8) ||
        (lastMove.y < 90 && e.clientY > vh * 0.6 && dy > vh * 0.4);
    }
    if (!bad) lastMove = { x: e.clientX, y: e.clientY };
    return (e.__bogus = bad);
  }

  // cursor follower: ring mengikuti mouse dengan sedikit jeda, membesar di elemen yang bisa diklik
  var cur = document.querySelector('.cursor');
  if (cur && !reduce && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var mx = 0, my = 0, cx = 0, cy = 0, moving = false;
    var follow = function () {
      cx += (mx - cx) * 0.2; cy += (my - cy) * 0.2;
      cur.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)';
      if (Math.abs(mx - cx) > 0.1 || Math.abs(my - cy) > 0.1) requestAnimationFrame(follow); else moving = false;
    };
    document.addEventListener('mousemove', function (e) {
      if (bogusMove(e)) return;
      mx = e.clientX; my = e.clientY;
      if (!cur.classList.contains('on')) { cx = mx; cy = my; cur.classList.add('on'); }
      if (!moving) { moving = true; requestAnimationFrame(follow); }
    }, { passive: true });
    document.addEventListener('mouseover', function (e) {
      var lab = e.target.closest('[data-cursor]');
      cur.textContent = lab ? lab.getAttribute('data-cursor') : '';
      cur.classList.toggle('label', !!lab);
      cur.classList.toggle('big', !lab && !!e.target.closest('a, button, .tab'));
    });
    document.documentElement.addEventListener('mouseleave', function () { cur.classList.remove('on'); });
  }

  // foto profil: klik membuka LinkedIn; di desktop miring 3D mengikuti arah mouse
  var photo = document.querySelector('[data-photo]'), stk = document.querySelector('.stickers');
  var openIn = function () { window.open(SITE.contact.linkedin, '_blank', 'noopener'); };
  photo.addEventListener('click', openIn);
  photo.addEventListener('keydown', function (e) { if (e.key === 'Enter') openIn(); });
  if (!reduce && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    photo.addEventListener('mousemove', function (e) {
      var r = photo.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
      photo.classList.add('tilting');
      photo.style.transform = 'perspective(900px) rotateY(' + (px * 28).toFixed(1) + 'deg) rotateX(' + (-py * 28).toFixed(1) + 'deg) scale(1.03)';
      photo.style.setProperty('--sx', (-px * 16).toFixed(1) + 'px');
      photo.style.setProperty('--sy', (-py * 16).toFixed(1) + 'px');
      stk.classList.add('tilting');
      stk.style.transform = 'translate(' + (px * 14).toFixed(1) + 'px,' + (py * 14).toFixed(1) + 'px)';
    });
    photo.addEventListener('mouseleave', function () {
      photo.classList.remove('tilting');
      photo.style.transform = '';
      photo.style.setProperty('--sx', '0px'); photo.style.setProperty('--sy', '0px');
      stk.classList.remove('tilting'); stk.style.transform = '';
    });
  }

  // di luar hover, foto tetap sedikit condong ke arah kursor (maks ±4°); hover = tilt penuh seperti di atas
  if (!reduce && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var aTick = false, ax = 0, ay = 0;
    var ambient = function () {
      aTick = false;
      if (photo.classList.contains('tilting')) return;
      var r = photo.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      var px = Math.max(-1, Math.min(1, (ax - (r.left + r.width / 2)) / (window.innerWidth / 2)));
      var py = Math.max(-1, Math.min(1, (ay - (r.top + r.height / 2)) / (window.innerHeight / 2)));
      photo.style.transform = 'perspective(900px) rotateY(' + (px * 4).toFixed(2) + 'deg) rotateX(' + (-py * 4).toFixed(2) + 'deg)';
      photo.style.setProperty('--sx', (-px * 5).toFixed(1) + 'px');
      photo.style.setProperty('--sy', (-py * 5).toFixed(1) + 'px');
      stk.style.transform = 'translate(' + (px * 5).toFixed(1) + 'px,' + (py * 5).toFixed(1) + 'px)';
    };
    document.addEventListener('mousemove', function (e) {
      ax = e.clientX; ay = e.clientY;
      if (!aTick) { aTick = true; requestAnimationFrame(ambient); }
    }, { passive: true });
  }

  // badge "7+ years": miring 3D seperti foto profil, tanpa perlu hover — di desktop condong ke arah kursor
  // di mana pun di halaman, di ponsel (atau sebelum mouse bergerak) condong mengikuti posisinya di layar saat scroll;
  // bayangan bergeser berlawanan arah
  var yrs = document.querySelector('.years');
  if (yrs && !reduce) {
    var yTick = false, mx = null, my = 0;
    var tiltYears = function () {
      yTick = false;
      var r = yrs.getBoundingClientRect(), vw = window.innerWidth, vh = window.innerHeight;
      if (r.bottom < 0 || r.top > vh) return;
      var cx = r.left + r.width / 2, cy = r.top + r.height / 2, px, py;
      if (mx === null) { px = 0; py = Math.max(-1, Math.min(1, (cy - vh / 2) / (vh / 2))); }
      else {
        px = Math.max(-1, Math.min(1, (mx - cx) / (vw / 2)));
        py = Math.max(-1, Math.min(1, (my - cy) / (vh / 2)));
      }
      yrs.style.transform = 'perspective(700px) rotateX(' + (-py * 20).toFixed(2) + 'deg) rotateY(' + (px * 20).toFixed(2) + 'deg) rotate(-8deg)';
      yrs.style.setProperty('--sx', (-px * 7).toFixed(1) + 'px');
      yrs.style.setProperty('--sy', (-py * 7).toFixed(1) + 'px');
    };
    var yQueue = function () { if (!yTick) { yTick = true; requestAnimationFrame(tiltYears); } };
    window.addEventListener('scroll', yQueue, { passive: true });
    window.addEventListener('resize', yQueue);
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      document.addEventListener('mousemove', function (e) { if (bogusMove(e)) return; mx = e.clientX; my = e.clientY; yQueue(); }, { passive: true });
    }
    tiltYears();
  }

  // pita "Skills & tools" sticky di atas; saat area keahlian naik, pita dipotong dari bawah seolah tertutup
  var sHead = document.querySelector('.skills-head'), sWrap = document.querySelector('.skills-wrap');
  if (sHead && sWrap) {
    var sTick = false;
    // baca posisi dulu, baru tulis — dan tulis hanya bila nilainya berubah (hindari layout paksa tiap frame scroll)
    var lastSy = '', lastSo = '', lastClip = null;
    var coverHead = function () {
      sTick = false;
      var hr = sHead.getBoundingClientRect(), wr = sWrap.getBoundingClientRect(), vh = window.innerHeight;
      // pita membuka: tetap 1px dulu saat masuk layar (sampai tepi atasnya di 90% layar), lalu membuka penuh di 50% layar
      var op = reduce ? 1 : Math.min(1, Math.max(0, (vh * 0.9 - hr.top) / (vh * 0.4)));
      var sy = Math.max(1 / hr.height, op).toFixed(3);
      // teks baru muncul di paruh akhir pembukaan, supaya tidak terlihat samar di atas latar terang
      var so = Math.min(1, Math.max(0, (op - 0.5) / 0.5)).toFixed(2);
      var cut = Math.max(0, Math.round(hr.bottom - wr.top));
      sHead._covered = cut >= hr.height - 1;
      if (sy !== lastSy) { sHead.style.setProperty('--sy', sy); lastSy = sy; }
      if (so !== lastSo) { sHead.style.setProperty('--so', so); lastSo = so; }
      if (cut !== lastClip) { sHead.style.clipPath = cut ? 'inset(-240px -100vmax ' + cut + 'px)' : ''; lastClip = cut; }
    };
    window.addEventListener('scroll', function () { if (!sTick) { sTick = true; requestAnimationFrame(coverHead); } }, { passive: true });
    coverHead();
  }

  // CTA melebar penuh saat ~98% terlihat (dibanding tinggi CTA atau layar, mana yang lebih kecil); menyempit lagi di bawah 90%
  var ctaEl = document.querySelector('.cta');
  if (ctaEl) {
    var wTick = false;
    // panel penutup tepi (lihat .cta-side di CSS)
    ['l', 'r'].forEach(function (side) { var d = document.createElement('span'); d.className = 'cta-side ' + side; d.setAttribute('aria-hidden', 'true'); ctaEl.appendChild(d); });
    var widen = function () {
      wTick = false;
      var r = ctaEl.getBoundingClientRect(), vh = window.innerHeight;
      var seen = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0)) / Math.min(r.height, vh);
      var want = seen >= 0.98 ? true : seen < 0.9 ? false : ctaEl.classList.contains('wide');
      if (want !== ctaEl.classList.contains('wide')) {
        ctaEl.classList.add('cta-anim'); ctaEl.classList.toggle('wide', want);
        clearTimeout(ctaEl._t); ctaEl._t = setTimeout(function () { ctaEl.classList.remove('cta-anim'); }, 750);
      }
    };
    var onW = function () { if (!wTick) { wTick = true; requestAnimationFrame(widen); } };
    window.addEventListener('scroll', onW, { passive: true });
    window.addEventListener('resize', onW);
    widen();
  }

  // snap lembut ke CTA: hanya setelah scroll berhenti & bila tepi atas CTA sudah dekat tepi atas layar
  var cta = document.querySelector('.cta');
  if (cta && !reduce) {
    var snapT = 0, snapping = false;
    var trySnap = function () {
      if (snapping) { snapping = false; return; }
      var top = cta.getBoundingClientRect().top, near = window.innerHeight * 0.18;
      if (Math.abs(top) > 4 && Math.abs(top) < near) {
        snapping = true;
        window.scrollTo({ top: window.scrollY + top, behavior: 'smooth' });
      }
    };
    if ('onscrollend' in window) window.addEventListener('scrollend', trySnap);
    else window.addEventListener('scroll', function () { clearTimeout(snapT); snapT = setTimeout(trySnap, 160); }, { passive: true });
  }

  // tandai tabs-wrap saat daftar tab & isinya berdampingan (tidak turun baris) untuk garis titik penghubung
  var sides = function () {
    document.querySelectorAll('.tabs-wrap').forEach(function (w) {
      var a = w.children[0], b = w.children[1];
      // ukur tanpa mode slider: kalau daftar & isi tak muat berdampingan, daftar tab jadi slider horizontal (.stack)
      w.classList.remove('stack');
      var beside = !!b && Math.abs(a.offsetTop - b.offsetTop) < 2;
      w.classList.toggle('side', window.innerWidth >= 840 && beside);
      w.classList.toggle('stack', !beside);
    });
  };
  window.addEventListener('resize', sides);
  window.addEventListener('load', sides);
  sides();

  // layar mati / tab disembunyikan / aplikasi di latar: semua loop rAF berhenti total & animasi CSS dijeda,
  // lanjut lagi saat terlihat (autoplay tidak melompat karena waktu `last` diatur ulang)
  var hidden = function () { return document.visibilityState === 'hidden'; };
  var last = performance.now(), tickRaf = 0;
  function tick(now) {
    tickRaf = 0;
    if (hidden()) return;
    var dt = now - last; last = now;
    ['jobs', 'pros'].forEach(function (key) {
      var s = state[key];
      if (s.paused || s.hover || !s.seen || now < (s.hold || 0)) return;
      s.t += dt;
      if (s.t >= CFG[key].dur) { s.t = 0; s.i = (s.i + 1) % DATA[key].length; render(key); }
      bar(key);
    });
    tickRaf = requestAnimationFrame(tick);
  }
  var onVis = function () {
    document.documentElement.classList.toggle('off', hidden());
    if (!hidden() && !tickRaf) { last = performance.now(); tickRaf = requestAnimationFrame(tick); }
  };
  document.addEventListener('visibilitychange', onVis);
  window.addEventListener('pagehide', function () { document.documentElement.classList.add('off'); });
  window.addEventListener('pageshow', onVis);
  tickRaf = requestAnimationFrame(tick);

  // cahaya menembus tirai kain yang tertiup angin + grain (WebGL) untuk bidang hitam, jalan hanya saat terlihat
  var glow = function (host) {
  var cv = host && document.createElement('canvas');
  var gl = cv && (cv.getContext('webgl', { premultipliedAlpha: true, antialias: false }) || cv.getContext('experimental-webgl'));
  if (gl) {
    cv.className = 'glow';
    cv.setAttribute('aria-hidden', 'true');
    host.insertBefore(cv, host.firstChild);
    var VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
    var FS = [
      // highp bila GPU mendukung: di Android mediump = float 16-bit, nilai waktu yang terus membesar membuat noise pecah berpiksel
      '#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif',
      'uniform vec2 r;uniform float t;uniform float gs;uniform float cs;uniform float lx;uniform vec3 ac;',
      'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
      'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);',
      ' return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}',
      'float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}',
      'void main(){',
      ' vec2 uv=gl_FragCoord.xy/r;float asp=r.x/r.y;vec2 q=vec2(uv.x*asp,uv.y);',
      // lipatan kain vertikal; noise membuat lipatan bengkok & bergeser seperti tertiup angin dari samping
      ' float wx=q.x*2.4+(fbm(vec2(q.x*1.1-t*.07,q.y*.7+t*.02))-.5)*2.4;',
      ' float fold=sin(wx*3.1+t*.35)*.5+.5;',
      ' fold=fold*.7+(sin(wx*7.3-t*.22+fbm(q*2.+t*.05)*3.)*.5+.5)*.3;',
      ' float crest=pow(fold,3.);',
      // cahaya jatuh dari kanan atas, memudar ke bawah & ke kiri
      ' vec2 lp=vec2(asp*(lx+.1*sin(t*.17)),1.15);float d=length((q-lp)*vec2(.4,.62));',
      ' float spot=exp(-d*d*1.9)*(.55+.45*smoothstep(-.1,1.,uv.y));',
      ' float a=clamp(crest*spot*.8+spot*.1,0.,1.);',
      ' float tint=smoothstep(.45,.8,fbm(q*1.3-vec2(t*.05,0.)));',
      ' vec3 c=mix(vec3(.42,.55,.58),ac,tint*.55);',
      // grain diam, hanya muncul di bagian yang terkena cahaya (area gelap tetap bersih); lebih halus di desktop
      ' vec2 gc=gl_FragCoord.xy/cs;float dt=smoothstep(.55,.05,length(fract(gc)-.5));float g=(h(floor(gc))-.35)*dt*a*gs*1.1;',
      ' gl_FragColor=vec4(c*a+max(g,0.),clamp(a+abs(g),0.,1.));',
      '}'
    ].join('\n');
    var mk = function (type, src) { var sh = gl.createShader(type); gl.shaderSource(sh, src); gl.compileShader(sh); return sh; };
    var prog = gl.createProgram();
    gl.attachShader(prog, mk(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, mk(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { cv.remove(); }
    else {
      gl.useProgram(prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      var loc = gl.getAttribLocation(prog, 'p');
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      var uR = gl.getUniformLocation(prog, 'r'), uT = gl.getUniformLocation(prog, 't'), uG = gl.getUniformLocation(prog, 'gs'), uA = gl.getUniformLocation(prog, 'ac'), uC = gl.getUniformLocation(prog, 'cs'), uL = gl.getUniformLocation(prog, 'lx');
      var desk = window.matchMedia('(min-width:840px)');
      // desktop: setengah resolusi CSS, cahaya lembut tidak butuh piksel penuh, GPU jauh lebih ringan;
      // ponsel (layar rapat, DPR tinggi): grain butuh ~1 piksel fisik per butir supaya tidak kasar, jadi
      // resolusi disamakan dengan piksel fisik layar (dibatasi DPR 2.5 agar beban GPU tidak berlebihan)
      var size = function () {
        var k = desk.matches ? 0.5 : Math.min(window.devicePixelRatio || 1, 2.5);
        var w = Math.max(1, Math.round(cv.clientWidth * k)), hgt = Math.max(1, Math.round(cv.clientHeight * k));
        if (cv.width !== w || cv.height !== hgt) { cv.width = w; cv.height = hgt; gl.viewport(0, 0, w, hgt); }
        gl.uniform2f(uR, w, hgt);
        gl.uniform1f(uG, desk.matches ? .08 : .1);
        gl.uniform1f(uC, desk.matches ? 1.5 : 3);
        // CTA: cahaya dari tengah-atas; pita keahlian: dari kanan atas, dekat "Design + Code"
        gl.uniform1f(uL, host.classList.contains('skills-head') ? .72 : .42);
      };
      var t0 = performance.now(), glowOn = false, glowRaf = 0, lastDraw = 0;
      // dibatasi ~30fps & dilewati saat host tertutup (pita keahlian yang sudah tertimpa area keahlian)
      var draw = function (now) {
        if (hidden()) { glowRaf = 0; return; }
        if (glowOn && !reduce) glowRaf = requestAnimationFrame(draw);
        if (host._covered || now - lastDraw < 32) return;
        lastDraw = now;
        size();
        // waktu dijaga tetap kecil (diputar ulang tiap 5 menit) supaya presisi float di GPU ponsel tidak habis
        var tt = reduce ? 12 : ((now - t0) / 1000 * 1.6) % 480;
        gl.uniform1f(uT, tt);
        gl.uniform3f(uA, accentRGB[0], accentRGB[1], accentRGB[2]);
        // kain memudar ke transparan menjelang waktu diputar ulang (480) lalu muncul lagi, jadi lompatannya tak terlihat
        cv.style.opacity = reduce ? '' : Math.max(0, Math.min(1, tt / 12, (480 - tt) / 12)).toFixed(3);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      };
      // GPU ponsel membuang konteks WebGL saat section lama di luar layar/tab di latar: tanpa pemulihan, kanvas membeku di frame terakhir
      var rebuild = function () { cancelAnimationFrame(glowRaf); glowOn = false; io && io.disconnect(); cv.remove(); glow(host); };
      cv.addEventListener('webglcontextlost', function (e) { e.preventDefault(); rebuild(); });
      var io;
      if ('IntersectionObserver' in window) {
        io = new IntersectionObserver(function (es) {
          glowOn = es[0].isIntersecting;
          if (glowOn && gl.isContextLost()) { rebuild(); return; }
          cancelAnimationFrame(glowRaf);
          if (glowOn) glowRaf = requestAnimationFrame(draw);
        });
        io.observe(host);
      } else { glowOn = true; glowRaf = requestAnimationFrame(draw); }
      window.addEventListener('resize', function () { if (!glowOn) return; cancelAnimationFrame(glowRaf); glowRaf = requestAnimationFrame(draw); });
      document.addEventListener('visibilitychange', function () {
        cancelAnimationFrame(glowRaf); glowRaf = 0;
        if (!hidden() && glowOn) glowRaf = requestAnimationFrame(draw);
      });
    }
  }
  };
  glow(document.querySelector('.cta'));
  glow(document.querySelector('.skills-head'));

  // bubble dekoratif: tiap bubble jalan ke titik+ukuran acak sendiri-sendiri, lalu pilih titik acak
  // berikutnya begitu transisi selesai, jadi polanya tidak pernah berulang persis.
  // Jarak dihitung dari ukuran .bubbles (selebar .frame), bukan vw/vh (lebar layar), supaya batas
  // kanan-kiri geraknya selalu ikut lebar frame walau di layar lebar.
  if (!reduce && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var bwrap = document.querySelector('.bubbles');
    if (bwrap) {
      document.querySelectorAll('.bubble').forEach(function (el, i) {
        function next() {
          var dur = 5000 + Math.random() * 6000;
          var dx = (Math.random() * 0.6 - 0.3) * bwrap.clientWidth;
          var dy = (Math.random() * 0.6 - 0.3) * bwrap.clientHeight;
          el.style.transitionDuration = dur + 'ms';
          el.style.translate = dx.toFixed(0) + 'px ' + dy.toFixed(0) + 'px';
          el.style.scale = (0.8 + Math.random() * 2).toFixed(2);
          setTimeout(next, dur);
        }
        setTimeout(next, i * 700);
      });

      // bubble tetap fixed, tapi pas scroll tertinggal sebentar (delay) lalu menyusul pelan;
      // tiap bubble beda kelambatannya supaya terasa ada kedalaman
      var bubs = Array.prototype.slice.call(document.querySelectorAll('.bubble'));
      var ease = [.009, .01, .008], lag = [1, 1.2, 0.8];
      var pos = bubs.map(function () { return window.scrollY; });
      var running = false;
      function bubTick() {
        var y = window.scrollY, moving = false;
        bubs.forEach(function (el, i) {
          pos[i] += (y - pos[i]) * ease[i % 3];
          var off = (pos[i] - y) * lag[i % 3];
          if (Math.abs(y - pos[i]) > 0.3) moving = true;
          el.style.transform = 'translateY(' + off.toFixed(1) + 'px)';
        });
        if (moving) requestAnimationFrame(bubTick); else running = false;
      }
      window.addEventListener('scroll', function () {
        if (!running) { running = true; requestAnimationFrame(bubTick); }
      }, { passive: true });
    }
  }
  // panel debug sementara: buka halaman dengan ?dbg
  if (/[?&]dbg/.test(location.search)) { var dsc = document.createElement('script'); dsc.src = 'js/dbg.js?v=1'; document.body.appendChild(dsc); }
})();
