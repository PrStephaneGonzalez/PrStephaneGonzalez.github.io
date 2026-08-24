/*
  Inject a two-column layout (portrait on the left, content on the right)
  without editing each page.
*/

(function () {
  const portraits = {
    sculpture: 'assets/img/portraits/p2.jpg',
    chalkboard: 'assets/img/portraits/p3.jpg',
    desert: 'assets/img/portraits/p1.jpg',
    nature: 'assets/img/portraits/p4.jpg'
  };

  function createPortraitAside() {
    const aside = document.createElement('aside');
    aside.className = 'sg-side';

    const wrapper = document.createElement('div');
    wrapper.className = 'sg-portrait';

    const img = document.createElement('img');
    img.id = 'portrait-rotator';
    img.alt = 'Stéphane Gonzalez, Professor of Economics at Université Jean Monnet and Deputy Director of GATE Lyon Saint-Étienne';
    img.src = portraits.sculpture;
    img.loading = 'eager';
    img.fetchPriority = 'high';

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
          portraits.sculpture,
          portraits.chalkboard,
          portraits.desert,
          portraits.nature
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
