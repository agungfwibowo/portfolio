// inti ringan: pilih tampilan (?skin= atau pilihan tersimpan), pasang CSS + markup + skrip tampilan itu saja
(function () {
  var T = window.THEMES || [], d = document.documentElement;
  var want = '';
  try { want = new URLSearchParams(location.search).get('skin') || localStorage.getItem('afw-skin') || ''; } catch (e) {}
  var th = T.filter(function (t) { return t.id === want; })[0] || T[0];
  d.dataset.skin = th.id;

  // URL mengikuti tampilan: yang pertama (default) tanpa parameter
  try {
    var u = new URL(location.href);
    if (th === T[0]) u.searchParams.delete('skin'); else u.searchParams.set('skin', th.id);
    history.replaceState(null, '', u.pathname + u.search + u.hash);
  } catch (e) {}

  var base = 'themes/' + th.id + '/', q = '?v=' + th.v;
  function add(tag, attrs) { var e = document.createElement(tag); for (var k in attrs) e[k] = attrs[k]; return e; }

  // CSS, markup, dan skrip diminta bersamaan supaya tidak berantai
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
