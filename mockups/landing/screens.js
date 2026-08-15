/* ---------------------------------------------------------------------------
   The product screenshots used inside every landing mockup.

   These are the real app's anatomy — the Home feed, Presupuesto trackers,
   Patrimonio balance sheet, Insights bars and the desktop layout — recreated
   in markup rather than captured, because every screen is behind auth. They
   live in one file so all four directions show byte-identical screens and a
   change to the product only has to be made once.

   Usage:  <div data-screen="home" style="--s:.62"></div>
--------------------------------------------------------------------------- */

const ICON = {
  cart: '<path d="M2 3h3l2.4 11h11L21 6H6"/><circle cx="9.5" cy="19.5" r="1.6"/><circle cx="18" cy="19.5" r="1.6"/>',
  glass: '<path d="M6 2v8a2.5 2.5 0 0 0 5 0V2"/><path d="M8.5 10v12"/><path d="M17 2c-1.6 1.6-2 4-2 6.5S16 13 17 13v9"/>',
  bus: '<rect x="4" y="3" width="16" height="14" rx="3"/><path d="M4 11h16"/><circle cx="8" cy="19" r="1.4"/><circle cx="16" cy="19" r="1.4"/>',
  screen: '<rect x="2" y="5" width="20" height="13" rx="2.5"/><path d="M8 22h8"/><path d="M12 18v4"/>',
  heart: '<path d="M12 20S3.5 14.6 3.5 8.9A4.9 4.9 0 0 1 12 5.8a4.9 4.9 0 0 1 8.5 3.1C20.5 14.6 12 20 12 20z"/>',
  house: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V21h13V9.5"/>',
  home: '<path d="M3 10.5 12 3l9 7.5V21H3z"/><path d="M9.5 21v-6h5v6"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1.4"/><circle cx="3.5" cy="12" r="1.4"/><circle cx="3.5" cy="18" r="1.4"/>',
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="0.8" fill="currentColor"/>',
  bank: '<path d="M3 9.5 12 4l9 5.5"/><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8"/><path d="M3 21h18"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  gear: '<circle cx="12" cy="12" r="3.2"/><path d="M19.4 14.5a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1v.3a2 2 0 1 1-4 0v-.2a1.6 1.6 0 0 0-2.8-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H3a2 2 0 1 1 0-4h.2a1.6 1.6 0 0 0 1.1-2.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 2.7-1.1V3a2 2 0 1 1 4 0v.2a1.6 1.6 0 0 0 2.8 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7h.3a2 2 0 1 1 0 4h-.2a1.6 1.6 0 0 0-1.4 1z"/>',
  upload: '<path d="M12 16V4"/><path d="m7.5 8.5 4.5-4.5 4.5 4.5"/><path d="M4 15v3.5A2.5 2.5 0 0 0 6.5 21h11a2.5 2.5 0 0 0 2.5-2.5V15"/>',
  repeat: '<path d="M20.5 11A8.5 8.5 0 0 0 6.3 5.2L3 8.2"/><path d="M3 3.4V8.6h5.2"/><path d="M3.5 13A8.5 8.5 0 0 0 17.7 18.8L21 15.8"/><path d="M21 20.6v-5.2h-5.2"/>',
};

const glyph = (d, color, w) =>
  `<svg class="gl" viewBox="0 0 24 24" fill="none" stroke="${color || "currentColor"}" stroke-width="${w || 1.7}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

const STATUSBAR =
  '<div class="statusbar"><span>9:41</span><span class="dots">&#9679;&#9679;&#9679; &#9679;</span></div>';

const RAIL = (active) =>
  '<nav class="rail">' +
  ["Patrimonio", "Insights", "Home", "Movements", "Budget"]
    .map(
      (l) =>
        `<a class="${l.toLowerCase() === active ? "on" : ""}" href="#">${l}</a>`
    )
    .join("") +
  "</nav>";

/* The coral round-up triangle that rides beside swept amounts. */
const RU =
  '<svg class="ru" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="9" fill="#ff7a64"/><path d="M10 5.4 14.8 14H5.2z" fill="#fff"/></svg>';

const tx = (alt, mark, markColor, round, name, sub, amt, income, ru, meta) =>
  `<div class="tx${alt ? " alt" : ""}">` +
  `<span class="mark${round ? " round" : ""}" style="background:${markColor}">${mark}</span>` +
  `<div class="body"><div class="name">${name}</div><div class="sub">${sub}</div></div>` +
  `<div class="tail"><div class="amt${income ? " in" : ""}">${ru ? RU : ""}${amt}</div>` +
  (meta ? `<div class="meta">${meta}</div>` : "") +
  "</div></div>";

const SCREENS = {};

/* --- Home · the feed ------------------------------------------------------ */
SCREENS.home = `
<div class="ph-body">
  <div class="chrome">
    ${STATUSBAR}
    ${RAIL("home")}
    <div class="hero">
      <div class="fig">&euro;2,847.30${glyph(ICON.repeat, "currentColor", 2.6).replace('class="gl"', 'class="sync" style="width:15px;height:15px;opacity:.75"')}</div>
      <div class="lab warm">Available</div>
    </div>
    <div class="fxpill"><span>&#127464;&#127476;</span><span class="tnum">$12,480,000</span></div>
  </div>
  <div class="sheet">
    <div class="drawer">
      <b>Upcoming</b>
      <span class="marks"><span class="mark sm round" style="background:#1db954">S</span><span class="mark sm round" style="background:#e50914">N</span></span>
      <span class="chev">&#9662;</span>
    </div>
    <div class="split">
      <div class="l">August 2026</div>
      <div class="r">Insights <span class="minibar"><i style="width:58%;background:var(--lemon)"></i><i style="width:26%;background:var(--coral)"></i><i style="width:16%;background:#3f424f"></i></span></div>
    </div>
    <div class="day">Thu, 13 August</div>
    ${tx(0, "M", "#0a5c36", 0, "Mercadona", "18:04, Calle Goya", "&euro;41.20", 0, 1)}
    ${tx(1, "B", "#ff6b00", 0, "Bar Peniscola", "14:12, Madrid", "&euro;12.50", 0, 1)}
    ${tx(0, "&#128179;", "#2d6cdf", 1, "Ana R.", "11:30, Split for dinner &#127829;", "+&euro;18.40", 1, 0)}
    <div class="day">Wed, 12 August</div>
    ${tx(1, "S", "#1db954", 0, "Spotify", "09:00, Subscription", "&euro;11.99", 0, 0)}
    ${tx(0, "&#8645;", "#3ddc97", 1, "Transfer to Jap&oacute;n 2027", "08:15", "&euro;120.00", 0, 0, "4 of 16")}
    ${tx(1, "R", "#c8102e", 0, "Renfe", "07:41, Atocha", "&euro;9.60", 0, 1)}
    <div class="day">Tue, 11 August</div>
    ${tx(0, "N", "#6b47b8", 0, "N&oacute;mina", "Payroll", "+&euro;2,410.00", 1, 0)}
    ${tx(1, "A", "#2b2d38", 0, "Amazon", "19:22, amazon.es", "&euro;27.99", 0, 1)}
  </div>
</div>
<a class="fab" href="#">+</a>`;

/* --- Budget · Presupuesto trackers ---------------------------------------- */
const trk = (icon, color, name, amount, fill, over) =>
  `<div class="trk"><div class="in">${glyph(icon, color).replace('class="gl"', 'class="ico"')}<div class="nm">${name}</div><div class="amt">${amount}</div></div>` +
  (over
    ? `<span class="bar" style="display:flex"><i style="width:100%;background:${color}"></i><i style="width:14%;background:var(--red)"></i></span>`
    : `<span class="bar"><i style="width:${fill}%;background:${color}"></i></span>`) +
  "</div>";

SCREENS.budget = `
<div class="ph-body">
  <div class="chrome">
    ${STATUSBAR}
    ${RAIL("budget")}
    <div class="hero">
      <div class="fig">&euro;612.40</div>
      <div class="lab">Left to spend this month</div>
    </div>
    <div class="subtabs"><a class="on" href="#">Presupuestos</a><a href="#">Metas</a></div>
  </div>
  <div class="sheet dark">
    <div class="split"><div class="l">August 2026 <span style="color:var(--mute-dark)">&#9662;</span></div></div>
    <div class="stats">
      <div><b class="tnum">&euro;1,798.60</b><span>Money Out</span></div>
      <div><b class="tnum in">+&euro;2,410.00</b><span>Money In</span></div>
    </div>
    <div class="sec">Trackers</div>
    <div class="trk-grid">
      ${trk(ICON.cart, "#3ddc97", "Groceries", "&euro;124 left", 62)}
      ${trk(ICON.glass, "#ffe14d", "Dining", "&euro;38 over", 100, 1)}
      ${trk(ICON.bus, "#28c4d8", "Transport", "&euro;56 left", 44)}
      ${trk(ICON.screen, "#b565d8", "Subscriptions", "&euro;12 left", 78)}
      ${trk(ICON.heart, "#ff7a64", "Health", "&euro;90 left", 25)}
      ${trk(ICON.house, "#f5a623", "Casa", "&euro;210 left", 71)}
    </div>
  </div>
</div>
<a class="fab" href="#">+</a>`;

/* --- Patrimonio · the balance sheet --------------------------------------- */
const wrow = (color, name, sub, amount, negative) =>
  `<div class="row"><span class="dot" style="background:${color}"></span>` +
  `<div class="body"><b>${name}</b><div class="sub">${sub}</div></div>` +
  `<span class="tnum" style="font-weight:600;${negative ? "color:var(--red)" : ""}">${amount}</span>` +
  '<span class="chev">&#8250;</span></div>';

SCREENS.wealth = `
<div class="ph-body">
  <div class="chrome">
    ${STATUSBAR}
    ${RAIL("patrimonio")}
    <div class="hero">
      <div class="fig white">&euro;48,120.65</div>
      <div class="lab">Net worth</div>
      <div class="delta">+&euro;1,240.00 this month</div>
    </div>
  </div>
  <div class="sheet">
    <div class="split">
      <div class="l">Resumen</div>
      <div class="r" style="color:var(--mute)">Activos &middot; Deudas</div>
    </div>
    <div class="sec">Organiza tu dinero</div>
    ${wrow("#28c4d8", "Accounts", "3 accounts &middot; 2 currencies", "&euro;4,210.55")}
    ${wrow("#3ddc97", "Savings", "Jap&oacute;n 2027, Colch&oacute;n", "&euro;12,400.00")}
    ${wrow("#b565d8", "Investments", "Index funds, stocks", "&euro;33,900.10")}
    ${wrow("#f5a623", "Money lent", "2 people", "&euro;600.00")}
    ${wrow("#f0453a", "Debts", "Car loan", "&minus;&euro;2,990.00", 1)}
    <div class="sec">By currency</div>
    <div class="catrow">
      <div class="body">
        <div class="nm"><span>EUR</span><span class="tnum">&euro;35,700</span></div>
        <div class="track"><i style="width:74%;background:var(--ink)"></i></div>
      </div>
    </div>
    <div class="catrow">
      <div class="body">
        <div class="nm"><span>COP</span><span class="tnum">&euro;12,420</span></div>
        <div class="track"><i style="width:26%;background:var(--coral)"></i></div>
      </div>
    </div>
  </div>
</div>`;

/* --- Insights · where it went --------------------------------------------- */
const MONTHS = ["S", "O", "N", "D", "J", "F", "M", "A", "M", "J", "J", "A"];
const HEIGHTS = [44, 62, 55, 88, 51, 47, 66, 58, 71, 60, 76, 92];

SCREENS.insights = `
<div class="ph-body">
  <div class="chrome">
    ${STATUSBAR}
    ${RAIL("insights")}
    <div class="hero">
      <div class="fig white">&euro;1,798.60</div>
      <div class="lab">Spent in August</div>
      <div class="delta" style="color:var(--coral)">&euro;212 more than July</div>
    </div>
  </div>
  <div class="sheet">
    <div class="split"><div class="l">Last 12 months</div><div class="r" style="color:var(--mute)">Daily</div></div>
    <div class="bars">${HEIGHTS.map((h, i) => `<i style="height:${h}%" class="${i === 11 ? "on" : ""}"></i>`).join("")}</div>
    <div class="barlab">${MONTHS.map((m) => `<span>${m}</span>`).join("")}</div>
    <div class="sec">Where it went</div>
    <div class="catrow"><div class="body"><div class="nm"><span>Casa</span><span class="tnum">&euro;890</span></div><div class="track"><i style="width:100%;background:#f5a623"></i></div></div></div>
    <div class="catrow"><div class="body"><div class="nm"><span>Good Life</span><span class="tnum">&euro;412</span></div><div class="track"><i style="width:46%;background:#ffe14d"></i></div></div></div>
    <div class="catrow"><div class="body"><div class="nm"><span>Groceries</span><span class="tnum">&euro;276</span></div><div class="track"><i style="width:31%;background:#3ddc97"></i></div></div></div>
    <div class="catrow"><div class="body"><div class="nm"><span>Transport</span><span class="tnum">&euro;144</span></div><div class="track"><i style="width:16%;background:#28c4d8"></i></div></div></div>
    <div class="catrow"><div class="body"><div class="nm"><span>Giving</span><span class="tnum">&euro;241</span></div><div class="track"><i style="width:27%;background:#b565d8"></i></div></div></div>
  </div>
</div>`;

/* --- Desktop · the same app, sidebar layout ------------------------------- */
const side = (icon, label, on) =>
  `<a class="${on ? "on" : ""}" href="#">${glyph(icon, "currentColor", 1.7)}${label}</a>`;

SCREENS.desktop = `
<div class="win-bar"><i></i><i></i><i></i><div class="url">budget-expense.app/home</div></div>
<div class="dk">
  <div class="dk-side">
    <div class="bd"><img src="../../public/icons/budget-expense-app-icon.png" alt="" /><b>Budget &amp; Expense</b></div>
    ${side(ICON.home, "Home", 1)}
    ${side(ICON.list, "Movements")}
    ${side(ICON.target, "Budget")}
    ${side(ICON.bank, "Patrimonio")}
    ${side(ICON.chart, "Insights")}
    <div class="grp">More</div>
    ${side(ICON.repeat, "Recurring")}
    ${side(ICON.upload, "Import")}
    ${side(ICON.gear, "Settings")}
  </div>
  <div class="dk-main">
    <div class="dk-top">
      <div class="ttl">Home</div>
      <div class="spacer"></div>
      <div class="pill">August 2026 &#9662;</div>
      <div class="pill">EUR &#9662;</div>
      <div class="pill">Search &#8984;K</div>
      <div class="av">JP</div>
    </div>
    <div class="dk-grid">
      <div>
        <div class="dk-hero">
          <div class="fig tnum">&euro;2,847.30</div>
          <div class="lab">Available &middot; tracked to 13 August</div>
          <div class="strip">
            <div><b class="tnum" style="color:#3ddc97">+&euro;2,410.00</b><span>Money in</span></div>
            <div><b class="tnum">&euro;1,798.60</b><span>Money out</span></div>
            <div><b class="tnum">&euro;158.20</b><span>Daily guide</span></div>
            <div><b class="tnum">6 days</b><span>Left in month</span></div>
          </div>
        </div>
        <div class="dk-card" style="margin-top:18px">
          <div class="dk-hd">Recent movements <span class="more">See all</span></div>
          <div class="day">Thu, 13 August</div>
          ${tx(0, "M", "#0a5c36", 0, "Mercadona", "18:04, Calle Goya", "&euro;41.20", 0, 1)}
          ${tx(1, "B", "#ff6b00", 0, "Bar Peniscola", "14:12, Madrid", "&euro;12.50", 0, 1)}
          ${tx(0, "&#128179;", "#2d6cdf", 1, "Ana R.", "11:30, Split for dinner", "+&euro;18.40", 1, 0)}
          <div class="day">Wed, 12 August</div>
          ${tx(1, "S", "#1db954", 0, "Spotify", "09:00, Subscription", "&euro;11.99", 0, 0)}
          ${tx(0, "R", "#c8102e", 0, "Renfe", "07:41, Atocha", "&euro;9.60", 0, 1)}
        </div>
      </div>
      <div>
        <div class="dk-card">
          <div class="dk-hd">Presupuestos <span class="more">Manage</span></div>
          <div class="trk-grid" style="padding:2px 14px 14px">
            ${trk(ICON.cart, "#3ddc97", "Groceries", "&euro;124 left", 62)}
            ${trk(ICON.glass, "#ffe14d", "Dining", "&euro;38 over", 100, 1)}
            ${trk(ICON.bus, "#28c4d8", "Transport", "&euro;56 left", 44)}
            ${trk(ICON.heart, "#ff7a64", "Health", "&euro;90 left", 25)}
          </div>
        </div>
        <div class="dk-card" style="margin-top:18px">
          <div class="dk-hd">Where it went</div>
          <div class="catrow"><div class="body"><div class="nm"><span>Casa</span><span class="tnum">&euro;890</span></div><div class="track"><i style="width:100%;background:#f5a623"></i></div></div></div>
          <div class="catrow"><div class="body"><div class="nm"><span>Good Life</span><span class="tnum">&euro;412</span></div><div class="track"><i style="width:46%;background:#ffe14d"></i></div></div></div>
          <div class="catrow"><div class="body"><div class="nm"><span>Groceries</span><span class="tnum">&euro;276</span></div><div class="track"><i style="width:31%;background:#3ddc97"></i></div></div></div>
          <div style="height:10px"></div>
        </div>
      </div>
    </div>
  </div>
</div>`;

/* --- mount ---------------------------------------------------------------- */
document.querySelectorAll("[data-screen]").forEach((el) => {
  const key = el.getAttribute("data-screen");
  const html = SCREENS[key];
  if (!html) return;
  const desktop = key === "desktop";
  el.classList.add(desktop ? "win" : "ph");
  el.innerHTML = `<div class="${desktop ? "win-frame" : "ph-frame"}">${html}</div>`;
});

/* Centre each rail on its active tab, so the neighbours clip at both edges the
   way they do in the app. The rail is padded by 50% of its width, so the target
   offset is the item's centre minus half the viewport. */
document.querySelectorAll(".rail").forEach((rail) => {
  const on = rail.querySelector("a.on");
  if (!on) return;
  rail.scrollLeft = on.offsetLeft + on.offsetWidth / 2 - rail.clientWidth / 2;
});
