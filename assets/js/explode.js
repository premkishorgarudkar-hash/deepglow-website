/* ==========================================================================
   DeepGlow – scroll-linked "exploded view"
   Any container with [data-explode] starts with its children pulled apart
   (spread outward, tilted, faded) and assembles them into place as the
   container scrolls into view. Scrolling back up explodes them again.

   Uses the individual CSS `translate` / `rotate` / `scale` properties so it
   never fights with hover effects that use `transform`.
   Skipped entirely for visitors who prefer reduced motion.
   ========================================================================== */
(function () {
  "use strict";

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
  if ((reduce && reduce.matches) || !("translate" in document.documentElement.style)) return;

  var groups = Array.prototype.slice.call(document.querySelectorAll("[data-explode]")).map(function (el) {
    return { el: el, items: [], visible: false, lastP: -1 };
  });
  if (!groups.length) return;

  var ticking = false;

  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  /* Work out where each child should fly in from, based on its position in the grid. */
  function measure(group) {
    var children = Array.prototype.slice.call(group.el.children);
    children.forEach(function (c) { c.style.translate = "none"; c.style.rotate = "none"; c.style.scale = "none"; });

    var g = group.el.getBoundingClientRect();
    var gx = g.left + g.width / 2;
    var gy = g.top + g.height / 2;
    var vw = window.innerWidth;
    var spread = Math.min(260, vw * 0.22);
    var singleColumn = children.length > 1 &&
      Math.abs(children[0].getBoundingClientRect().left - children[1].getBoundingClientRect().left) < 2;

    group.items = children.map(function (c, i) {
      var r = c.getBoundingClientRect();
      var nx = (r.left + r.width / 2 - gx) / (g.width / 2 || 1);
      var ny = (r.top + r.height / 2 - gy) / (g.height / 2 || 1);
      if (singleColumn) nx = i % 2 ? 0.55 : -0.55;   // alternate sides on phones
      var seed = Math.sin((i + 1) * 12.9898) * 43758.5453;
      var jitter = seed - Math.floor(seed) - 0.5;    // stable -0.5..0.5 per item
      return {
        el: c,
        x: nx * spread + jitter * 40,
        y: ny * spread * 0.55 + 60 + jitter * 30,
        r: nx * 9 + jitter * 6,
        delay: Math.min(i * 0.06, 0.3)               // slight stagger
      };
    });
    group.lastP = -1;
  }

  function apply(group) {
    var rect = group.el.getBoundingClientRect();
    var vh = window.innerHeight;
    // 0 when the container's top touches the bottom of the screen,
    // 1 once its top has risen to ~30% from the top.
    var raw = (vh - rect.top) / (vh * 0.7);
    var p = Math.max(0, Math.min(1, raw));
    if (Math.abs(p - group.lastP) < 0.001) return;
    group.lastP = p;

    for (var i = 0; i < group.items.length; i++) {
      var it = group.items[i];
      var local = Math.max(0, Math.min(1, (p - it.delay) / (1 - it.delay)));
      var e = easeOutCubic(local);
      var k = 1 - e;
      var s = it.el.style;
      if (k < 0.002) {
        s.translate = s.rotate = s.scale = s.opacity = "";
      } else {
        s.translate = (it.x * k).toFixed(1) + "px " + (it.y * k).toFixed(1) + "px";
        s.rotate = (it.r * k).toFixed(2) + "deg";
        s.scale = (1 - 0.12 * k).toFixed(3);
        s.opacity = (0.25 + 0.75 * e).toFixed(3);
      }
    }
  }

  function update() {
    ticking = false;
    if (reduce && reduce.matches) return;
    groups.forEach(function (g) { if (g.visible) apply(g); });
  }
  function requestUpdate() {
    if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
  }

  groups.forEach(function (g) {
    // The exploded view replaces the simple fade-in on these elements.
    g.el.classList.remove("reveal");
    Array.prototype.forEach.call(g.el.children, function (c) { c.classList.remove("reveal"); });
    g.el.classList.add("is-exploding");
    measure(g);
  });

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        groups.forEach(function (g) { if (g.el === en.target) g.visible = en.isIntersecting; });
      });
      requestUpdate();
    }, { rootMargin: "20% 0px 20% 0px" });
    groups.forEach(function (g) { io.observe(g.el); });
  } else {
    groups.forEach(function (g) { g.visible = true; });
  }

  window.addEventListener("scroll", requestUpdate, { passive: true });
  var resizeTimer;
  window.addEventListener("resize", function () {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(function () { groups.forEach(measure); requestUpdate(); }, 150);
  });
  if (reduce && reduce.addEventListener) {
    reduce.addEventListener("change", function (e) {
      if (!e.matches) return;
      groups.forEach(function (g) {
        g.visible = false;
        g.items.forEach(function (it) { it.el.style.translate = it.el.style.rotate = it.el.style.scale = it.el.style.opacity = ""; });
      });
    });
  }

  groups.forEach(apply);
  requestUpdate();
})();
