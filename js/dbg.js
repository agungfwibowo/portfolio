(function () {
  var box = document.createElement('pre');
  box.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:99999;margin:0;padding:8px 10px;background:rgba(0,0,0,.85);color:#9f9;font:11px/1.35 monospace;pointer-events:none;max-width:92vw;white-space:pre';
  document.body.appendChild(box);
  var lines = [], t0 = performance.now();
  function log(s) {
    lines.push(((performance.now() - t0) / 1000).toFixed(2) + ' ' + s);
    if (lines.length > 16) lines.shift();
    box.textContent = lines.join('\n');
  }
  function cur() { var c = document.querySelector('.cursor'); return c ? c.style.transform.replace('translate3d', 't') : '-'; }
  function ev(e) {
    if (e.type === 'mousemove' && Math.abs(e.movementX) + Math.abs(e.movementY) > 0 && Math.abs(e.movementY) < 40) return;
    log(e.type + ' xy=' + e.clientX + ',' + e.clientY + ' mv=' + e.movementX + ',' + e.movementY + ' trusted=' + e.isTrusted + ' cur=' + cur());
  }
  ['mousedown', 'mouseup', 'click', 'mousemove', 'pointerdown', 'mouseleave', 'mouseenter'].forEach(function (n) {
    document.addEventListener(n, ev, true);
  });
  document.documentElement.addEventListener('mouseleave', function () { log('html mouseleave'); });
  window.addEventListener('resize', function () { log('resize ih=' + innerHeight + ' oh=' + outerHeight); });
  window.addEventListener('scroll', function () { log('scroll y=' + scrollY); }, { passive: true });
  if (window.visualViewport) visualViewport.addEventListener('resize', function () { log('vv resize h=' + visualViewport.height + ' top=' + visualViewport.offsetTop); });
  document.addEventListener('fullscreenchange', function () { log('fullscreenchange ' + !!document.fullscreenElement); });
  log('dbg on ih=' + innerHeight + ' oh=' + outerHeight);
})();
