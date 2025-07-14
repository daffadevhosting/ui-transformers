document.addEventListener("DOMContentLoaded", () => {
  // Sidebar dari bawah
  gsap.from("aside", {
    y: 100,
    opacity: 0,
    duration: 1,
    ease: "power3.out",
    delay: 0.1
  });

  // Topbar dari atas
  gsap.from("#topbar", {
    y: -80,
    opacity: 0,
    duration: 1,
    ease: "power2.out",
    delay: 0.2
  });

  // Input panel dari kiri
  gsap.from("#input-panel", {
    x: -100,
    opacity: 0,
    duration: 1.2,
    ease: "power3.out",
    delay: 0.3
  });

  // Output panel dari kanan
  gsap.from("#output-panel", {
    x: 100,
    opacity: 0,
    duration: 1.2,
    ease: "power3.out",
    delay: 0.4
  });

  // Footer bounce dari bawah
  gsap.from("footer", {
    y: 60,
    opacity: 0,
    duration: 1,
    ease: "bounce.out",
    delay: 0.6
  });
});
