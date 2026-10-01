/* ==========================================================================
   DeepGlow – hero particles
   Soft glowing specks and a few drifting sage leaves behind the hero.
   - Pauses when the hero is off-screen or the tab is hidden
   - Draws one still frame for visitors who prefer reduced motion
   - Pure decoration: if anything fails, the page works without it
   ========================================================================== */
(function () {
  "use strict";

  var canvas = document.querySelector(".hero__particles");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  if (!ctx) return;
  var hero = canvas.parentElement;

  var COLORS = {
    gold: [201, 169, 91],
    cream: [255, 246, 220],
    sage: [138, 154, 107]
  };
  var MAX_PARTICLES = 70;
  var AREA_PER_PARTICLE = 15000;   // px² of hero per particle
  var LEAF_SHARE = 0.12;           // fraction of particles that are leaves
  var POINTER_RADIUS = 130;

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
  var width = 0, height = 0, dpr = 1;
  var particles = [];
  var rafId = null;
  var lastTime = 0;
  var onScreen = true;
  var pointer = { x: -9999, y: -9999 };

  /* Pre-render one soft glow sprite per colour (much faster than gradients per frame). */
  var sprites = {};
  Object.keys(COLORS).forEach(function (key) {
    var c = COLORS[key];
    var s = document.createElement("canvas");
    s.width = s.height = 64;
    var g = s.getContext("2d");
    var grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, "rgba(" + c + ",1)");
    grad.addColorStop(0.22, "rgba(" + c + ",0.75)");
    grad.addColorStop(0.5, "rgba(" + c + ",0.18)");
    grad.addColorStop(1, "rgba(" + c + ",0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    sprites[key] = s;
  });

  function rand(min, max) { return min + Math.random() * (max - min); }

  function makeParticle(anywhere) {
    var leaf = Math.random() < LEAF_SHARE;
    return {
      leaf: leaf,
      x: rand(0, width),
      y: anywhere ? rand(0, height) : height + rand(10, 60),
      size: leaf ? rand(5, 9) : rand(3, 11),
      vy: leaf ? rand(-0.18, -0.08) : rand(-0.32, -0.08),
      vx: rand(-0.06, 0.06),
      sway: rand(0.15, 0.6),
      phase: rand(0, Math.PI * 2),
      twinkle: rand(0.6, 1.6),
      alpha: leaf ? rand(0.22, 0.38) : rand(0.25, 0.65),
      rot: rand(0, Math.PI * 2),
      vr: rand(-0.006, 0.006),
      color: leaf ? "sage" : (Math.random() < 0.6 ? "gold" : "cream"),
      push: 0
    };
  }

  function resize() {
    var rect = hero.getBoundingClientRect();
    width = Math.max(1, Math.round(rect.width));
    height = Math.max(1, Math.round(rect.height));
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var target = Math.min(MAX_PARTICLES, Math.round((width * height) / AREA_PER_PARTICLE));
    while (particles.length < target) particles.push(makeParticle(true));
    if (particles.length > target) particles.length = target;
    particles.forEach(function (p) { if (p.x > width) p.x = rand(0, width); });
  }

  function drawLeaf(p, alpha) {
    var s = p.size;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "rgb(" + COLORS.sage + ")";
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.quadraticCurveTo(s * 0.75, 0, 0, s);
    ctx.quadraticCurveTo(-s * 0.75, 0, 0, -s);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,253,247,0.6)";
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.8);
    ctx.lineTo(0, s * 0.95);
    ctx.stroke();
    ctx.restore();
  }

  function draw(time) {
    ctx.clearRect(0, 0, width, height);
    var t = time / 1000;
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var twinkle = 0.75 + 0.25 * Math.sin(t * p.twinkle + p.phase);
      var alpha = p.alpha * twinkle + p.push * 0.35;
      if (alpha > 1) alpha = 1;
      if (p.leaf) {
        drawLeaf(p, alpha);
      } else {
        var d = p.size * 4 * (1 + p.push * 0.4);
        ctx.globalAlpha = alpha;
        ctx.drawImage(sprites[p.color], p.x - d / 2, p.y - d / 2, d, d);
      }
    }
    ctx.globalAlpha = 1;
  }

  function update(dt, time) {
    var t = time / 1000;
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      p.y += p.vy * dt;
      p.x += (p.vx + Math.sin(t * 0.6 + p.phase) * p.sway * 0.12) * dt;
      p.rot += p.vr * dt;

      // Gentle glow + nudge away from the pointer
      var dx = p.x - pointer.x, dy = p.y - pointer.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      var target = 0;
      if (dist < POINTER_RADIUS) {
        target = 1 - dist / POINTER_RADIUS;
        var f = target * 0.6 * dt / (dist || 1);
        p.x += dx * f * 0.05;
        p.y += dy * f * 0.05;
      }
      p.push += (target - p.push) * 0.08;

      if (p.y < -30 || p.x < -30 || p.x > width + 30) {
        particles[i] = makeParticle(false);
      }
    }
  }

  function frame(time) {
    rafId = null;
    var dt = lastTime ? Math.min((time - lastTime) / 16.67, 3) : 1;
    lastTime = time;
    update(dt, time);
    draw(time);
    schedule();
  }

  function schedule() {
    if (rafId || !onScreen || document.hidden || (reduceMotion && reduceMotion.matches)) return;
    rafId = window.requestAnimationFrame(frame);
  }
  function stop() {
    if (rafId) window.cancelAnimationFrame(rafId);
    rafId = null;
    lastTime = 0;
  }
  function restart() {
    stop();
    if (reduceMotion && reduceMotion.matches) draw(0); // one still frame
    else schedule();
  }

  /* Events */
  hero.addEventListener("pointermove", function (e) {
    if (e.pointerType === "touch") return;
    var r = canvas.getBoundingClientRect();
    pointer.x = e.clientX - r.left;
    pointer.y = e.clientY - r.top;
  }, { passive: true });
  hero.addEventListener("pointerleave", function () { pointer.x = pointer.y = -9999; });
  document.addEventListener("visibilitychange", function () { document.hidden ? stop() : schedule(); });
  if (reduceMotion && reduceMotion.addEventListener) reduceMotion.addEventListener("change", restart);

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      onScreen = entries[0].isIntersecting;
      onScreen ? schedule() : stop();
    }).observe(hero);
  }

  var resizeTimer;
  function onResize() {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(function () { resize(); if (!rafId) draw(performance.now()); }, 150);
  }
  if ("ResizeObserver" in window) new ResizeObserver(onResize).observe(hero);
  else window.addEventListener("resize", onResize);

  try {
    resize();
    restart();
  } catch (err) {
    canvas.remove();
  }
})();
