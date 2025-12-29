document.addEventListener("DOMContentLoaded", () => {
  const img = document.getElementById("portrait-rotator");
  if (!img) return;

  const images = [
    "assets/img/portraits/p1.jpg",
    "assets/img/portraits/p2.jpg",
    "assets/img/portraits/p3.jpg"
  ];

  let i = Math.floor(Math.random() * images.length);
  img.src = images[i];

  setInterval(() => {
    img.style.opacity = "0";
    setTimeout(() => {
      i = (i + 1) % images.length;
      img.src = images[i];
      img.style.opacity = "1";
    }, 800);
  }, 10000);
});
