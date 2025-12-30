/*
  Inject a two-column layout (portrait on the left, content on the right)
  without editing each page.
*/

(function () {
  function createPortraitAside() {
    const aside = document.createElement('aside');
    aside.className = 'sg-side';

    const wrapper = document.createElement('div');
    wrapper.className = 'sg-portrait';

    const img = document.createElement('img');
    img.id = 'portrait-rotator';
    img.alt = 'Portrait';
    img.src = 'assets/img/portraits/p1.jpg';
    img.loading = 'lazy';

    wrapper.appendChild(img);
    aside.appendChild(wrapper);
    return img;
  }

  function wrapMainContent() {
    const main = document.querySelector('main.content');
    if (!main) return;

    // Avoid double-wrapping.
    if (main.querySelector('.sg-page')) return;

    const page = document.createElement('div');
    page.className = 'sg-page';

    const img = createPortraitAside();

    const content = document.createElement('div');
    content.className = 'sg-content';

    while (main.firstChild) {
      content.appendChild(main.firstChild);
    }

    page.appendChild(img.closest('aside'));
    page.appendChild(content);
    main.appendChild(page);

    return img;
  }

  function init() {
    const img = wrapMainContent();
    if (!img) return;

    if (window.SGPortraitRotatorInit) {
      window.SGPortraitRotatorInit(img, {
        intervalMs: 12000,
        sources: [
          'assets/img/portraits/p1.jpg',
          'assets/img/portraits/p2.jpg',
          'assets/img/portraits/p3.jpg'
        ]
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
