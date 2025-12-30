/*
  Portrait rotator with gentle fade.
  - Avoids a full disappearance (never drops opacity to 0)
  - Preloads images to prevent flashes
*/

(function () {
  function preload(sources) {
    sources.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }

  function shuffle(array) {
    // Fisher–Yates shuffle (in-place)
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  window.SGPortraitRotatorInit = function (imgEl, opts) {
    if (!imgEl) return;

    const intervalMs = (opts && opts.intervalMs) ? opts.intervalMs : 12000;
    const sources = (opts && opts.sources) ? opts.sources.slice() : [];

    if (sources.length < 2) return;

    preload(sources);

    // Start from the currently set src, then cycle through a shuffled list.
    let order = shuffle(sources.slice());
    let index = Math.max(0, order.indexOf(imgEl.getAttribute('src')));

    imgEl.style.transition = 'opacity 500ms ease';
    imgEl.style.opacity = '1';

    function nextSrc() {
      index = (index + 1) % order.length;
      const next = order[index];

      // Gentle fade: never fully invisible.
      imgEl.style.opacity = '0.2';
      window.setTimeout(() => {
        imgEl.setAttribute('src', next);
        imgEl.style.opacity = '1';
      }, 220);

      // Reshuffle when completing a cycle to avoid repeating patterns.
      if (index === order.length - 1) {
        order = shuffle(order);
      }
    }

    window.setInterval(nextSrc, intervalMs);
  };
})();
