#!/usr/bin/env python3
"""Generate the Up-faithful phone mockups for Budget & Expense.

Built against JP's captures of the real Up app (2026-08-13). Slice 1 is six
phone screens chosen so that between them they exercise every pattern in the
reference exactly once.

Writes .html only — up.css and up.js are hand-owned and are never touched by
this script.
"""

from pathlib import Path

ROOT = Path(__file__).parent

# Primary sections, in rail order. The rail centres the active one, so the
# entries either side of it are what the user sees clipped at the edges.
RAIL = [
    ("wealth", "Net worth", "wealth.html"),
    ("insights", "Insights", "insights.html"),
    ("home", "Home", "home.html"),
    ("movements", "Movements", "movements.html"),
    ("budget", "Budget", "budget.html"),
]

BUILT = {"home.html", "budget.html", "presupuestos.html", "meta-japan.html",
         "home-forward.html", "recurring.html", "index.html"}

# Round-up mark: coral disc with a triangle. Appears beside an amount when a
# round-up fired, and beside a Meta name when round-ups are enabled.
RU = (
    '<svg class="ru" viewBox="0 0 20 20" aria-hidden="true">'
    '<circle cx="10" cy="10" r="9" fill="#ff7a64"/>'
    '<path d="M10 5.4 14.8 14H5.2z" fill="#fff"/>'
    "</svg>"
)

SYNC = (
    '<svg class="sync" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
    'stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
    '<path d="M20.5 11A8.5 8.5 0 0 0 6.3 5.2L3 8.2"/><path d="M3 3.4V8.6h5.2"/>'
    '<path d="M3.5 13A8.5 8.5 0 0 0 17.7 18.8L21 15.8"/><path d="M21 20.6v-5.2h-5.2"/>'
    "</svg>"
)

ICONS = {
    "cart": '<path d="M2 3h3l2.4 11h11L21 6H6"/><circle cx="9.5" cy="19.5" r="1.6"/><circle cx="18" cy="19.5" r="1.6"/>',
    "fork": '<path d="M6 2v8a2.5 2.5 0 0 0 5 0V2"/><path d="M8.5 10v12"/><path d="M17 2c-1.6 1.6-2 4-2 6.5S16 13 17 13v9"/>',
    "bus": '<rect x="4" y="3" width="16" height="14" rx="3"/><path d="M4 11h16"/><circle cx="8" cy="19" r="1.4"/><circle cx="16" cy="19" r="1.4"/>',
    "tv": '<rect x="2" y="5" width="20" height="13" rx="2.5"/><path d="M8 22h8"/><path d="M12 18v4"/>',
    "heart": '<path d="M12 20S3.5 14.6 3.5 8.9A4.9 4.9 0 0 1 12 5.8a4.9 4.9 0 0 1 8.5 3.1C20.5 14.6 12 20 12 20z"/>',
    "home": '<path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V21h13V9.5"/>',
}


def icon(name: str, color: str) -> str:
    return (
        f'<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="{color}" '
        f'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" '
        f'aria-hidden="true">{ICONS[name]}</svg>'
    )


def mark(bg: str, glyph: str, round_: bool = False) -> str:
    cls = "mark round" if round_ else "mark"
    return f'<span class="{cls}" style="background:{bg}">{glyph}</span>'


def rail(active: str) -> str:
    items = "".join(
        f'<a class="{"on" if key == active else ""}" '
        f'href="{href if href in BUILT else "#"}">{label}</a>'
        for key, label, href in RAIL
    )
    return f'<nav class="rail">{items}</nav>'


def hero(fig: str, label: str, sync: bool = False, warm: bool = False) -> str:
    s = SYNC if sync else ""
    warm_cls = " warm" if warm else ""
    return (
        f'<div class="hero"><div class="fig">{fig}{s}</div>'
        f'<div class="lab{warm_cls}">{label}</div></div>'
    )


def tx(m: str, name: str, sub: str, amt: str, kind: str = "", meta: str = "",
       ru: bool = False, alt: bool = False) -> str:
    cls = "amt in" if kind == "in" else "amt"
    glyph = RU if ru else ""
    meta_html = f'<div class="meta">{meta}</div>' if meta else ""
    row_cls = "tx alt" if alt else "tx"
    return (
        f'<div class="{row_cls}">{m}<div class="body"><div class="name">{name}</div>'
        f'<div class="sub">{sub}</div></div>'
        f'<div class="tail"><div class="{cls}">{glyph}{amt}</div>{meta_html}</div></div>'
    )


class Feed:
    """Emits a feed, alternating the row tint across transactions only.

    Day separators must not consume a step or the striping breaks at every
    date boundary — which is exactly what it does if you leave it to
    :nth-child in CSS.
    """

    def __init__(self) -> None:
        self.n = 0
        self.parts: list[str] = []

    def day(self, label: str) -> "Feed":
        self.parts.append(f'<div class="day">{label}</div>')
        return self

    def tx(self, *args, **kwargs) -> "Feed":
        kwargs["alt"] = self.n % 2 == 1
        self.n += 1
        self.parts.append(tx(*args, **kwargs))
        return self

    def pad(self, px: int = 90) -> "Feed":
        self.parts.append(f'<div style="height:{px}px"></div>')
        return self

    def html(self) -> str:
        return "\n        ".join(self.parts)


def saver(emo: str, name: str, amount: str, of: str = "", pct: int = 0,
          href: str = "#", ru: bool = False) -> str:
    ru_html = RU if ru else ""
    of_html = f"<em>of {of}</em>" if of else ""
    bar = f'<span class="bar"><i style="width:{pct}%"></i></span>' if of else ""
    return (
        f'<a class="saver" href="{href}"><div class="top">'
        f'<span class="emo">{emo}</span>'
        f'<span class="nm">{name}{ru_html}</span>'
        f'<span class="val"><b>{amount}</b>{of_html}</span>'
        f"</div>{bar}</a>"
    )


def tracker(ico: str, color: str, name: str, amt: str, pct: int, over: bool = False) -> str:
    if over:
        fill = (
            f'<i style="width:{min(pct, 100)}%;background:{color}"></i>'
            f'<i style="width:{max(0, 100 - pct) if pct < 100 else 14}%;background:var(--red)"></i>'
        )
        bar = f'<span class="bar" style="display:flex">{fill}</span>'
    else:
        bar = f'<span class="bar"><i style="width:{pct}%;background:{color}"></i></span>'
    return (
        f'<a class="trk" href="#"><div class="in">{icon(ico, color)}'
        f'<div class="nm">{name}</div><div class="amt">{amt}</div></div>{bar}</a>'
    )


def document(title: str, chrome: str, sheet: str, section: str = "",
             fab: bool = True, extra: str = "", action: str = "",
             dark_sheet: bool = False) -> str:
    fab_html = '<a class="fab" href="#">+</a>' if fab else ""
    dim = " dimmed" if extra else ""
    sheet_cls = "sheet dark" if dark_sheet else "sheet"
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{title} · Up mockup</title>
  <link rel="stylesheet" href="up.css" />
</head>
<body class="studio" data-section="{section}">
  <a class="back" href="index.html">&larr; All screens</a>
  <div class="device">
    <div class="phone-body{dim}">
      <div class="chrome">
        <div class="statusbar"><span>9:41</span><span class="dots">&#9679;&#9679;&#9679; &#9679;</span></div>
        {chrome}
      </div>
      <div class="{sheet_cls}">
        {sheet}
      </div>
    </div>
    {action}
    {fab_html}
    {extra}
  </div>
  <script src="up.js"></script>
</body>
</html>
"""


# --------------------------------------------------------------------------
# 1 — Home / Activity
# --------------------------------------------------------------------------

def home_chrome() -> str:
    return (
        rail("home")
        + hero("&euro;2,847.30", "Available", sync=True, warm=True)
        + '<div class="fxpill"><span>&#127464;&#127476;</span><span class="tnum">$12,480,000</span></div>'
    )


def home_sheet() -> str:
    f = Feed()
    f.day("Thu, 13 August")
    f.tx(mark("#0a5c36", "M"), "Mercadona", "18:04, Calle Goya", "&euro;41.20", ru=True)
    f.tx(mark("#ff6b00", "B"), "Bar Peniscola", "14:12, Madrid", "&euro;12.50", ru=True)
    f.tx(mark("#2d6cdf", "&#128179;", True), "Ana R.",
         "11:30, Split for dinner &#127829;", "+&euro;18.40", kind="in")
    f.day("Wed, 12 August")
    f.tx(mark("#1db954", "S"), "Spotify", "09:00, Subscription", "&euro;11.99")
    f.tx(mark("#3ddc97", "&#8645;", True), "Transfer to Jap&oacute;n 2027", "08:15",
         "&euro;120.00", meta="4 of 16")
    f.tx(mark("#c8102e", "R"), "Renfe", "07:41, Atocha", "&euro;9.60", ru=True)
    f.day("Tue, 11 August")
    f.tx(mark("#6b47b8", "N"), "N&oacute;mina", "Payroll", "+&euro;2,410.00", kind="in")
    f.tx(mark("#f5a623", "&#9650;", True), "Round Up", "Swept to Jap&oacute;n 2027",
         "&euro;3.80", meta="6 Txns &#9662;")
    f.tx(mark("#2b2d38", "A"), "Amazon", "19:22, amazon.es", "&euro;27.99", ru=True)
    f.pad()
    return f"""<div class="drawer">
          <b>Upcoming</b>
          <span class="marks">{mark("#1db954", "S", True)}{mark("#e50914", "N", True)}</span>
          <span class="chev">&#9662;</span>
        </div>
        <div class="split">
          <div class="l">August 2026</div>
          <div class="r">Insights <span class="minibar"><i style="width:58%;background:var(--lemon)"></i><i style="width:26%;background:var(--coral)"></i><i style="width:16%;background:#3f424f"></i></span></div>
        </div>
        {f.html()}"""


# --------------------------------------------------------------------------
# 2 — Metas (Up's Savers)
# --------------------------------------------------------------------------

def subtabs(active: str) -> str:
    items = [("presupuestos.html", "Presupuestos"), ("budget.html", "Metas")]
    return '<div class="subtabs">' + "".join(
        f'<a class="{"on" if href == active else ""}" href="{href}">{label}</a>'
        for href, label in items
    ) + "</div>"


def budget_chrome() -> str:
    return (
        rail("budget")
        + hero("&euro;4,180.00", "Total saved")
        + subtabs("budget.html")
    )


def budget_sheet() -> str:
    return f"""<div class="cards">
          {saver("&#127968;", "Piso Madrid", "&euro;2,450", ru=True)}
          {saver("&#9992;&#65039;", "Jap&oacute;n 2027", "&euro;820", of="&euro;3,000", pct=27, href="meta-japan.html")}
          {saver("&#127873;", "Regalos", "&euro;180", of="&euro;400", pct=45)}
          {saver("&#128187;", "Setup nuevo", "&euro;730", of="&euro;1,500", pct=49)}
          {saver("&#10013;&#65039;", "Diezmo", "&euro;0", of="&euro;241", pct=0)}
        </div>"""


# --------------------------------------------------------------------------
# 3 — Meta detail (particle fill)
# --------------------------------------------------------------------------

def meta_chrome() -> str:
    return """<div class="pushed">
          <a class="g" href="budget.html">&#8964;</a>
          <div class="t">&#9992;&#65039;&nbsp; Jap&oacute;n 2027</div>
          <span class="g">&#8943;</span>
        </div>
        <div class="pool" data-fill="27">
          <canvas></canvas>
          <span class="pct">27%</span>
          <span class="float" style="left:20%">&#127754;</span>
          <span class="float" style="left:72%;animation-delay:-1.4s">&#9973;</span>
          <div class="mid"><b>&euro;820.00</b><em>of &euro;3,000</em></div>
        </div>
        <a class="row" href="#"><div class="body"><b>Redondeos</b><div class="sub">&euro;1 boosted enabled</div></div><span class="chev">&#8250;</span></a>
        <a class="row" href="#"><div class="body"><b>Auto Transfer</b><div class="sub">&euro;120 monthly, on payday</div></div><span class="chev">&#8250;</span></a>"""


def meta_sheet() -> str:
    f = Feed()
    f.day("Wed, 12 August")
    f.tx(mark("#3ddc97", "&#8645;", True), "Transfer from Available", "08:15",
         "+&euro;120.00", kind="in")
    f.tx(mark("#f5a623", "&#9650;", True), "Round Up", "09:00 &ndash; 19:22",
         "+&euro;3.80", kind="in", meta="6 Txns &#9662;")
    f.day("Mon, 3 August")
    f.tx(mark("#3ddc97", "&#8645;", True), "Transfer from Available", "07:02",
         "+&euro;120.00", kind="in")
    f.tx(mark("#8b8d98", "&#8645;", True), "Transfer to Available", "18:40", "&euro;60.00")
    f.pad(110)
    return f.html()


# --------------------------------------------------------------------------
# 4 — Presupuestos (Up's Trackers)
# --------------------------------------------------------------------------

def pres_chrome() -> str:
    return (
        rail("budget")
        + hero("&euro;612.40", "Left to spend this month")
        + subtabs("presupuestos.html")
    )


def pres_sheet() -> str:
    return f"""<div class="split">
          <div class="l">August 2026 <span style="color:var(--mute-dark)">&#9662;</span></div>
        </div>
        <div class="stats">
          <div><b class="tnum">&euro;1,798.60</b><span>Money Out</span></div>
          <div><b class="tnum in">+&euro;2,410.00</b><span>Money In</span></div>
        </div>
        <div class="sec">Trackers</div>
        <div class="trk-grid">
          {tracker("cart", "#3ddc97", "Groceries", "&euro;124 left", 62)}
          {tracker("fork", "#ffe14d", "Dining", "&euro;38 over", 100, over=True)}
          {tracker("bus", "#28c4d8", "Transport", "&euro;56 left", 44)}
          {tracker("tv", "#b565d8", "Subscriptions", "&euro;12 left", 78)}
          {tracker("heart", "#ff7a64", "Health", "&euro;90 left", 25)}
          {tracker("home", "#f5a623", "Casa", "&euro;210 left", 71)}
        </div>
        <div class="sec">Categories</div>
        <a class="row" href="#"><div class="body"><b>Good Life</b><div class="sub">Dining, bars, salir</div></div><span class="tnum" style="font-weight:600">&euro;412</span></a>
        <a class="row" href="#"><div class="body"><b>Casa</b><div class="sub">Alquiler, luz, agua</div></div><span class="tnum" style="font-weight:600">&euro;890</span></a>
        <div style="height:90px"></div>"""


# --------------------------------------------------------------------------
# 5 — Forward-to-Meta sheet, over the dimmed feed
# --------------------------------------------------------------------------

def forward_extra() -> str:
    return f"""<div class="veil"></div>
    <div class="modal">
      <div class="grab"></div>
      <h3>Send this to a Meta <span class="info">?</span></h3>
      <div class="pinned">
        {tx(mark("#2d6cdf", "&#128179;", True), "Ana R.", "11:30, Split for dinner &#127829;", "+&euro;18.40", kind="in")}
      </div>
      <a class="row" href="#"><span class="emo" style="font-size:19px">&#127968;</span><div class="body"><b>Piso Madrid</b></div><span class="tnum" style="font-weight:600">&euro;2,450</span></a>
      <a class="row is-down" href="#"><span class="emo" style="font-size:19px">&#9992;&#65039;</span><div class="body"><b>Jap&oacute;n 2027</b></div><span class="tnum" style="font-weight:600">&euro;820</span></a>
      <a class="row" href="#"><span class="emo" style="font-size:19px">&#127873;</span><div class="body"><b>Regalos</b></div><span class="tnum" style="font-weight:600">&euro;180</span></a>
      <a class="row" href="#"><span class="emo" style="font-size:19px">&#128187;</span><div class="body"><b>Setup nuevo</b></div><span class="tnum" style="font-weight:600">&euro;730</span></a>
      <a class="row" href="#"><span class="emo" style="font-size:19px">&#10013;&#65039;</span><div class="body"><b>Diezmo</b></div><span class="tnum" style="font-weight:600">&euro;0</span></a>
    </div>"""


# --------------------------------------------------------------------------
# 6 — Recurrentes (Up's Regulars)
# --------------------------------------------------------------------------

def reg(dom: str, m: str, name: str, amt: str, fx: str = "") -> str:
    fx_html = f'<div class="fx">{fx}</div>' if fx else ""
    return (
        f'<div class="reg"><span class="dom">{dom}</span>{m}'
        f'<div class="body"><div class="nm">{name}</div></div>'
        f'<div class="tail"><div class="amt tnum">{amt}</div>{fx_html}</div></div>'
    )


def recurring_chrome() -> str:
    return """<div class="pushed">
          <a class="g" href="home.html">&#9662;</a>
          <div class="t">Recurrentes</div>
          <span class="g">&#8943;</span>
        </div>""" + hero("&euro;486.20", "Recurring monthly charges")


def recurring_sheet() -> str:
    return f"""<div class="split">
          <div class="l">August 2026</div>
          <div class="r" style="color:var(--teal);font-weight:700">&euro;218.40 <span style="color:var(--mute);font-weight:500;font-size:11.5px">6 charges</span></div>
        </div>
        {reg("3rd", mark("#e50914", "N"), "Netflix", "&euro;13.99")}
        {reg("8th", mark("#1db954", "S"), "Spotify", "&euro;11.99")}
        {reg("12th", mark("#161b22", "&#9679;"), "GitHub", "~&euro;9.65", fx="USD 10.00")}
        {reg("14th", mark("#0061fe", "D"), "Dropbox", "~&euro;10.80", fx="USD 11.99")}
        {reg("18th", mark("#ff7a64", "&#9889;"), "Iberdrola", "&euro;74.30")}
        {reg("22nd", mark("#6b47b8", "&#127968;"), "Alquiler", "&euro;890.00")}
        {reg("25th", mark("#00a0df", "M"), "Movistar", "&euro;39.90")}
        {reg("28th", mark("#c8102e", "&#10013;"), "Diezmo", "&euro;241.00")}
        <div style="height:90px"></div>"""


# --------------------------------------------------------------------------

def index_html() -> str:
    rows = [
        ("home.html", "Home &middot; Activity", "rail &middot; hero &middot; sheet &middot; feed &middot; round-ups"),
        ("budget.html", "Metas", "saver cards &middot; edge bars &middot; FAB"),
        ("meta-japan.html", "Meta detail", "particle fill &middot; % chip &middot; action bar"),
        ("presupuestos.html", "Presupuestos", "trackers &middot; remaining-first &middot; overspend"),
        ("home-forward.html", "Send to a Meta", "sheet &middot; dim + desaturate &middot; pinned row"),
        ("recurring.html", "Recurrentes", "day rail &middot; ~FX &middot; teal subtotal"),
    ]
    grid = "".join(
        f'<a href="{href}"><b>{name}</b><em>{note}</em></a>' for href, name, note in rows
    )
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Up-faithful mockups &middot; Budget &amp; Expense</title>
  <link rel="stylesheet" href="up.css" />
</head>
<body style="background:#0d0e12">
  <div class="gallery">
    <h1>Built against the <span>real Up</span>.</h1>
    <p>Slice 1 &mdash; six phone screens, chosen so that between them they exercise every
    pattern read off the captures: the clipped tab rail, the coral hero on dark over a white
    sheet, edge-hugging Meta bars, remaining-first trackers, the volumetric pool, and a sheet
    that dims <em>and</em> desaturates what is behind it.</p>
    <h2>Screens</h2>
    <div class="g-grid">{grid}</div>
    <div class="note">
      <b>Two things are not asserted here.</b><br />
      The typeface is a stand-in &mdash; Up&rsquo;s real face is unconfirmed, so this uses Inter
      with tight numerals until it is identified. And every duration and easing curve is
      invented: the captures show <em>that</em> sheets slide and particles settle, not how fast.
      Both are commented as such in <code>up.css</code>. Screen recordings would close the gap.
    </div>
  </div>
</body>
</html>
"""


def main() -> None:
    pages = {
        "home.html": document("Home", home_chrome(), home_sheet(), "home"),
        "budget.html": document("Metas", budget_chrome(), budget_sheet(), "budget",
                                dark_sheet=True),
        "presupuestos.html": document("Presupuestos", pres_chrome(), pres_sheet(),
                                      "budget", dark_sheet=True),
        "meta-japan.html": document(
            "Japón 2027", meta_chrome(), meta_sheet(), "",
            fab=False, action='<a class="action" href="#">Transfer Money &#8646;</a>'),
        "home-forward.html": document(
            "Send to a Meta", home_chrome(), home_sheet(), "",
            fab=False, extra=forward_extra()),
        "recurring.html": document(
            "Recurrentes", recurring_chrome(), recurring_sheet(), "", fab=False),
        "index.html": index_html(),
    }
    for name, html in pages.items():
        (ROOT / name).write_text(html, encoding="utf-8")
        print(f"wrote {name}")


if __name__ == "__main__":
    main()
