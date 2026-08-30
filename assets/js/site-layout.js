/*
  Inject a two-column layout (portrait on the left, content on the right)
  without editing each page.
*/

(function () {
  const portraits = {
    sculpture: 'assets/img/portraits/EDEDFA1C-C21A-435D-972B-110D600B11C5.png',
    chalkboard: 'assets/img/portraits/209D54D3-AFFB-4023-8875-728CEC6D7189.jpeg',
    desert: 'assets/img/portraits/14977DB0-67AA-4C30-BA63-32BFD4B70E5B.jpeg',
    nature: 'assets/img/portraits/E48E58D7-24FA-4228-9F3E-6A9B0705C687.jpeg'
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
