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
      b.addEventListener('click', function () { select(key, k); });
      b.addEventListener('keydown', function (e) {
        var n = DATA[key].length, j = null;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') j = (k + 1) % n;
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') j = (k - 1 + n) % n;
        if (j !== null) { e.preventDefault(); select(key, j); list.children[j].focus(); }
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
    var left = list.scrollLeft + tab.getBoundingClientRect().left - list.getBoundingClientRect().left;
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
    var mail = document.querySelector('[data-mail]'); mail.href = 'mailto:' + C.email; mail.textContent = C.email;
    var tel = document.querySelector('[data-tel]'); tel.href = 'tel:' + C.phone.replace(/[^+\d]/g, ''); tel.textContent = C.phone;
    var k = 0, cls = { dark: 'pill dark', light: 'pill', ai: 'pill ai' };
    document.querySelector('[data-list="jobs"]').setAttribute('aria-label', UI.jobsList);
    document.querySelector('[data-list="pros"]').setAttribute('aria-label', UI.prosList);
    var lb = document.querySelector('[data-lang]'); lb.textContent = UI.lang; lb.setAttribute('aria-label', UI.langAria);
    document.documentElement.lang = lang; document.title = SITE.meta.title;
    document.querySelector('[data-skills]').innerHTML = SITE.skills.groups.map(function (g) {
      return '<div class="group"><span class="group-label' + (g.style === 'ai' ? ' accent' : '') + '">' + esc(g.label) + '</span><ul class="pills">' +
        g.items.map(function (it) { return '<li class="' + cls[g.style] + ' r' + (k++ % 8 + 1) + '">' + icon(it.icon) + esc(it.name) + '</li>'; }).join('') + '</ul></div>';
    }).join('');
    var ph = SITE.skills.photo, img = document.querySelector('[data-photo]');
    img.src = A + ph.src; img.alt = ph.alt; img.width = ph.width; img.height = ph.height;
  }
  fillStatic();

  ['jobs', 'pros'].forEach(function (key) {
    buildList(key); render(key); bar(key);
    document.querySelector('[data-ctrl="' + key + '"]').addEventListener('click', function () {
      state[key].paused = !state[key].paused; renderCtrl(key);
    });
    var list = document.querySelector('[data-list="' + key + '"]');
    list.addEventListener('scroll', function () { edges(list); }, { passive: true });
    window.addEventListener('resize', function () { edges(list); });
    edges(list);
  });

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

  // rotasi hanya berjalan saat section terlihat di layar
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { state[e.target.getAttribute('data-sec')].seen = e.isIntersecting; });
    }, { threshold: 0.25 });
    ['jobs', 'pros'].forEach(function (key) {
      var sec = document.querySelector('[data-list="' + key + '"]').closest('section');
      sec.setAttribute('data-sec', key); io.observe(sec);
    });
  } else { state.jobs.seen = state.pros.seen = true; }

  // reveal saat scroll: elemen yang masuk layar bersamaan muncul berurutan
  // daftar selector sama dengan di css/style.css
  var RV = '.mark, .id p, .title h1, .roles, .years, .tagline p, .sec-head, .tabs-wrap, .half > *, .skills-head > *, .group, .skills-photo, .plus';
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

  // parallax grid: latar grid bergerak lebih lambat dari scroll
  if (!reduce) {
    var grids = document.querySelectorAll('.gridbg'), ticking = false;
    var parallax = function () {
      ticking = false;
      var vh = window.innerHeight;
      grids.forEach(function (g) {
        var r = g.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        g.style.setProperty('--gy', (r.top * -0.3).toFixed(1) + 'px');
      });
    };
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(parallax); } }, { passive: true });
    parallax();
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
      mx = e.clientX; my = e.clientY;
      if (!cur.classList.contains('on')) { cx = mx; cy = my; cur.classList.add('on'); }
      if (!moving) { moving = true; requestAnimationFrame(follow); }
    }, { passive: true });
    document.addEventListener('mouseover', function (e) {
      cur.classList.toggle('big', !!e.target.closest('a, button, .tab'));
    });
    document.documentElement.addEventListener('mouseleave', function () { cur.classList.remove('on'); });
  }

  var last = performance.now();
  function tick(now) {
    var dt = now - last; last = now;
    if (document.visibilityState === 'visible') {
      ['jobs', 'pros'].forEach(function (key) {
        var s = state[key];
        if (s.paused || !s.seen) return;
        s.t += dt;
        if (s.t >= CFG[key].dur) { s.t = 0; s.i = (s.i + 1) % DATA[key].length; render(key); }
        bar(key);
      });
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
