/* Up mockup behaviour.
   Only the things the captures actually evidence: the rail centring its active
   tab (so neighbours clip at the edges), the volumetric Saver pool, press
   states, and horizontal section swiping. Timings are invented — see up.css. */

(function () {
  "use strict";

  var still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --- rail: scroll the active tab to centre ----------------------------- */
  document.querySelectorAll(".rail").forEach(function (rail) {
    var on = rail.querySelector("a.on");
    if (!on) return;
    // No smooth scroll: the rail should already be centred on first paint.
    rail.scrollLeft = on.offsetLeft - rail.clientWidth / 2 + on.clientWidth / 2;
  });

  /* --- press states ------------------------------------------------------ */
  var pressable = ".tx, .row, .saver, .fab, .trk";
  document.addEventListener("pointerdown", function (e) {
    var el = e.target.closest(pressable);
    if (el) el.classList.add("is-down");
  });
  ["pointerup", "pointercancel", "pointerleave"].forEach(function (evt) {
    document.addEventListener(evt, function () {
      document.querySelectorAll(".is-down").forEach(function (el) {
        el.classList.remove("is-down");
      });
    });
  });

  /* --- volumetric Saver pool --------------------------------------------
     Coral particles settled like liquid to the fill level, with an irregular
     surface. The real thing is accelerometer-driven (per Up's design blog);
     this is the static equivalent.
  ---------------------------------------------------------------------- */
  document.querySelectorAll(".pool canvas").forEach(function (cv) {
    var host = cv.parentElement;
    var pct = parseFloat(host.dataset.fill || "50") / 100;
    var w = (cv.width = host.clientWidth * 2);
    var h = (cv.height = host.clientHeight * 2);
    var ctx = cv.getContext("2d");

    var surface = h * (1 - pct);

    // Irregular meniscus: a couple of low-frequency sines so the top of the
    // pile isn't a ruled line.
    function topAt(x) {
      return surface + Math.sin(x / 95) * 8 + Math.sin(x / 41 + 1.4) * 4.5;
    }

    // Density scales with the filled area, so a 5% Saver and a 90% one read
    // as the same material rather than the same particle budget spread thin.
    var count = Math.round((w * (h - surface)) / 105);

    for (var i = 0; i < count; i++) {
      var x = Math.random() * w;
      var top = topAt(x);
      // Bias downward so the pile packs at the bottom and thins at the surface.
      var y = top + Math.pow(Math.random(), 0.55) * (h - top);
      if (y > h) continue;
      var depth = (y - top) / (h - top || 1);
      var r = 2.4 + Math.random() * 4;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 122, 100, " + (0.5 + depth * 0.45) + ")";
      ctx.fill();
    }

    // Loose particles drifting just above the surface, thinning with height.
    var loose = Math.round(w / 9);
    for (var j = 0; j < loose; j++) {
      var lx = Math.random() * w;
      var lt = topAt(lx);
      var lift = Math.pow(Math.random(), 2.1) * 70;
      var ly = lt - lift;
      if (ly < 0) continue;
      ctx.beginPath();
      ctx.arc(lx, ly, 1.6 + Math.random() * 2.6, 0, Math.PI * 2);
      ctx.fillStyle =
        "rgba(255, 122, 100, " + (0.5 - (lift / 70) * 0.4) + ")";
      ctx.fill();
    }

    // Park the Saver's emoji at the surface rather than in empty space.
    host.querySelectorAll(".float").forEach(function (el) {
      el.style.bottom = pct * 100 + "%";
    });
  });

  /* --- swipe between primary sections ------------------------------------
     Up rejected tab bars for swipe-anywhere navigation (their design blog).
     Left/right arrows do the same thing for desk testing.
  ---------------------------------------------------------------------- */
  var order = ["wealth", "insights", "home", "movements", "budget"];
  var files = {
    wealth: "wealth.html",
    insights: "insights.html",
    home: "home.html",
    movements: "movements.html",
    budget: "budget.html",
  };
  var section = document.body.dataset.section || "";
  var idx = order.indexOf(section);

  function go(next) {
    if (next < 0 || next >= order.length) return;
    var f = files[order[next]];
    // Only navigate to pages that exist in this slice.
    location.href = f;
  }

  if (idx > -1) {
    var sx = null;
    document.addEventListener("pointerdown", function (e) {
      if (e.target.closest("a, button, input, .rail, .modal")) return;
      sx = e.clientX;
    });
    document.addEventListener("pointerup", function (e) {
      if (sx === null) return;
      var dx = e.clientX - sx;
      sx = null;
      if (dx < -70) go(idx + 1);
      if (dx > 70) go(idx - 1);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") go(idx + 1);
      if (e.key === "ArrowLeft") go(idx - 1);
    });
  }

  void still;
})();
