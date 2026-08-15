(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.querySelectorAll(".stamp, .fab, .who, .keys button").forEach((el) => {
    el.addEventListener("pointerdown", () => el.classList.add("is-down"));
    el.addEventListener("pointerup", () => el.classList.remove("is-down"));
    el.addEventListener("pointerleave", () => el.classList.remove("is-down"));
  });

  if (!reduce) {
    const bowls = [...document.querySelectorAll(".bowl")];
    const tilt = (clientX, clientY) => {
      bowls.forEach((bowl) => {
        const r = bowl.getBoundingClientRect();
        const dx = (clientX - (r.left + r.width / 2)) / 28;
        const dy = (clientY - (r.top + r.height / 2)) / 40;
        bowl.style.setProperty("--tilt", `${Math.max(-10, Math.min(10, dx + dy))}deg`);
      });
    };
    window.addEventListener("pointermove", (e) => tilt(e.clientX, e.clientY), { passive: true });
  }

  const order = ["home", "movements", "budget", "wealth", "insights"];
  const here = document.body.dataset.section;
  const phone = document.body.dataset.phone === "1";
  const file = (key) => {
    if (key === "home") return phone ? "mobile.html" : "home.html";
    return phone ? `mobile-${key}.html` : `${key}.html`;
  };
  if (here && order.includes(here)) {
    let startX = 0;
    let tracking = false;
    const start = (x) => {
      startX = x;
      tracking = true;
    };
    const end = (x) => {
      if (!tracking) return;
      tracking = false;
      const dx = x - startX;
      const i = order.indexOf(here);
      if (dx < -72 && i < order.length - 1) location.href = file(order[i + 1]);
      if (dx > 72 && i > 0) location.href = file(order[i - 1]);
    };
    document.addEventListener("pointerdown", (e) => {
      if (e.target.closest("a, button, input, .card-swipe, .keys")) return;
      start(e.clientX);
    });
    document.addEventListener("pointerup", (e) => end(e.clientX));
    document.addEventListener("keydown", (e) => {
      const i = order.indexOf(here);
      if (e.key === "ArrowRight" && i < order.length - 1) location.href = file(order[i + 1]);
      if (e.key === "ArrowLeft" && i > 0) location.href = file(order[i - 1]);
    });
  }

  const display = document.querySelector("[data-amount]");
  if (display) {
    let raw = display.dataset.amount || "0";
    const paint = () => {
      const n = Number(raw || "0") / 100;
      display.textContent = `€${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };
    paint();
    document.querySelectorAll("[data-key]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const k = btn.dataset.key;
        if (k === "del") raw = raw.slice(0, -1);
        else if (raw.length < 8) raw += k;
        paint();
      });
    });
  }

  const card = document.querySelector(".card-swipe");
  if (card) {
    let x0 = 0;
    let dragging = false;
    card.addEventListener("pointerdown", (e) => {
      dragging = true;
      x0 = e.clientX;
      card.setPointerCapture(e.pointerId);
    });
    card.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - x0;
      card.style.transform = `translateX(${dx}px) rotate(${dx / 28}deg)`;
    });
    card.addEventListener("pointerup", (e) => {
      dragging = false;
      const dx = e.clientX - x0;
      if (Math.abs(dx) > 110) {
        card.style.transform = `translateX(${dx > 0 ? 480 : -480}px) rotate(${dx > 0 ? 18 : -18}deg)`;
        card.style.opacity = "0";
      } else {
        card.style.transform = "";
      }
    });
  }
})();
