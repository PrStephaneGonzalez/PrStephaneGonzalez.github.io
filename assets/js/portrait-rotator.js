document.addEventListener("DOMContentLoaded", () => {
  const img = document.getElementById("portrait-rotator");
  if (!img) return;

  // Use absolute paths from the site root (more reliable on GitHub Pages)
  const images = [
    "/assets/img/portraits/p1.jpg",
    "/assets/img/portraits/p2.jpg",
    "/assets/img/portraits/p3.jpg"
  ];

  // Preload images to avoid blank moments
  images.forEach((src) => {
    const pre = new Image();
    pre.src = src;
  });

  let i = Math.floor(Math.random() * images.length);
  img.src = images[i];

  const FADE_MS = 350;
  const INTERVAL_MS = 10000;

  setInterval(() => {
    // fade out
    img.style.transition = `opacity ${FADE_MS}ms ease-in-out`;
    img.style.opacity = "0";

    // swap near the end of fade-out
    setTimeout(() => {
      i = (i + 1) % images.length;

      // swap image, then fade in once it’s loaded
      const next = images[i];
      const tmp = new Image();
      tmp.onload = () => {
        img.src = next;
        img.style.opacity = "1";
      };
      tmp.onerror = () => {
        // if a file is missing, just fade back in on current image
        img.style.opacity = "1";
      };
      tmp.src = next;
    }, FADE_MS);
  }, INTERVAL_MS);
});
