#!/usr/bin/env python3
"""Generate an original Up-system mockup of Budget & Expense. Not derived from other mockup HTML."""

from pathlib import Path

ROOT = Path(__file__).parent

BOLT = (
    '<svg viewBox="0 0 32 32" aria-hidden="true">'
    '<path fill="#ff4700" d="M19.2 1.6 5.4 17.8h9.2L12.2 30.4 27 13.8h-9.4L19.2 1.6z"/>'
    "</svg>"
)

PRIMARY = [
    ("home", "Home", "home.html", "mobile.html"),
    ("movements", "Movements", "movements.html", "mobile-movements.html"),
    ("budget", "Budget", "budget.html", "mobile-budget.html"),
    ("wealth", "Net worth", "wealth.html", "mobile-wealth.html"),
    ("insights", "Insights", "insights.html", "mobile-insights.html"),
]


def u(phone: bool, desktop: str, mobile: str | None = None) -> str:
    if not phone:
        return desktop
    if mobile:
        return mobile
    stem = desktop.replace(".html", "")
    if stem == "home":
        return "mobile.html"
    if stem == "command":
        return "mobile-more.html"
    return f"mobile-{stem}.html"


def pool(name, left, fill, tint, emoji, meta, href, large=False):
    cls = "pool lg" if large else "pool"
    return f"""<a class="{cls}" href="{href}">
      <div class="bowl"><span class="fluid" style="--fill:{fill}%;--tint:{tint}"></span><span class="bob">{emoji}</span></div>
      <b>{name}</b><span class="left">{left}</span><em>{meta}</em>
    </a>"""


def tx(kind, mark, name, sub, amt, pos=False, hot=False):
    cls = "amt pos" if pos else ("amt hot" if hot else "amt")
    return f"""<div class="tx"><span class="av {kind}">{mark}</span><div><div class="name">{name}</div><div class="sub">{sub}</div></div><span class="{cls}">{amt}</span></div>"""


def row(title, sub="", trail="", href=None):
    inner = f"<div><b>{title}</b>" + (f'<div class="sub">{sub}</div>' if sub else "") + "</div>"
    trail_html = f"<span>{trail}</span>" if trail else ""
    body = f"{inner}{trail_html}"
    if href:
        return f'<a class="row" href="{href}">{body}</a>'
    return f'<div class="row">{body}</div>'


def document(title, body, section="", phone=False, extra=""):
    pager = "".join(
        f'<a class="{"on" if key == section else ""}" href="{mobile if phone else desk}">{label}</a>'
        for key, label, desk, mobile in PRIMARY
    )
    who = u(phone, "command.html", "mobile-more.html")
    fab_href = u(phone, "capture.html", "mobile-capture.html")
    brand = u(phone, "index.html", "index.html")
    top = f"""<header class="top">
      <a class="mark" href="{brand}">{BOLT}Budget &amp; Expense</a>
      <nav class="pager">{pager}</nav>
      <a class="who" href="{who}">JP</a>
    </header>"""
    fab = f'<a class="fab" href="{fab_href}">+</a>'
    if phone:
        dots = "".join(
            f'<i class="{"on" if key == section else ""}"></i>' for key, *_ in PRIMARY
        )
        html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{title} · phone</title>
  <link rel="stylesheet" href="upsider.css" />
</head>
<body class="studio" data-section="{section}" data-phone="1">
  <div>
    <p class="kicker" style="text-align:center;margin-bottom:12px"><a href="index.html">All screens</a></p>
    <div class="device phone">
      <div class="notch"><span>21:41</span><a class="who" href="mobile-more.html">JP</a></div>
      <div class="phone-body">
        <div class="stage">
          <div class="dock-hint">{dots}</div>
          {body}
        </div>
      </div>
      {fab}
      {extra}
    </div>
  </div>
  <script src="upsider.js"></script>
</body>
</html>
"""
    else:
        html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{title}</title>
  <link rel="stylesheet" href="upsider.css" />
</head>
<body data-section="{section}" data-phone="0">
  {top}
  <div class="stage">
    {body}
  </div>
  {fab}
  {extra}
  <script src="upsider.js"></script>
</body>
</html>
"""
    return html


def auth_doc(title, body):
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{title}</title>
  <link rel="stylesheet" href="upsider.css" />
</head>
<body>
  <div class="auth"><div class="auth-box">{body}</div></div>
  <script src="upsider.js"></script>
</body>
</html>
"""


def home_body(p):
    b = u(p, "budget.html", "mobile-budget.html")
    m = u(p, "movements.html", "mobile-movements.html")
    decks = "".join(
        [
            pool("Dining", "€48 left", 16, "var(--dine)", "🍜", "watch", b),
            pool("Housing", "€40 left", 3, "var(--house)", "🏠", "rent’s a date", b),
            pool("Groceries", "€214 left", 54, "var(--groc)", "🥬", "left", b),
            pool("Transit", "€51 left", 48, "var(--move)", "🚇", "left", b),
            pool("Giving", "Done", 100, "var(--give)", "✝️", "first, not leftover", b),
        ]
    )
    txs = [
        tx("dine", "🍜", "El Nacional", "Dining · CaixaBank · today", "−28.40"),
        tx("groc", "🥬", "Veritas Gràcia", "Groceries · CaixaBank · today", "−41.22"),
        tx("q", "?", "Unknown POS 4412", "Needs a home · yesterday", "−12.50", hot=True),
        tx("move", "🚇", "Rodalies T-usual", "Transit · Wise · 11 Aug", "−21.15"),
        tx("give", "✝️", "Tithe", "Giving · 1 Aug", "−620.00"),
        tx("house", "🏠", "Alquiler August", "Housing · 1 Aug", "−1,180.00"),
        tx("in", "＋", "Studio invoice", "Income · Wise · 1 Aug", "+6,200.00", pos=True),
    ]
    feed = txs[:4] if p else txs
    return f"""
    <section class="hero">
      <span class="kicker">Spendable</span>
      <div class="money" data-count="3916.40">€3,916.40</div>
      <p class="pace">16 days on the clock · €244.78 a day <span class="pill">On pace</span></p>
    </section>
    <div class="deck">{decks}</div>
    <p class="note">Pools are what’s left, not what you burned. Dining’s a puddle. Giving already did its job.</p>
    <div class="day">Activity</div>
    {''.join(feed)}
    <p class="pace" style="margin-top:18px"><a href="{m}" style="color:var(--zap);font-weight:800">See the whole feed</a></p>
    """


def movements_body(p, tab="all"):
    tabs = [
        ("all", "All", "movements.html", "mobile-movements.html"),
        ("out", "Out", "movements-out.html", "mobile-movements-out.html"),
        ("in", "In", "movements-in.html", "mobile-movements-in.html"),
    ]
    seg = "".join(
        f'<a class="{"on" if key == tab else ""}" href="{u(p, d, m)}">{label}</a>'
        for key, label, d, m in tabs
    )
    rec = u(p, "movements-recurring.html", "mobile-movements-recurring.html")
    items = {
        "all": [
            tx("dine", "🍜", "El Nacional", "Dining · CaixaBank · 13 Aug", "−28.40"),
            tx("groc", "🥬", "Veritas Gràcia", "Groceries · CaixaBank · 13 Aug", "−41.22"),
            tx("q", "?", "Unknown POS 4412", "Needs a home · 12 Aug", "−12.50", hot=True),
            tx("move", "🚇", "Rodalies T-usual", "Transit · Wise · 11 Aug", "−21.15"),
            tx("give", "✝️", "Tithe", "Giving · 1 Aug", "−620.00"),
            tx("house", "🏠", "Alquiler August", "Housing · 1 Aug", "−1,180.00"),
            tx("in", "＋", "Studio invoice", "Income · Wise · 1 Aug", "+6,200.00", pos=True),
        ],
        "out": [
            tx("dine", "🍜", "El Nacional", "Dining · CaixaBank · 13 Aug", "−28.40"),
            tx("groc", "🥬", "Veritas Gràcia", "Groceries · 13 Aug", "−41.22"),
            tx("q", "?", "Unknown POS 4412", "Needs a home · 12 Aug", "−12.50", hot=True),
            tx("move", "🚇", "Rodalies T-usual", "Transit · 11 Aug", "−21.15"),
            tx("give", "✝️", "Tithe", "Giving · 1 Aug", "−620.00"),
            tx("house", "🏠", "Alquiler August", "Housing · 1 Aug", "−1,180.00"),
        ],
        "in": [tx("in", "＋", "Studio invoice", "Income · Wise · 1 Aug", "+6,200.00", pos=True)],
        "recurring": [
            tx("house", "🏠", "Alquiler", "1st · Housing · €1,180", "−1,180.00"),
            tx("give", "✝️", "Tithe", "1st · 10% of income", "−620.00"),
            tx("sub", "📺", "Apple + Netflix", "12th · Subscriptions", "−24.99"),
        ],
    }
    stats = ""
    if tab == "all":
        stats = """<div class="stats">
          <div class="stat"><span class="kicker">Out</span><div class="money">€2,283.60</div></div>
          <div class="stat"><span class="kicker">In</span><div class="money amt pos">€6,200.00</div></div>
          <div class="stat"><span class="kicker">To park</span><div class="money amt hot">2</div></div>
        </div>"""
    title = "Bills that keep showing up" if tab == "recurring" else "Movements"
    note = (
        "Rent and tithe hit on the 1st. They are dates, not leaks."
        if tab == "recurring"
        else "Black is money leaving. Green is money arriving. Nobody gets shamed in red."
    )
    return f"""
    <h1 class="screen">{title}</h1>
    <div class="seg">{seg}<a href="{rec}" class="{"on" if tab == "recurring" else ""}">Bills</a></div>
    <p class="note">{note}</p>
    {stats}
    {'' if tab == "recurring" else '<input class="search" value="Search a merchant…" readonly />'}
    {''.join(items[tab])}
    """


def budget_body(p):
    e = u(p, "budget-edit.html", "mobile-budget.html")
    n = u(p, "budget-new.html", "mobile-budget-new.html")
    method = u(p, "budget-method.html", "mobile-budget-method.html")
    plan = u(p, "budget-plan.html", "mobile-budget-plan.html")
    pools = "".join(
        [
            pool("Dining", "€48", 16, "var(--dine)", "🍜", "€252 of €300", e, True),
            pool("Housing", "€40", 3, "var(--house)", "🏠", "rent on the 1st", e, True),
            pool("Groceries", "€214", 54, "var(--groc)", "🥬", "€186 of €400", e, True),
            pool("Transit", "€51", 48, "var(--move)", "🚇", "€54 of €105", e, True),
            pool("Subscriptions", "€27", 44, "var(--sub)", "📺", "€33 of €60", e, True),
            pool("Giving", "Done", 100, "var(--give)", "✝️", "€620 of €620", e, True),
        ]
    )
    return f"""
    <h1 class="screen">Your pools</h1>
    <p class="note">A pool is a bowl of leftover. Fill it on payday. Watch it drain when you live.</p>
    <div class="seg">
      <a class="on" href="{u(p, "budget.html", "mobile-budget.html")}">Ceilings</a>
      <a href="{plan}">Monthly plan</a>
      <a href="{method}">Method</a>
    </div>
    <div class="grid-pools">{pools}</div>
    <h2>Goals that fill up</h2>
    <p class="note">These want to hit 100%. Opposite of a ceiling.</p>
    <div class="deck">
      {pool("Emergency", "€8,200", 82, "var(--save)", "🛟", "of €10,000", u(p, "wealth-savings.html", "mobile-wealth.html"))}
      {pool("VWCE drip", "€600", 60, "var(--move)", "📈", "this month", u(p, "wealth-investments.html", "mobile-wealth-investments.html"))}
    </div>
    <a class="stamp ghost wide" href="{n}">New pool</a>
    """


def budget_new_body(p):
    back = u(p, "budget.html", "mobile-budget.html")
    return f"""
    <h1 class="screen">New pool</h1>
    <p class="note">Name it like a jar on the counter. Not like a spreadsheet column.</p>
    <div class="field"><label>Name</label><input value="Coffee out" /></div>
    <div class="field"><label>Ceiling this month</label><input value="80" /></div>
    <div class="field"><label>Watches</label><input value="Dining" /></div>
    <div class="anchor"><a class="stamp wide" href="{back}">Stand it up</a></div>
    """


def budget_edit_body(p):
    back = u(p, "budget.html", "mobile-budget.html")
    return f"""
    <h1 class="screen">Dining</h1>
    <div class="deck">{pool("Dining", "€48 left", 16, "var(--dine)", "🍜", "watch", back, True)}</div>
    <p class="note">€252 already out. 16 days still on the clock. This is a puddle, not a crisis — unless tomorrow is tapas.</p>
    <div class="field"><label>Ceiling</label><input value="300" /></div>
    <div class="row"><div><b>Watch at</b><div class="sub">Ping when the bowl is a puddle</div></div><span>20%</span></div>
    <div class="anchor">
      <a class="stamp wide" href="{back}">Keep it</a>
      <a class="stamp ghost wide" href="{back}" style="margin-top:10px">Delete pool</a>
    </div>
    """


def budget_method_body(p):
    plan = u(p, "budget-plan.html", "mobile-budget-plan.html")
    methods = [
        ("50 / 30 / 20", "Needs, wants, and future"),
        ("60 / 30 / 10", "Essentials first, then live and give"),
        ("5 Jars", "Give first, then save, invest, and spend"),
        ("Zero-based", "Every euro gets a job"),
        ("Pay yourself first", "Save before you spend"),
        ("Values-based", "Spend in alignment with what matters"),
    ]
    rows = "".join(
        f'<a class="row" href="{plan}"><div><b>{n}</b><div class="sub">{t}</div></div><span>→</span></a>'
        for n, t in methods
    )
    return f"""
    <h1 class="screen">Pick a method</h1>
    <p class="note">This seeds the pools. You can still nudge every bowl after.</p>
    {rows}
    """


def budget_plan_body(p):
    back = u(p, "budget.html", "mobile-budget.html")
    return f"""
    <h1 class="screen">August plan</h1>
    <p class="note">From 5 Jars. Giving already left the station.</p>
    <div class="plan">
      <div><span class="kicker">Give</span><div class="money">€620</div></div>
      <div><span class="kicker">Needs</span><div class="money">€3,100</div></div>
      <div><span class="kicker">Live</span><div class="money">€1,010</div></div>
      <div><span class="kicker">Save</span><div class="money">€1,470</div></div>
    </div>
    <a class="stamp wide" href="{back}">That’s the split</a>
    """


def wealth_body(p, tab="summary"):
    s = u(p, "wealth.html", "mobile-wealth.html")
    a = u(p, "wealth-assets.html", "mobile-wealth.html")
    d = u(p, "wealth-debts.html", "mobile-wealth-liabilities.html")
    return f"""
    <h1 class="screen">What you own</h1>
    <div class="seg">
      <a class="{"on" if tab == "summary" else ""}" href="{s}">Summary</a>
      <a class="{"on" if tab == "assets" else ""}" href="{a}">Assets</a>
      <a class="{"on" if tab == "debts" else ""}" href="{d}">Debts</a>
    </div>
    <section class="hero">
      <span class="kicker">Household</span>
      <div class="money">€54,180</div>
      <p class="pace">+€980 this month · 4.3 months of cushion</p>
    </section>
    <div class="stats">
      <div class="stat"><span class="kicker">Assets</span><div class="money amt pos">€59,980</div></div>
      <div class="stat"><span class="kicker">Debts</span><div class="money amt hot">€5,800</div></div>
      <div class="stat"><span class="kicker">Cushion</span><div class="money">4.3 mo</div></div>
    </div>
    <h2>Jars of the balance sheet</h2>
    <div class="grid-pools">
      {pool("Cash", "€11,200", 70, "var(--move)", "🏦", "3 accounts", u(p, "wealth-accounts.html", "mobile-wealth-accounts.html"))}
      {pool("Savings", "€8,200", 82, "var(--save)", "🛟", "1 fund", u(p, "wealth-savings.html", "mobile-wealth.html"))}
      {pool("Invested", "€39,080", 88, "var(--groc)", "📈", "VWCE · SXR8", u(p, "wealth-investments.html", "mobile-wealth-investments.html"))}
      {pool("Lent", "€1,500", 40, "var(--house)", "🤝", "1 loan out", u(p, "wealth-loans.html", "mobile-wealth-loans.html"))}
      {pool("Debts", "−€5,800", 22, "var(--dine)", "📉", "pay on a calendar", u(p, "wealth-liabilities.html", "mobile-wealth-liabilities.html"))}
    </div>
    """


def wealth_list(p, title, note, items):
    return f'<h1 class="screen">{title}</h1><p class="note">{note}</p>' + "".join(
        row(*item) for item in items
    )


def insights_body(p):
    cal = u(p, "insights-calendar.html", "mobile-insights-calendar.html")
    cat = u(p, "insights-dining.html", "mobile-insights.html")
    return f"""
    <h1 class="screen">The read</h1>
    <div class="seg"><button class="on">Month</button><button>Quarter</button><button>Year</button></div>
    <div class="stats">
      <div class="stat"><span class="kicker">Daily spend</span><div class="money">€142.72</div></div>
      <div class="stat"><span class="kicker">Daily guide</span><div class="money amt pos">€244.78</div></div>
      <div class="stat"><span class="kicker">Gap</span><div class="money">−€102</div></div>
    </div>
    <p class="note">You’re under the calendar. Housing was rent on the 1st. Dining is the only puddle.</p>
    <div class="stack">
      <i style="width:52%;background:var(--house)"></i>
      <i style="width:27%;background:var(--give)"></i>
      <i style="width:9%;background:var(--groc)"></i>
      <i style="width:8%;background:var(--dine)"></i>
      <i style="width:4%;background:var(--move)"></i>
    </div>
    <a class="rank" href="{cat}"><span class="pip" style="background:var(--house)"></span><span>Housing</span><b>€1,180</b><span class="sub">52%</span></a>
    <div class="rank"><span class="pip" style="background:var(--give)"></span><span>Giving</span><b>€620</b><span class="sub">27%</span></div>
    <div class="rank"><span class="pip" style="background:var(--groc)"></span><span>Groceries</span><b>€186</b><span class="sub">8%</span></div>
    <a class="rank" href="{cat}"><span class="pip" style="background:var(--dine)"></span><span>Dining</span><b>€252</b><span class="sub">11%</span></a>
    <p class="pace" style="margin-top:18px"><a href="{cal}" style="color:var(--zap);font-weight:800">Heavy days on the calendar</a></p>
    """


def calendar_body(p):
    cells = ['<span class="k">M</span>'] * 0
    heads = "".join(f'<span class="k">{d}</span>' for d in "MTWTFSS")
    days = []
    for i in range(1, 32):
        cls = "on" if i == 13 else ("hot" if i in (1, 3, 8, 12, 13) else "")
        days.append(f'<span class="{cls}">{i}</span>')
    return f"""
    <h1 class="screen">August heat</h1>
    <p class="note">Orange days spent more. The 1st is rent and tithe — loud, not leaky.</p>
    <div class="cal">{heads}{''.join(days)}</div>
    """


def dining_body(p):
    return f"""
    <h1 class="screen">Dining</h1>
    <section class="hero">
      <span class="kicker">This month</span>
      <div class="money amt hot">€252</div>
      <p class="pace">+€38 vs July <span class="pill hot">Watch</span></p>
    </section>
    {tx("dine", "🍜", "El Nacional", "13 Aug · CaixaBank", "−28.40")}
    {tx("dine", "🍕", "Can Pizza", "9 Aug · Wise", "−19.80")}
    {tx("dine", "☕", "Satan’s Coffee", "7 Aug · CaixaBank", "−4.60")}
    """


def review_body(p):
    return f"""
    <h1 class="screen">Parked lines</h1>
    <p class="note">Two imports still need a bowl. Flick right to assign, left to skip.</p>
    <div class="stacker">
      <div class="card-swipe">
        <span class="kicker">12 Aug · CaixaBank · −€12.50</span>
        <h2>Unknown POS 4412</h2>
        <p class="note">Looks like a card tap. Dining or groceries?</p>
        <div class="chips"><span class="chip on">Dining</span><span class="chip">Groceries</span><span class="chip">Skip</span></div>
      </div>
    </div>
    {row("Farmacia Palau", "8 Aug · −€18.90", "Health")}
    <a class="stamp wide" href="{u(p, "home.html", "mobile.html")}">That’s the pile</a>
    """


def import_body(p):
    nxt = u(p, "import-review.html", "mobile-import.html")
    return f"""
    <h1 class="screen">Pour a statement in</h1>
    <p class="note">CaixaBank or Wise. We don’t post a line until you give it a bowl.</p>
    <div class="drop">
      <b>Drop the CSV here</b>
      <div class="sub">or tap a bank</div>
    </div>
    <div class="banks">
      <a class="row" href="{nxt}"><div><b>CaixaBank</b><div class="sub">ES statement</div></div><span>→</span></a>
      <a class="row" href="{nxt}"><div><b>Wise</b><div class="sub">Multi-currency</div></div><span>→</span></a>
    </div>
    """


def import_review_body(p):
    return f"""
    <h1 class="screen">12 lines landed</h1>
    <p class="note">Nothing is in the books until you stamp them.</p>
    {row("El Nacional", "Dining · −€28.40", "ok")}
    {row("Unknown POS 4412", "Needs a bowl · −€12.50", "park")}
    {row("Veritas Gràcia", "Groceries · −€41.22", "ok")}
    <a class="stamp wide" href="{u(p, "review.html", "mobile-review.html")}">Post the ready ones</a>
    """


def wisdom_body(p, tab="stewardship"):
    tabs = [
        ("stewardship", "Stewardship", "wisdom.html", "mobile-wisdom.html"),
        ("methods", "Methods", "wisdom-methods.html", "mobile-wisdom.html"),
        ("principles", "Principles", "wisdom-principles.html", "mobile-wisdom.html"),
        ("tools", "Tools", "wisdom-tools.html", "mobile-wisdom.html"),
    ]
    seg = "".join(
        f'<a class="{"on" if key == tab else ""}" href="{u(p, d, m)}">{label}</a>'
        for key, label, d, m in tabs
    )
    blocks = {
        "stewardship": """
        <p class="note">Money is a tool. Giving is a first move, not a leftover.</p>
        {0}
        {1}
        {2}
        {3}
        """.format(
            row("Give first", "The giving pool fills on payday."),
            row("Roof before restaurants", "Rent is a date. Don’t read it as a leak."),
            row("Do not spend tomorrow", "Daily guide is the throttle."),
            row("Own more than you owe", "Consumer debt is weight."),
        ),
        "methods": "".join(
            row(n, t)
            for n, t in [
                ("50 / 30 / 20", "Needs, wants, future"),
                ("5 Jars", "Give first, then the rest"),
                ("Zero-based", "Every euro gets a job"),
            ]
        ),
        "principles": "".join(
            row(n, t)
            for n, t in [
                ("Honour God with firstfruits", "Proverbs 3:9-10"),
                ("The ant stores in summer", "Proverbs 6:6-8"),
                ("The borrower is servant", "Proverbs 22:7"),
            ]
        ),
        "tools": "".join(
            row(n, t)
            for n, t in [
                ("YNAB", "Every dollar a job"),
                ("GoodBudget", "Digital envelopes"),
                ("This household", "Pools you can feel"),
            ]
        ),
    }
    return f'<h1 class="screen">Wisdom</h1><div class="seg">{seg}</div>{blocks[tab]}'


def settings_body(p):
    return f"""
    <h1 class="screen">Settings</h1>
    {row("Setup guide", "Income, bills, debts, a goal", "Open", u(p, "onboarding.html", "mobile-onboarding.html"))}
    <div class="row"><div><b>Language</b></div><div class="seg" style="margin:0"><button class="on">EN</button><button>ES</button></div></div>
    <div class="row"><div><b>Currency</b><div class="sub">Convert on read. Keep originals.</div></div><span>EUR</span></div>
    <div class="row"><div><b>What the bank shows today</b><div class="sub">Last check · 12 Aug</div></div><span>€3,916.40</span></div>
    {row("Category roles", "Feeds Insights. Seeds pools.", "Edit", u(p, "settings-classify.html", "mobile-settings.html"))}
    <div class="row"><div><b>Appearance</b></div><div class="seg" style="margin:0"><button class="on">Light</button><button>Dark</button></div></div>
    {row("Log out", "jp@household.eu", "", u(p, "login.html", "mobile-login.html"))}
    """


def classify_body(p):
    return f"""
    <h1 class="screen">Category roles</h1>
    <p class="note">A role decides which bowl a category jumps into when you apply a method.</p>
    {row("Dining", "Want · spending ceiling", "Edit")}
    {row("Housing", "Need · spending ceiling", "Edit")}
    {row("Giving", "Give · contribution goal", "Edit")}
    {row("Tithe", "Give · contribution goal", "Edit")}
    """


def capture_body(p, income=False):
    home = u(p, "home.html", "mobile.html")
    other = u(p, "capture-income.html", "mobile-capture-income.html")
    exp = u(p, "capture.html", "mobile-capture.html")
    return f"""
    <h1 class="screen">{"Stamp income" if income else "Stamp a spend"}</h1>
    <div class="seg">
      <a class="{"on" if not income else ""}" href="{exp}">Out</a>
      <a class="{"on" if income else ""}" href="{other}">In</a>
    </div>
    <div class="amount-hero">
      <span class="kicker">Amount</span>
      <div class="money" data-amount="{ "620000" if income else "2840" }">€{"6,200.00" if income else "28.40"}</div>
    </div>
    <div class="keys">
      <button data-key="1">1</button><button data-key="2">2</button><button data-key="3">3</button>
      <button data-key="4">4</button><button data-key="5">5</button><button data-key="6">6</button>
      <button data-key="7">7</button><button data-key="8">8</button><button data-key="9">9</button>
      <button data-key="00">00</button><button data-key="0">0</button><button data-key="del">⌫</button>
    </div>
    <div class="chips">
      <span class="chip on">{"Income" if income else "Dining"}</span>
      <span class="chip">{"Wise" if income else "Groceries"}</span>
      <span class="chip">{"CaixaBank" if income else "Transit"}</span>
    </div>
    <a class="stamp wide" href="{home}">{"Drop it in" if income else "Take it from Dining"}</a>
    """


def onboarding_body(p, step, title, note, extra, next_href):
    pips = "".join(f'<i class="{"on" if i <= step else ""}"></i>' for i in range(6))
    skip = u(p, "home.html", "mobile.html")
    return f"""
    <h1 class="screen">{title}</h1>
    <div class="steps">{pips}</div>
    <p class="note">{note}</p>
    {extra}
    <div class="anchor">
      <a class="stamp wide" href="{next_href}">{"Finish" if step == 5 else "Keep going"}</a>
      <p class="pace" style="justify-content:center"><a href="{skip}">Skip for now</a></p>
    </div>
    """


def login_body(p, signup=False):
    go = u(p, "home.html", "mobile.html")
    other = u(p, "signup.html", "mobile-signup.html") if not signup else u(p, "login.html", "mobile-login.html")
    return f"""
    <a class="mark" href="index.html">{BOLT}Budget &amp; Expense</a>
    <h1>{"Make a household" if signup else "Hey."}</h1>
    <p class="note">{"Two minutes. Then the books are yours." if signup else "Let’s open the books."}</p>
    <div class="field"><label>Email</label><input value="jp@household.eu" /></div>
    <div class="field"><label>Password</label><input type="password" value="••••••••••••" /></div>
    <a class="stamp wide" href="{go}">{"Create it" if signup else "I’m in"}</a>
    <p class="pace" style="margin-top:18px">{"Already here?" if signup else "New here?"} <a href="{other}" style="color:var(--zap);font-weight:800">{"Sign in" if signup else "Sign up"}</a></p>
    """


def command_overlay(p=False):
    return f"""
    <div class="veil">
      <div class="cmd">
        <input value="Where to?" />
        <div class="g-sec">Sections</div>
        {row("Home", "", "", u(p, "home.html", "mobile.html"))}
        {row("Movements", "", "", u(p, "movements.html", "mobile-movements.html"))}
        {row("Budget", "", "", u(p, "budget.html", "mobile-budget.html"))}
        {row("Net worth", "", "", u(p, "wealth.html", "mobile-wealth.html"))}
        {row("Insights", "", "", u(p, "insights.html", "mobile-insights.html"))}
        <div class="g-sec">More</div>
        {row("Review", "2 parked", "2", u(p, "review.html", "mobile-review.html"))}
        {row("Import", "", "", u(p, "import.html", "mobile-import.html"))}
        {row("Wisdom", "", "", u(p, "wisdom.html", "mobile-wisdom.html"))}
        {row("Settings", "", "", u(p, "settings.html", "mobile-settings.html"))}
        <a class="stamp ghost wide" href="{u(p, "home.html", "mobile.html")}">Close</a>
      </div>
    </div>
    """


def more_sheet():
    return f"""
    <div class="more-sheet">
      <span class="kicker">Account</span>
      <p class="note" style="margin:4px 0 8px">jp@household.eu</p>
      {row("Review", "2 parked lines", "2", "mobile-review.html")}
      {row("Import", "", "", "mobile-import.html")}
      {row("Wisdom", "", "", "mobile-wisdom.html")}
      {row("Settings", "", "", "mobile-settings.html")}
      <div class="row"><div><b>Language</b></div><div class="seg" style="margin:0"><button class="on">EN</button><button>ES</button></div></div>
      <div class="row"><div><b>Currency</b></div><span>EUR</span></div>
      {row("Log out", "", "", "mobile-login.html")}
    </div>
    """


def index_html():
    desktop = [
        ("home.html", "Home", "Spendable + pools + feed"),
        ("command.html", "Go to…", "Jump anywhere"),
        ("movements.html", "Movements", "All"),
        ("movements-out.html", "Movements · Out", ""),
        ("movements-in.html", "Movements · In", ""),
        ("movements-recurring.html", "Bills", "Recurring"),
        ("budget.html", "Budget", "Circular pools"),
        ("budget-new.html", "New pool", ""),
        ("budget-edit.html", "Dining pool", ""),
        ("budget-method.html", "Six methods", ""),
        ("budget-plan.html", "Monthly plan", ""),
        ("wealth.html", "Net worth", "Balance-sheet jars"),
        ("wealth-assets.html", "Assets", ""),
        ("wealth-debts.html", "Debts", ""),
        ("wealth-accounts.html", "Accounts & cash", ""),
        ("wealth-account.html", "CaixaBank", "Account"),
        ("wealth-savings.html", "Savings", ""),
        ("wealth-investments.html", "Investments", ""),
        ("wealth-investment.html", "VWCE", ""),
        ("wealth-loans.html", "Money lent", ""),
        ("wealth-loan.html", "Loan out", ""),
        ("wealth-liabilities.html", "Liabilities", ""),
        ("wealth-liability.html", "Loan in", ""),
        ("insights.html", "Insights", "The read"),
        ("insights-calendar.html", "Calendar", ""),
        ("insights-dining.html", "Dining", ""),
        ("review.html", "Review", "Flick to assign"),
        ("import.html", "Import", "CaixaBank / Wise"),
        ("import-review.html", "Import review", ""),
        ("wisdom.html", "Wisdom", "Stewardship"),
        ("wisdom-methods.html", "Wisdom · Methods", ""),
        ("wisdom-principles.html", "Wisdom · Principles", ""),
        ("wisdom-tools.html", "Wisdom · Tools", ""),
        ("settings.html", "Settings", ""),
        ("settings-classify.html", "Category roles", ""),
        ("capture.html", "Add spend", "Keypad"),
        ("capture-income.html", "Add income", ""),
        ("onboarding.html", "Setup · Welcome", ""),
        ("onboarding-income.html", "Setup · Income", ""),
        ("onboarding-recurring.html", "Setup · Bills", ""),
        ("onboarding-debt.html", "Setup · Debt", ""),
        ("onboarding-goals.html", "Setup · Goals", ""),
        ("onboarding-suggestions.html", "Setup · Plan", ""),
        ("login.html", "Sign in", ""),
        ("signup.html", "Sign up", ""),
    ]
    phone = [
        ("mobile.html", "Home", ""),
        ("mobile-more.html", "Account sheet", ""),
        ("mobile-movements.html", "Movements", ""),
        ("mobile-movements-out.html", "Out", ""),
        ("mobile-movements-in.html", "In", ""),
        ("mobile-movements-recurring.html", "Bills", ""),
        ("mobile-budget.html", "Budget", ""),
        ("mobile-budget-new.html", "New pool", ""),
        ("mobile-budget-method.html", "Method", ""),
        ("mobile-budget-plan.html", "Plan", ""),
        ("mobile-wealth.html", "Net worth", ""),
        ("mobile-wealth-accounts.html", "Accounts", ""),
        ("mobile-wealth-investments.html", "Investments", ""),
        ("mobile-wealth-loans.html", "Lent", ""),
        ("mobile-wealth-liabilities.html", "Debts", ""),
        ("mobile-insights.html", "Insights", ""),
        ("mobile-insights-calendar.html", "Calendar", ""),
        ("mobile-review.html", "Review", ""),
        ("mobile-import.html", "Import", ""),
        ("mobile-wisdom.html", "Wisdom", ""),
        ("mobile-settings.html", "Settings", ""),
        ("mobile-capture.html", "Add spend", ""),
        ("mobile-capture-income.html", "Add income", ""),
        ("mobile-onboarding.html", "Setup", ""),
        ("mobile-login.html", "Sign in", ""),
        ("mobile-signup.html", "Sign up", ""),
    ]

    def grid(items):
        return "".join(
            f'<a href="{href}">{name}<span>{span}</span></a>' for href, name, span in items
        )

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>If the household ran on Up</title>
  <link rel="stylesheet" href="upsider.css" />
</head>
<body>
  <div class="gallery">
    <a class="mark" href="home.html">{BOLT}Budget &amp; Expense</a>
    <h1>If the household ran on Up.</h1>
    <p>A full-app redesign from Up’s real product language: spendable first, volumetric pools, black outflows, orange stamps, swipe sections. Not glass. Not a dashboard. Not copied from the other mockups in this repo.</p>
    <p class="note">Swipe sideways on Home → Insights. Drag the pointer to slosh the bowls. Stamp buttons press in.</p>
    <div class="g-sec">Start here</div>
    <div class="g-grid">
      <a href="home.html">Desktop home<span>The whole app</span></a>
      <a href="mobile.html">Phone home<span>How it feels in the hand</span></a>
    </div>
    <div class="g-sec">Desktop</div>
    <div class="g-grid">{grid(desktop)}</div>
    <div class="g-sec">Phone</div>
    <div class="g-grid">{grid(phone)}</div>
  </div>
</body>
</html>
"""


def write(name, html):
    (ROOT / name).write_text(html, encoding="utf-8")


def main():
    write("index.html", index_html())

    pages = []

    def add(name, title, section, body, phone=False, extra=""):
        write(name, document(title, body, section, phone, extra))

    # Desktop
    add("home.html", "Home", "home", home_body(False))
    add("command.html", "Go to…", "home", home_body(False), extra=command_overlay(False))
    add("movements.html", "Movements", "movements", movements_body(False, "all"))
    add("movements-out.html", "Out", "movements", movements_body(False, "out"))
    add("movements-in.html", "In", "movements", movements_body(False, "in"))
    add("movements-recurring.html", "Bills", "movements", movements_body(False, "recurring"))
    add("budget.html", "Budget", "budget", budget_body(False))
    add("budget-new.html", "New pool", "budget", budget_new_body(False))
    add("budget-edit.html", "Dining", "budget", budget_edit_body(False))
    add("budget-method.html", "Method", "budget", budget_method_body(False))
    add("budget-plan.html", "Plan", "budget", budget_plan_body(False))
    add("wealth.html", "Net worth", "wealth", wealth_body(False))
    add("wealth-assets.html", "Assets", "wealth", wealth_body(False, "assets"))
    add("wealth-debts.html", "Debts", "wealth", wealth_body(False, "debts"))
    add(
        "wealth-accounts.html",
        "Accounts",
        "wealth",
        wealth_list(
            False,
            "Cash",
            "Money you can actually reach.",
            [
                ("CaixaBank", "ES · everyday", "€7,140", "wealth-account.html"),
                ("Wise EUR", "Buffer", "€3,260", "wealth-account.html"),
                ("Cash", "Wallet", "€800", "wealth-account.html"),
            ],
        ),
    )
    add(
        "wealth-account.html",
        "CaixaBank",
        "wealth",
        '<h1 class="screen">CaixaBank</h1><section class="hero"><span class="kicker">Available</span><div class="money">€7,140</div></section>'
        + row("Kind", "Everyday spending", "")
        + row("Last seen", "12 Aug", ""),
    )
    add(
        "wealth-savings.html",
        "Savings",
        "wealth",
        wealth_list(False, "Savings", "The emergency bowl.", [("Emergency fund", "Goal €10,000", "€8,200", "wealth.html")]),
    )
    add(
        "wealth-investments.html",
        "Investments",
        "wealth",
        wealth_list(
            False,
            "Invested",
            "Long game.",
            [("VWCE", "IE00BK5BQT80", "€28,400", "wealth-investment.html"), ("SXR8", "S&amp;P 500", "€10,680", "wealth-investment.html")],
        ),
    )
    add(
        "wealth-investment.html",
        "VWCE",
        "wealth",
        '<h1 class="screen">VWCE</h1><section class="hero"><span class="kicker">Holding</span><div class="money">€28,400</div><p class="pace">42 shares · FTSE All-World</p></section>',
    )
    add(
        "wealth-loans.html",
        "Lent",
        "wealth",
        wealth_list(False, "Money lent", "Still yours.", [("Marta", "Due Dec 2026", "€1,500", "wealth-loan.html")]),
    )
    add(
        "wealth-loan.html",
        "Loan",
        "wealth",
        '<h1 class="screen">Marta</h1><section class="hero"><span class="kicker">Outstanding</span><div class="money">€1,500</div></section>'
        + row("Due", "Dec 2026", ""),
    )
    add(
        "wealth-liabilities.html",
        "Debts",
        "wealth",
        wealth_list(False, "Debts", "Pay them on a calendar.", [("Car loan", "Openbank", "€5,800", "wealth-liability.html")]),
    )
    add(
        "wealth-liability.html",
        "Car loan",
        "wealth",
        '<h1 class="screen">Car loan</h1><section class="hero"><span class="kicker">Left to pay</span><div class="money amt hot">€5,800</div></section>'
        + row("Payment", "€210 / month", ""),
    )
    add("insights.html", "Insights", "insights", insights_body(False))
    add("insights-calendar.html", "Calendar", "insights", calendar_body(False))
    add("insights-dining.html", "Dining", "insights", dining_body(False))
    add("review.html", "Review", "review", review_body(False))
    add("import.html", "Import", "import", import_body(False))
    add("import-review.html", "Import review", "import", import_review_body(False))
    add("wisdom.html", "Wisdom", "wisdom", wisdom_body(False, "stewardship"))
    add("wisdom-methods.html", "Methods", "wisdom", wisdom_body(False, "methods"))
    add("wisdom-principles.html", "Principles", "wisdom", wisdom_body(False, "principles"))
    add("wisdom-tools.html", "Wisdom tools", "wisdom", wisdom_body(False, "tools"))
    add("settings.html", "Settings", "settings", settings_body(False))
    add("settings-classify.html", "Roles", "settings", classify_body(False))
    add("capture.html", "Add spend", "home", capture_body(False, False))
    add("capture-income.html", "Add income", "home", capture_body(False, True))

    ob = [
        (
            "onboarding.html",
            0,
            "Let’s set the table.",
            "Income, bills, a debt, a goal. About two minutes. You can skip any plate.",
            "",
            "onboarding-income.html",
        ),
        (
            "onboarding-income.html",
            1,
            "What lands each month?",
            "A round number is fine. We’ll split it into bowls.",
            '<div class="field"><label>Take-home</label><input value="6200" /></div>',
            "onboarding-recurring.html",
        ),
        (
            "onboarding-recurring.html",
            2,
            "What always leaves?",
            "Rent, tithe, the boring stuff. Dates, not leaks.",
            row("Alquiler", "1st · €1,180") + row("Tithe", "1st · 10%"),
            "onboarding-debt.html",
        ),
        (
            "onboarding-debt.html",
            3,
            "Anything you owe?",
            "Name it so it can’t hide.",
            row("Car loan", "€5,800 left"),
            "onboarding-goals.html",
        ),
        (
            "onboarding-goals.html",
            4,
            "What’s the point?",
            "We’ll tilt the pools toward this.",
            '<div class="chips"><span class="chip on">Give first</span><span class="chip">Kill the car loan</span><span class="chip">Grow the cushion</span></div>',
            "onboarding-suggestions.html",
        ),
        (
            "onboarding-suggestions.html",
            5,
            "5 Jars feels right.",
            "Give first, then save, invest, live. You can swap methods later.",
            row("Give", "€620") + row("Live", "€3,100") + row("Save + invest", "€2,480"),
            "home.html",
        ),
    ]
    for name, step, title, note, extra, nxt in ob:
        add(name, title, "settings", onboarding_body(False, step, title, note, extra, nxt))

    write("login.html", auth_doc("Sign in", login_body(False, False)))
    write("signup.html", auth_doc("Sign up", login_body(False, True)))

    # Phone
    add("mobile.html", "Home", "home", home_body(True), True)
    add("mobile-more.html", "Account", "home", home_body(True), True, more_sheet())
    add("mobile-movements.html", "Movements", "movements", movements_body(True, "all"), True)
    add("mobile-movements-out.html", "Out", "movements", movements_body(True, "out"), True)
    add("mobile-movements-in.html", "In", "movements", movements_body(True, "in"), True)
    add("mobile-movements-recurring.html", "Bills", "movements", movements_body(True, "recurring"), True)
    add("mobile-budget.html", "Budget", "budget", budget_body(True), True)
    add("mobile-budget-new.html", "New pool", "budget", budget_new_body(True), True)
    add("mobile-budget-method.html", "Method", "budget", budget_method_body(True), True)
    add("mobile-budget-plan.html", "Plan", "budget", budget_plan_body(True), True)
    add("mobile-wealth.html", "Net worth", "wealth", wealth_body(True), True)
    add(
        "mobile-wealth-accounts.html",
        "Accounts",
        "wealth",
        wealth_list(
            True,
            "Cash",
            "Money you can actually reach.",
            [
                ("CaixaBank", "Everyday", "€7,140", "mobile-wealth.html"),
                ("Wise EUR", "Buffer", "€3,260", "mobile-wealth.html"),
            ],
        ),
        True,
    )
    add(
        "mobile-wealth-investments.html",
        "Invested",
        "wealth",
        wealth_list(True, "Invested", "Long game.", [("VWCE", "All-World", "€28,400", "mobile-wealth.html")]),
        True,
    )
    add(
        "mobile-wealth-loans.html",
        "Lent",
        "wealth",
        wealth_list(True, "Money lent", "Still yours.", [("Marta", "Due Dec", "€1,500", "mobile-wealth.html")]),
        True,
    )
    add(
        "mobile-wealth-liabilities.html",
        "Debts",
        "wealth",
        wealth_list(True, "Debts", "Pay on a calendar.", [("Car loan", "Openbank", "€5,800", "mobile-wealth.html")]),
        True,
    )
    add("mobile-insights.html", "Insights", "insights", insights_body(True), True)
    add("mobile-insights-calendar.html", "Calendar", "insights", calendar_body(True), True)
    add("mobile-review.html", "Review", "review", review_body(True), True)
    add("mobile-import.html", "Import", "import", import_body(True), True)
    add("mobile-wisdom.html", "Wisdom", "wisdom", wisdom_body(True), True)
    add("mobile-settings.html", "Settings", "settings", settings_body(True), True)
    add("mobile-capture.html", "Add spend", "home", capture_body(True, False), True)
    add("mobile-capture-income.html", "Add income", "home", capture_body(True, True), True)
    add(
        "mobile-onboarding.html",
        "Setup",
        "settings",
        onboarding_body(
            True,
            0,
            "Let’s set the table.",
            "Income, bills, a debt, a goal. About two minutes.",
            "",
            "mobile.html",
        ),
        True,
    )
    add("mobile-login.html", "Sign in", "", login_body(True, False), True)
    add("mobile-signup.html", "Sign up", "", login_body(True, True), True)

    print(f"wrote {len(list(ROOT.glob('*.html')))} html files")


if __name__ == "__main__":
    main()
