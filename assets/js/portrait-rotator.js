/*
  Portrait rotator with gentle fade.
  - Avoids a full disappearance (never drops opacity to 0)
  - Preloads images to prevent flashes
  - Preserves the configured order
*/

(function () {
  function preload(sources) {
    sources.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }

  window.SGPortraitRotatorInit = function (imgEl, opts) {
    if (!imgEl) return;

    const intervalMs = (opts && opts.intervalMs) ? opts.intervalMs : 12000;
    const sources = (opts && opts.sources) ? opts.sources.slice() : [];

    if (sources.length < 2) return;

    preload(sources);

    let index = Math.max(0, sources.indexOf(imgEl.getAttribute('src')));

    imgEl.style.transition = 'opacity 500ms ease';
    imgEl.style.opacity = '1';

    function nextSrc() {
      index = (index + 1) % sources.length;
      const next = sources[index];

      // Gentle fade: never fully invisible.
      imgEl.style.opacity = '0.2';
      window.setTimeout(() => {
        imgEl.setAttribute('src', next);
        imgEl.style.opacity = '1';
      }, 220);
    }

    window.setInterval(nextSrc, intervalMs);
  };
})();
