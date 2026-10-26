(function () {
  var A = 'assets/';
  var DATA = {
    jobs: [
      { period: 'Mei 2021 — Sekarang', company: 'RSUP H. Adam Malik Medan', role: 'Programmer / Developer · Unit SIMRS', desc: 'Mendesain UI modul SIMRS, membangun front-end aplikasi, mengembangkan backend dengan PHP (Yii2), dan membuat layout print formulir & laporan — dibantu AI (Claude, ChatGPT, Claude Code).' },
      { period: 'Feb 2022 — Okt 2024', company: 'Faria Edu', role: 'WordPress Developer (Freelance)', desc: 'Mendesain UI web, slicing desain ke HTML/CSS/JS, membangun dan memelihara situs WordPress, mengembangkan komponen React & Vue.js, serta menangani perbaikan dan update fitur.' },
      { period: 'Okt 2019 — Mei 2021', company: 'Freelancer', role: 'Web Front-End Developer / UI/UX Designer', desc: 'Merancang dan membangun 9 website & web app untuk klien ritel, interior, gaming, industri, edukasi, energi, dan kesehatan.' },
      { period: 'Jun 2019 — Okt 2019', company: 'Xtend Indonesia', role: 'Web Front-End Developer / UI/UX Designer', desc: 'Komp. Setia Budi, Medan. Front-end website, mobile UI/UX design, dan WordPress dengan Divi Builder.' }
    ],
    pros: [
      { no: '01', name: 'Kimy Kuky Cookies', cat: 'Website E-Commerce', client: 'Kimy Kuky', role: 'Mendesain UI website & membangunnya dengan WordPress + Divi Builder', tools: 'UI Design · WordPress · Divi Builder', imgs: ['kimy-1.webp', 'kimy-2.webp', 'kimy-3.webp'] },
      { no: '02', name: 'Barik.id', cat: 'Company Profile', client: 'Barik Home & Interior', role: 'Mendesain UI website & membangunnya dengan WordPress + Divi Builder', tools: 'UI Design · WordPress · Divi Builder', imgs: ['barik-1.webp', 'barik-2.webp', 'barik-3.webp'] },
      { no: '03', name: 'Clarias Gaming Shop', cat: 'Website Top Up', client: 'Clarias Gaming Shop', role: 'Mendesain UI website dengan Figma & slicing ke HTML', tools: 'Figma · UI Design · HTML/CSS', imgs: ['clarias-1.webp', 'clarias-2.webp', 'clarias-3.webp'] },
      { no: '04', name: 'Kuala Tanjung Industrial Estate', cat: 'Company Profile', client: 'KIKT', role: 'Membangun website dengan WordPress', tools: 'WordPress', imgs: ['kikt-1.webp', 'kikt-2.webp'] },
      { no: '05', name: 'Air Mineral Amoz', cat: 'Company Profile', client: 'PT. Tirta Alpin Makmur', role: 'Mendesain UI website menggunakan Adobe XD', tools: 'Adobe XD · UI Design', imgs: ['amoz-1.webp', 'amoz-2.webp', 'amoz-3.webp'] },
      { no: '06', name: 'Skill Factory', cat: 'Website', client: 'Skill Factory', role: 'Mendesain UI website dengan Figma & membangunnya dengan WordPress + Divi Builder', tools: 'Figma · WordPress · Divi Builder', imgs: ['sf-1.webp', 'sf-2.webp', 'sf-3.webp'] },
      { no: '07', name: 'Yuk Belajar', cat: 'Website Edukasi', client: 'Indonesiabelajar.org', role: 'Mendesain UI website dengan Adobe XD & slicing ke HTML', tools: 'Adobe XD · UI Design · HTML/CSS', imgs: ['yb-1.webp', 'yb-2.webp', 'yb-3.webp'] },
      { no: '08', name: 'Project TV', cat: 'Web App', client: 'Salah satu rumah sakit di China', role: 'Slicing desain ke Vue.js', tools: 'Vue.js · Front-End', imgs: ['tv-1.webp', 'tv-2.webp', 'tv-3.webp'] },
      { no: '09', name: 'PROBIS UPHK Medan', cat: 'Web App', client: 'PLN UPHK Medan', role: 'Mendesain UI website dengan Adobe XD & slicing dengan Vue.js', tools: 'Adobe XD · UI Design · Vue.js', imgs: ['probis-1.webp'] },
      { no: '10', name: 'STARS Mandiri', cat: 'Sistem Informasi', client: 'RSUP H. Adam Malik Medan', role: 'Membuat layout print, mendesain informasi tempat tidur pasien, dan backend dengan framework Yii2', tools: 'UI Design · Layout Print · Yii2', imgs: ['stars-1.webp', 'stars-2.webp', 'stars-3.webp'] }
    ]
  };
  DATA.pros.forEach(function (p) { p.label = p.no + ' · ' + p.cat; });

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
      hero.src = A + d.imgs[0]; hero.alt = d.name + ' — tampilan utama'; hero.decoding = 'async';
      var th = document.querySelector('[data-thumbs]'); th.innerHTML = '';
      d.imgs.slice(1).forEach(function (src, k) {
        var im = el('img', 'shot'); im.src = A + src; im.alt = d.name + ' — tampilan ' + (k + 2); im.loading = 'lazy'; im.decoding = 'async'; th.appendChild(im);
      });
    }
    renderCtrl(key);
    if (key === 'pros') preload((s.i + 1) % DATA.pros.length);
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
    var what = key === 'jobs' ? 'pengalaman' : 'proyek';
    b.innerHTML = (p ? ICON_PLAY + 'Putar' : ICON_PAUSE + 'Jeda');
    b.setAttribute('aria-label', (p ? 'Putar ' : 'Jeda ') + what + ' otomatis');
  }

  function select(key, k) { state[key].i = k; state[key].t = 0; render(key); bar(key); }
  function bar(key) {
    document.querySelector('[data-bar="' + key + '"]').style.width = Math.min(100, state[key].t / CFG[key].dur * 100) + '%';
  }

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
