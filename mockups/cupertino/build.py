#!/usr/bin/env python3
"""Cupertino — Apple-team finance app mockups of the live IA."""
from pathlib import Path

ROOT = Path(__file__).parent

ICONS = {
    "home": '<path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"/>',
    "movements": '<path d="M7 7h10M17 7l-3-3M17 7l-3 3M17 17H7M7 17l3-3M7 17l3 3"/>',
    "budget": '<rect x="3.5" y="6" width="17" height="12" rx="2"/><path d="M3.5 10h17"/>',
    "wealth": '<path d="M4 20h16M6 20V10l6-4 6 4v10M10 20v-5h4v5"/>',
    "insights": '<path d="M5 19V11M10 19V5M15 19v-7M20 19V8"/>',
    "review": '<path d="M5 6h14M5 12h10M5 18h7"/>',
    "import": '<path d="M12 4v10M8 10l4 4 4-4M5 20h14"/>',
    "wisdom": '<path d="M5 5v14l7-3 7 3V5L12 8 5 5Z"/>',
    "settings": '<circle cx="12" cy="12" r="3"/><path d="M12 3.5v2.2M12 18.3v2.2M4.9 6.5l1.6 1.6M17.5 16.9l1.6 1.6M3.5 12h2.2M18.3 12h2.2M4.9 17.5l1.6-1.6M17.5 7.1l1.6-1.6"/>',
    "plus": '<path d="M12 6v12M6 12h12"/>',
    "search": '<circle cx="11" cy="11" r="6"/><path d="m20 20-3.5-3.5"/>',
    "sun": '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/>',
}


def svg(name: str, size: int = 18) -> str:
    return (
        f'<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" '
        f'stroke="currentColor" stroke-width="1.8" stroke-linecap="round" '
        f'stroke-linejoin="round">{ICONS[name]}</svg>'
    )


PRIMARY = [
    ("home", "Home", "home.html"),
    ("movements", "Movements", "movements.html"),
    ("budget", "Budget", "budget.html"),
    ("wealth", "Net worth", "wealth.html"),
    ("insights", "Insights", "insights.html"),
]
SECONDARY = [
    ("review", "Review", "review.html"),
    ("import", "Import", "import.html"),
    ("wisdom", "Wisdom", "wisdom.html"),
    ("settings", "Settings", "settings.html"),
]
PHONE_PRIMARY = [
    ("home", "Home", "mobile.html"),
    ("movements", "Movements", "mobile-movements.html"),
    ("budget", "Budget", "mobile-budget.html"),
    ("wealth", "Worth", "mobile-wealth.html"),
    ("insights", "Insights", "mobile-insights.html"),
]

TX = """
      <div class="tx"><span class="av dine">D</span><div><div class="name">Can Recasens</div><div class="sub">Dining · Santander · 13 Aug</div></div><span class="amt">−42.80</span></div>
      <div class="tx"><span class="av groc">G</span><div><div class="name">Mercadona</div><div class="sub">Groceries · Santander · 12 Aug</div></div><span class="amt">−67.14</span></div>
      <div class="tx"><span class="av unk">?</span><div><div class="name">Unknown POS 8821</div><div class="sub">Needs a category · 11 Aug</div></div><span class="amt">−18.90</span></div>
      <div class="tx"><span class="av move">T</span><div><div class="name">TMB T-usual</div><div class="sub">Transport · Wise · 11 Aug</div></div><span class="amt">−22.00</span></div>
      <div class="tx"><span class="av give">†</span><div><div class="name">Tithe</div><div class="sub">Giving · 3 Aug</div></div><span class="amt">−640.00</span></div>
      <div class="tx"><span class="av house">H</span><div><div class="name">Alquiler August</div><div class="sub">Housing · 1 Aug</div></div><span class="amt">−1,150.00</span></div>
      <div class="tx"><span class="av in">+</span><div><div class="name">Client retainer</div><div class="sub">Income · Wise · 1 Aug</div></div><span class="amt pos">+6,400.00</span></div>
"""

CAL = """
    <div class="group-box"><div class="cal">
      <span class="k">M</span><span class="k">T</span><span class="k">W</span><span class="k">T</span><span class="k">F</span><span class="k">S</span><span class="k">S</span>
      <span></span><span></span><span></span><span></span><span></span><span class="hot">1</span><span>2</span>
      <span class="hot">3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span><span>9</span>
      <span>10</span><span>11</span><span class="hot">12</span><span class="on">13</span><span>14</span><span>15</span><span>16</span>
      <span>17</span><span>18</span><span>19</span><span>20</span><span>21</span><span>22</span><span>23</span>
      <span>24</span><span>25</span><span>26</span><span>27</span><span>28</span><span>29</span><span>30</span>
      <span>31</span>
    </div></div>
"""


def side(active: str) -> str:
    bits = []
    for key, label, href in PRIMARY:
        on = ' class="on"' if key == active else ""
        bits.append(f'<a{on} href="{href}">{svg(key)}{label}</a>')
    bits.append('<div class="group">')
    for key, label, href in SECONDARY:
        on = ' class="on"' if key == active else ""
        badge = '<span class="badge">3</span>' if key == "review" else ""
        bits.append(f'<a{on} href="{href}">{svg(key)}{label}{badge}</a>')
    bits.append("</div>")
    return "\n        ".join(bits)


def trail(extra: str = "") -> str:
    return f"""<div class="trail">
        <a class="search" href="command.html">Search</a>
        <div class="seg"><button class="on">EN</button><button>ES</button></div>
        <button class="btn">EUR</button>
        <a class="icon-btn" href="settings.html" title="Appearance">{svg("sun")}</a>
        {extra}
        <a class="icon-btn add" href="capture.html" title="Add">{svg("plus")}</a>
      </div>"""


def page(title: str, body: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{title} — Budget &amp; Expense</title>
  <link rel="stylesheet" href="app.css" />
</head>
<body>
{body}
</body>
</html>
"""


def mac(title: str, active: str, inner: str, extra: str = "", wide: bool = False) -> str:
    w = " wide" if wide else ""
    return page(
        title,
        f"""  <div class="app">
    <aside class="side">
      <a class="brand" href="index.html"><i>{svg("budget", 16)}</i>Budget &amp; Expense</a>
      <nav>
        {side(active)}
      </nav>
      <div class="foot">
        <a href="login.html">Log out</a>
      </div>
    </aside>
    <div class="main">
      <header class="bar">
        <h1>{title}</h1>
        {trail(extra)}
      </header>
      <div class="scroll{w}">
{inner}
      </div>
    </div>
  </div>""",
    )


def dots(active: str | None) -> str:
    bits = []
    for key, label, href in PHONE_PRIMARY:
        on = ' class="on"' if key == active else ""
        bits.append(f'<a{on} href="{href}">{svg(key, 22)}{label}</a>')
    return "\n          ".join(bits)


def phone(title: str, heading: str, inner: str, active: str | None, extra: str = "", add: bool = True) -> str:
    add_html = f'<a class="icon-btn add" href="mobile-capture.html">{svg("plus")}</a>' if add else ""
    head = (
        f"""          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
            <div class="lt">{heading}</div>
            {add_html}
          </div>
"""
        if heading
        else f"""          <div style="display:flex;justify-content:flex-end;margin-bottom:4px">{add_html}</div>
"""
    )
    return page(
        title,
        f"""  <div class="phone-wrap">
    <div>
      <p class="k" style="text-align:center;margin:0 0 12px;color:#fff"><a href="index.html">Phone</a></p>
      <div class="phone">
        <div class="notch"><span>21:39</span><a class="me" href="mobile-more.html">JP</a></div>
        <div class="phone-body">
{head}{inner}
        </div>
        {extra}
        <nav class="dots">
          {dots(active)}
        </nav>
      </div>
    </div>
  </div>""",
    )


def write(name: str, html: str) -> None:
    (ROOT / name).write_text(html, encoding="utf-8")


def seg(items: list[tuple[str, str, bool]]) -> str:
    bits = []
    for label, href, on in items:
        cls = ' class="on"' if on else ""
        bits.append(f'<a{cls} href="{href}">{label}</a>')
    return f'<div class="seg">{"".join(bits)}</div>'


REMAIN = """
    <div class="hrow"><h2>Remaining</h2><a href="budget.html">Budget</a></div>
    <div class="remain">
      <a class="watch" href="budget.html"><span class="k">Dining</span><span class="money">€34</span><span class="meta">Watch</span></a>
      <a href="budget.html"><span class="k">Housing</span><span class="money">€50</span><span class="meta">Left</span></a>
      <a href="budget.html"><span class="k">Groceries</span><span class="money">€236</span><span class="meta">Left</span></a>
      <a href="budget.html"><span class="k">Transport</span><span class="money">€46</span><span class="meta">Left</span></a>
      <a class="done" href="budget.html"><span class="k">Giving</span><span class="money">Done</span><span class="meta">This month</span></a>
    </div>
"""

home_inner = f"""
    <section class="hero">
      <span class="k">Spendable</span>
      <div class="money">€4,280.50</div>
      <p class="pace">18 days left · €142.68 a day <span class="pill">On Pace</span></p>
    </section>
{REMAIN}
    <div class="hrow"><h2>Activity</h2><a href="movements.html">See All</a></div>
    <section class="group-box">{TX}</section>
"""

home_phone = """
          <section class="hero">
            <span class="k">Spendable</span>
            <div class="money">€4,280.50</div>
            <p class="pace">18 days · €142.68 a day <span class="pill">On Pace</span></p>
          </section>
          <div class="remain">
            <a class="watch" href="mobile-budget.html"><span class="k">Dining</span><span class="money">€34</span><span class="meta">Watch</span></a>
            <a href="mobile-budget.html"><span class="k">Housing</span><span class="money">€50</span><span class="meta">Left</span></a>
            <a href="mobile-budget.html"><span class="k">Groceries</span><span class="money">€236</span><span class="meta">Left</span></a>
            <a class="done" href="mobile-budget.html"><span class="k">Giving</span><span class="money">Done</span><span class="meta">This month</span></a>
          </div>
          <div class="hrow"><h2>Activity</h2><a href="mobile-movements.html">See All</a></div>
          <section class="group-box">
            <div class="tx"><span class="av dine">D</span><div><div class="name">Can Recasens</div><div class="sub">Dining · 13 Aug</div></div><span class="amt">−42.80</span></div>
            <div class="tx"><span class="av groc">G</span><div><div class="name">Mercadona</div><div class="sub">Groceries · 12 Aug</div></div><span class="amt">−67.14</span></div>
            <div class="tx"><span class="av in">+</span><div><div class="name">Client retainer</div><div class="sub">Income · 1 Aug</div></div><span class="amt pos">+6,400</span></div>
          </section>
"""

move_tabs = lambda on: f"""
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin:8px 0 16px;flex-wrap:wrap">
      {seg([("All","movements.html", on=="all"),("Expenses","movements-out.html", on=="out"),("Income","movements-in.html", on=="in")])}
      <div style="display:flex;gap:8px">
        <a class="btn" href="movements-recurring.html">Recurring</a>
        <button class="btn">August 2026</button>
      </div>
    </div>
"""

move_stats = """
    <div class="stats">
      <div class="stat"><span class="k">Out</span><div class="money">€2,119.50</div></div>
      <div class="stat"><span class="k">In</span><div class="money pos">€6,400.00</div></div>
      <div class="stat"><span class="k">To Review</span><div class="money warn">3</div></div>
    </div>
"""

wealth_tabs = lambda on: f"""
    <div style="margin:8px 0 18px">{seg([("Summary","wealth.html", on=="summary"),("Assets","wealth-assets.html", on=="assets"),("Debts","wealth-debts.html", on=="debts")])}</div>
"""

wisdom_tabs = lambda on: f"""
    <div style="margin:8px 0 18px">{seg([
        ("Stewardship","wisdom.html", on=="stewardship"),
        ("Methods","wisdom-methods.html", on=="methods"),
        ("Principles","wisdom-principles.html", on=="principles"),
        ("Tools","wisdom-tools.html", on=="tools"),
    ])}</div>
"""

settings_inner = """
    <div class="group-box">
      <a class="row" href="onboarding.html"><div><b>Setup Guide</b><div class="sub">Resume income, bills, debts, and goals</div></div><span class="chev">›</span></a>
    </div>
    <div class="group-box">
      <div class="row"><div><b>Language</b><div class="sub">Used across the app</div></div><div class="seg"><button class="on">EN</button><button>ES</button></div></div>
      <div class="row"><div><b>Display Name</b><div class="sub">Juan Pablo</div></div><button class="btn">Save Name</button></div>
      <div class="row"><div><b>Currency</b><div class="sub">Amounts convert on read. Originals kept.</div></div><button class="btn">EUR</button></div>
    </div>
    <div class="group-box">
      <div class="row"><div><b>Available Bank Balance Today</b><div class="sub">Last reconciliation · 12 Aug · €4,280.50</div></div><button class="btn">Reconcile</button></div>
      <div class="field"><label>What the bank shows</label><input value="4280.50" /></div>
    </div>
    <div class="group-box">
      <div class="row"><div><b>Giving Target</b><div class="sub">Share of income for the giving envelope</div></div><span>10%</span></div>
      <a class="row" href="settings-classify.html"><div><b>Category Roles</b><div class="sub">Classification feeds Insights. Role seeds envelopes.</div></div><span class="chev">›</span></a>
      <a class="row" href="wealth-liabilities.html"><div><b>Debts &amp; Liabilities</b><div class="sub">Manage loans, mortgages, and credit in Wealth</div></div><span class="chev">›</span></a>
    </div>
    <div class="group-box">
      <div class="row"><div><b>Appearance</b><div class="sub">Light, Dark, or System</div></div><div class="seg"><button class="on">Light</button><button>Dark</button><button>System</button></div></div>
    </div>
    <div class="group-box">
      <div class="row"><div><b>Delete Account</b><div class="sub">Removes the household books. Cannot be undone.</div></div><button class="btn danger">Delete</button></div>
      <a class="row" href="login.html"><div><b>Log Out</b><div class="sub">juanpablo@example.com</div></div><span class="chev">›</span></a>
    </div>
"""

onboarding_steps = [
    ("onboarding.html", "Welcome", 1, """
      <p class="note">Income, recurring bills, debts, and a goal. About two minutes.</p>
      <a class="btn blue block" href="onboarding-income.html">Continue</a>
    """),
    ("onboarding-income.html", "Income", 2, """
      <div class="field"><label>Amount</label><input value="6400.00" /></div>
      <div class="field"><label>Currency</label><input value="EUR" /></div>
      <a class="btn blue block" href="onboarding-recurring.html">Continue</a>
    """),
    ("onboarding-recurring.html", "Recurring", 3, """
      <div class="row"><div><b>Alquiler</b><div class="sub">Housing · day 1 · €1,150</div></div></div>
      <div class="row"><div><b>Tithe</b><div class="sub">Giving · day 3 · €640</div></div></div>
      <a class="btn block" href="onboarding-recurring.html">Add a Bill</a>
      <a class="btn blue block" href="onboarding-debt.html">Continue</a>
    """),
    ("onboarding-debt.html", "Debt", 4, """
      <div class="row"><div><b>Santander consumer</b><div class="sub">Loan · €6,200</div></div></div>
      <a class="btn block" href="onboarding-debt.html">Add a Debt</a>
      <a class="btn blue block" href="onboarding-goals.html">Continue</a>
    """),
    ("onboarding-goals.html", "Goals", 5, """
      <div class="row"><div><b>Give generously</b></div><span class="pill">On</span></div>
      <div class="row"><div><b>Save more</b></div></div>
      <div class="row"><div><b>Build an emergency fund</b></div></div>
      <div class="row"><div><b>Pay off debt</b></div></div>
      <div class="row"><div><b>Increase wealth</b></div></div>
      <div class="row"><div><b>Track my budget</b></div></div>
      <div class="row"><div><b>Decrease expenses</b></div></div>
      <a class="btn blue block" href="onboarding-suggestions.html">Continue</a>
    """),
    ("onboarding-suggestions.html", "Plan", 6, """
      <p class="note">5 Jars, seeded from your numbers. You can still edit every envelope.</p>
      <div class="plan" style="margin:12px 16px 16px">
        <div><span class="k">Give</span><div class="money">10%</div></div>
        <div><span class="k">Needs</span><div class="money">55%</div></div>
        <div><span class="k">Wants</span><div class="money">12%</div></div>
        <div><span class="k">Save</span><div class="money">23%</div></div>
      </div>
      <a class="btn blue block" href="home.html">Open the Books</a>
    """),
]


def steps_bar(n: int) -> str:
    return '<div class="steps">' + "".join('<i class="on"></i>' if i < n else "<i></i>" for i in range(6)) + "</div>"


GALLERY = [
    ("Mac", [
        ("home.html", "Home", "Spendable"),
        ("command.html", "Search", ""),
        ("movements.html", "Movements", "All"),
        ("movements-out.html", "Expenses", ""),
        ("movements-in.html", "Income", ""),
        ("movements-recurring.html", "Recurring", ""),
        ("budget.html", "Budget", ""),
        ("budget-new.html", "New Envelope", ""),
        ("budget-edit.html", "Edit Envelope", "Dining"),
        ("budget-method.html", "Budget Method", ""),
        ("budget-plan.html", "Monthly Plan", ""),
        ("wealth.html", "Net Worth", "Summary"),
        ("wealth-assets.html", "Assets", ""),
        ("wealth-debts.html", "Debts", ""),
        ("wealth-accounts.html", "Accounts & Cash", ""),
        ("wealth-account.html", "Santander", ""),
        ("wealth-savings.html", "Savings", ""),
        ("wealth-investments.html", "Investments", ""),
        ("wealth-investment.html", "VWCE", ""),
        ("wealth-loans.html", "Money Lent", ""),
        ("wealth-loan.html", "Ana", ""),
        ("wealth-liabilities.html", "Liabilities", ""),
        ("wealth-liability.html", "Santander consumer", ""),
        ("insights.html", "Insights", ""),
        ("insights-calendar.html", "Calendar", ""),
        ("insights-dining.html", "Dining", ""),
        ("review.html", "Review", "3"),
        ("import.html", "Import", ""),
        ("import-review.html", "Import Review", ""),
        ("wisdom.html", "Wisdom", ""),
        ("wisdom-methods.html", "Methods", ""),
        ("wisdom-principles.html", "Principles", ""),
        ("wisdom-tools.html", "Tools", ""),
        ("settings.html", "Settings", ""),
        ("settings-classify.html", "Category Roles", ""),
        ("capture.html", "Add Expense", ""),
        ("capture-income.html", "Add Income", ""),
        ("onboarding.html", "Setup", ""),
        ("onboarding-income.html", "Setup · Income", ""),
        ("onboarding-recurring.html", "Setup · Bills", ""),
        ("onboarding-debt.html", "Setup · Debt", ""),
        ("onboarding-goals.html", "Setup · Goals", ""),
        ("onboarding-suggestions.html", "Setup · Plan", ""),
        ("login.html", "Sign In", ""),
        ("signup.html", "Sign Up", ""),
    ]),
    ("iPhone", [
        ("mobile.html", "Home", ""),
        ("mobile-more.html", "Account", ""),
        ("mobile-movements.html", "Movements", ""),
        ("mobile-movements-out.html", "Expenses", ""),
        ("mobile-movements-in.html", "Income", ""),
        ("mobile-movements-recurring.html", "Recurring", ""),
        ("mobile-budget.html", "Budget", ""),
        ("mobile-budget-new.html", "New Envelope", ""),
        ("mobile-budget-method.html", "Method", ""),
        ("mobile-budget-plan.html", "Monthly Plan", ""),
        ("mobile-wealth.html", "Net Worth", ""),
        ("mobile-wealth-accounts.html", "Accounts", ""),
        ("mobile-wealth-investments.html", "Investments", ""),
        ("mobile-wealth-loans.html", "Money Lent", ""),
        ("mobile-wealth-liabilities.html", "Debts", ""),
        ("mobile-insights.html", "Insights", ""),
        ("mobile-insights-calendar.html", "Calendar", ""),
        ("mobile-review.html", "Review", ""),
        ("mobile-import.html", "Import", ""),
        ("mobile-wisdom.html", "Wisdom", ""),
        ("mobile-settings.html", "Settings", ""),
        ("mobile-capture.html", "Add Expense", ""),
        ("mobile-capture-income.html", "Add Income", ""),
        ("mobile-onboarding.html", "Setup", ""),
        ("mobile-login.html", "Sign In", ""),
        ("mobile-signup.html", "Sign Up", ""),
    ]),
]


def gallery_html() -> str:
    blocks = [
        "    <h1>Budget &amp; Expense</h1>",
        "    <p>How Apple would ship this product. Mac sidebar, iPhone grouped lists, system materials. Every live destination.</p>",
    ]
    for section, links in GALLERY:
        blocks.append(f'    <div class="g-sec">{section}</div>')
        blocks.append('    <div class="g-grid">')
        for href, label, note in links:
            span = f" <span>{note}</span>" if note else ""
            blocks.append(f'      <a href="{href}">{label}{span}</a>')
        blocks.append("    </div>")
    return page("Cupertino", f'  <div class="gallery">\n' + "\n".join(blocks) + "\n  </div>")


def build() -> None:
    write("index.html", gallery_html())
    write("home.html", mac("Home", "home", home_inner, wide=True))
    write(
        "command.html",
        page(
            "Search",
            f"""  <div class="app">
    <aside class="side">
      <a class="brand" href="index.html"><i>{svg("budget", 16)}</i>Budget &amp; Expense</a>
      <nav>{side("home")}</nav>
    </aside>
    <div class="main">
      <header class="bar"><h1>Home</h1>{trail()}</header>
      <div class="scroll wide">{home_inner}</div>
    </div>
  </div>
  <div class="veil">
    <div class="cmd">
      <input value="Search" />
      <a class="row" href="home.html"><b>Home</b></a>
      <a class="row" href="movements.html"><b>Movements</b></a>
      <a class="row" href="budget.html"><b>Budget</b></a>
      <a class="row" href="wealth.html"><b>Net worth</b></a>
      <a class="row" href="insights.html"><b>Insights</b></a>
      <a class="row" href="review.html"><b>Review</b><span class="badge" style="margin-left:auto">3</span></a>
      <a class="row" href="import.html"><b>Import</b></a>
      <a class="row" href="wisdom.html"><b>Wisdom</b></a>
      <a class="row" href="settings.html"><b>Settings</b></a>
    </div>
  </div>""",
        ),
    )

    write("movements.html", mac("Movements", "movements", move_tabs("all") + move_stats + f'<section class="group-box">{TX}</section>'))
    write(
        "movements-out.html",
        mac(
            "Expenses",
            "movements",
            move_tabs("out")
            + move_stats
            + """<section class="group-box">
      <div class="tx"><span class="av dine">D</span><div><div class="name">Can Recasens</div><div class="sub">13 Aug</div></div><span class="amt">−42.80</span></div>
      <div class="tx"><span class="av groc">G</span><div><div class="name">Mercadona</div><div class="sub">12 Aug</div></div><span class="amt">−67.14</span></div>
      <div class="tx"><span class="av house">H</span><div><div class="name">Alquiler August</div><div class="sub">1 Aug</div></div><span class="amt">−1,150.00</span></div>
    </section>""",
        ),
    )
    write(
        "movements-in.html",
        mac(
            "Income",
            "movements",
            move_tabs("in")
            + move_stats
            + """<section class="group-box">
      <div class="tx"><span class="av in">+</span><div><div class="name">Client retainer</div><div class="sub">Wise · 1 Aug</div></div><span class="amt pos">+6,400.00</span></div>
    </section>""",
        ),
    )
    write(
        "movements-recurring.html",
        mac(
            "Recurring",
            "movements",
            """
    <section class="group-box">
      <div class="tx"><span class="av house">H</span><div><div class="name">Alquiler</div><div class="sub">Housing · day 1 · Active</div></div><span class="amt">−1,150.00</span></div>
      <div class="tx"><span class="av give">†</span><div><div class="name">Tithe</div><div class="sub">Giving · day 3 · Active</div></div><span class="amt">−640.00</span></div>
      <div class="tx"><span class="av move">T</span><div><div class="name">TMB T-usual</div><div class="sub">Transport · day 11 · Active</div></div><span class="amt">−22.00</span></div>
    </section>
    <div class="hrow"><h2>New Bill</h2></div>
    <section class="group-box">
      <div class="field"><label>Description</label><input value="Netflix" /></div>
      <div class="field"><label>Amount</label><input value="12.99" /></div>
      <div class="field"><label>Currency</label><input value="EUR" /></div>
      <div class="field"><label>Category</label><input value="Subscriptions" /></div>
      <div class="field"><label>Charge Day</label><input value="15" /></div>
      <div class="field"><label>Start Date</label><input value="2026-08-15" /></div>
      <div class="row"><div><b>Active</b></div><div class="toggle on"><i></i></div></div>
    </section>
    <a class="btn blue block" href="movements-recurring.html">Save Bill</a>
""",
            extra='<a class="btn" href="movements.html">Ledger</a>',
        ),
    )

    write(
        "budget.html",
        mac(
            "Budget",
            "budget",
            """
    <p class="pace" style="margin:0 0 16px">What’s left in each envelope. Dining is the watch with 18 days still to run.</p>
    <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">
      <button class="btn">August 2026</button>
      <a class="btn" href="budget.html">Copy Last Month</a>
      <a class="btn" href="budget-method.html">Method</a>
      <a class="btn blue" href="budget-new.html">New Envelope</a>
    </div>
    <div class="remain">
      <a class="watch" href="budget-edit.html"><span class="k">Dining</span><span class="money">€34</span><span class="meta">€186 of €220 · Watch</span></a>
      <a href="budget-edit.html"><span class="k">Housing</span><span class="money">€50</span><span class="meta">Rent on the 1st. Not a leak.</span></a>
      <a href="budget-edit.html"><span class="k">Groceries</span><span class="money">€236</span><span class="meta">€214 of €450</span></a>
      <a href="budget-edit.html"><span class="k">Transport</span><span class="money">€46</span><span class="meta">€44 of €90</span></a>
      <a href="budget-edit.html"><span class="k">Subscriptions</span><span class="money">€27</span><span class="meta">€32.99 of €60</span></a>
      <a class="done" href="budget-edit.html"><span class="k">Giving</span><span class="money">Done</span><span class="meta">€640 of €640</span></a>
    </div>
    <div class="hrow"><h2>Monthly Plan</h2><a href="budget-plan.html">Edit</a></div>
    <div class="plan">
      <div><span class="k">Needs</span><div class="money">€3,520</div></div>
      <div><span class="k">Give</span><div class="money">€640</div></div>
      <div><span class="k">Wants</span><div class="money">€770</div></div>
      <div><span class="k">Save</span><div class="money">€1,470</div></div>
    </div>
""",
            extra='<a class="btn blue" href="budget-new.html">New Envelope</a>',
            wide=True,
        ),
    )
    write(
        "budget-new.html",
        mac(
            "New Envelope",
            "budget",
            """
    <section class="group-box">
      <div class="field"><label>Name</label><input value="Health" /></div>
      <div class="field"><label>Amount</label><input value="80.00" /></div>
      <div class="field"><label>Categories</label><input value="Healthcare" /></div>
      <div class="row"><div><b>Kind</b><div class="sub">Spending envelope</div></div><div class="seg"><button class="on">Spend</button><button>Give</button><button>Save</button></div></div>
    </section>
    <a class="btn blue block" href="budget.html">Create</a>
""",
            extra='<a class="btn" href="budget.html">Cancel</a>',
        ),
    )
    write(
        "budget-edit.html",
        mac(
            "Dining",
            "budget",
            """
    <section class="hero"><span class="k">Left this month</span><div class="money">€34.00</div><p class="pace">€186 of €220 <span class="pill warn">Watch</span></p></section>
    <section class="group-box">
      <div class="field"><label>Name</label><input value="Dining" /></div>
      <div class="field"><label>Amount</label><input value="220.00" /></div>
      <div class="field"><label>Categories</label><input value="Dining" /></div>
      <div class="row"><div><b>Kind</b></div><div class="seg"><button class="on">Spend</button><button>Give</button><button>Save</button></div></div>
    </section>
    <a class="btn blue block" href="budget.html">Save</a>
    <a class="btn danger block" href="budget.html">Delete Envelope</a>
""",
        ),
    )
    write(
        "budget-method.html",
        mac(
            "Method",
            "budget",
            """
    <p class="pace" style="margin:0 0 16px">Seeds the monthly plan. You can still edit every envelope.</p>
    <section class="group-box">
      <div class="row"><div><b>5 Jars</b><div class="sub">Give first, then save, invest, and spend</div></div><span class="pill">On</span></div>
      <div class="row"><div><b>50 / 30 / 20</b><div class="sub">Needs, wants, and future</div></div><button class="btn">Use</button></div>
      <div class="row"><div><b>60 / 30 / 10</b><div class="sub">Needs first</div></div><button class="btn">Use</button></div>
      <div class="row"><div><b>Zero-based</b><div class="sub">Every euro named</div></div><button class="btn">Use</button></div>
      <div class="row"><div><b>Pay yourself first</b><div class="sub">Save before you spend</div></div><button class="btn">Use</button></div>
      <div class="row"><div><b>Values-based</b><div class="sub">Intention over formula</div></div><button class="btn">Use</button></div>
    </section>
""",
            extra='<a class="btn" href="budget.html">Back</a>',
        ),
    )
    write(
        "budget-plan.html",
        mac(
            "Monthly Plan",
            "budget",
            """
    <section class="group-box">
      <div class="field"><label>Income</label><input value="6400.00" /></div>
    </section>
    <div class="plan">
      <div><span class="k">Needs</span><div class="money">55%</div></div>
      <div><span class="k">Give</span><div class="money">10%</div></div>
      <div><span class="k">Wants</span><div class="money">12%</div></div>
      <div><span class="k">Save</span><div class="money">23%</div></div>
    </div>
    <p class="note">Must add to 100%. Current total €6,400.</p>
    <a class="btn" href="budget-plan.html">Copy Last Month</a>
    <a class="btn danger" href="budget.html">Delete Plan</a>
""",
            extra='<a class="btn blue" href="budget.html">Save</a>',
        ),
    )

    wealth_hero = """
    <section class="hero">
      <span class="k">Household</span>
      <div class="money">€57,700.00</div>
      <p class="pace"><span class="pos">+€1,240 this month</span> · 4.1 months of cushion</p>
    </section>
    <div class="stats">
      <div class="stat"><span class="k">Assets</span><div class="money pos">€63,900.00</div></div>
      <div class="stat"><span class="k">Debts</span><div class="money warn">€6,200.00</div></div>
      <div class="stat"><span class="k">Cushion</span><div class="money">4.1 mo</div></div>
    </div>
"""
    write(
        "wealth.html",
        mac(
            "Net Worth",
            "wealth",
            wealth_tabs("summary")
            + wealth_hero
            + """
    <div class="hrow"><h2>Organize</h2></div>
    <section class="group-box">
      <a class="row" href="wealth-accounts.html"><span class="av house">A</span><div><b>Accounts &amp; Cash</b><div class="sub">3 accounts</div></div><span class="amt">€12,400</span><span class="chev">›</span></a>
      <a class="row" href="wealth-savings.html"><span class="av groc">S</span><div><b>Savings</b><div class="sub">1 fund</div></div><span class="amt">€8,200</span><span class="chev">›</span></a>
      <a class="row" href="wealth-investments.html"><span class="av inv">I</span><div><b>Investments</b><div class="sub">VWCE · SXR8</div></div><span class="amt">€41,800</span><span class="chev">›</span></a>
      <a class="row" href="wealth-loans.html"><span class="av in">L</span><div><b>Money Lent</b><div class="sub">1 loan out</div></div><span class="amt">€1,500</span><span class="chev">›</span></a>
      <a class="row" href="wealth-liabilities.html"><span class="av debt">D</span><div><b>Debts &amp; Liabilities</b><div class="sub">Manage in Wealth</div></div><span class="amt warn">−€6,200</span><span class="chev">›</span></a>
    </section>
""",
            wide=True,
        ),
    )
    write(
        "wealth-assets.html",
        mac(
            "Assets",
            "wealth",
            wealth_tabs("assets")
            + """<section class="group-box">
      <a class="row" href="wealth-accounts.html"><div><b>Accounts &amp; Cash</b></div><span class="amt">€12,400</span><span class="chev">›</span></a>
      <a class="row" href="wealth-savings.html"><div><b>Savings</b></div><span class="amt">€8,200</span><span class="chev">›</span></a>
      <a class="row" href="wealth-investments.html"><div><b>Investments</b></div><span class="amt">€41,800</span><span class="chev">›</span></a>
      <a class="row" href="wealth-loans.html"><div><b>Money Lent</b></div><span class="amt">€1,500</span><span class="chev">›</span></a>
    </section>""",
        ),
    )
    write(
        "wealth-debts.html",
        mac(
            "Debts",
            "wealth",
            wealth_tabs("debts")
            + """<section class="group-box">
      <a class="row" href="wealth-liability.html"><div><b>Santander consumer</b><div class="sub">Loan · 4.9%</div></div><span class="amt warn">−€6,200</span><span class="chev">›</span></a>
    </section>""",
        ),
    )
    write(
        "wealth-accounts.html",
        mac(
            "Accounts & Cash",
            "wealth",
            """<section class="group-box">
      <a class="row" href="wealth-account.html"><span class="av house">S</span><div><b>Santander</b><div class="sub">•••• 4412 · EUR · in Spendable</div></div><span class="amt">€9,350</span><span class="chev">›</span></a>
      <a class="row" href="wealth-account.html"><span class="av move">W</span><div><b>Wise</b><div class="sub">Multi-currency</div></div><span class="amt">€2,150</span><span class="chev">›</span></a>
      <a class="row" href="wealth-account.html"><span class="av groc">€</span><div><b>Cash</b><div class="sub">Wallet</div></div><span class="amt">€900</span><span class="chev">›</span></a>
    </section>""",
            extra='<a class="btn blue" href="wealth-accounts.html">Add Account</a>',
        ),
    )
    write(
        "wealth-account.html",
        mac(
            "Santander",
            "wealth",
            """
    <section class="hero"><span class="k">Available on this account</span><div class="money">€9,350.00</div></section>
    <section class="group-box">
      <div class="row"><div><b>Last four</b></div><span>4412</span></div>
      <div class="row"><div><b>Currency</b></div><span>EUR</span></div>
      <div class="row"><div><b>Include in Spendable</b></div><div class="toggle on"><i></i></div></div>
      <div class="field"><label>Update balance</label><input value="9350.00" /></div>
    </section>
    <a class="btn blue block" href="wealth-accounts.html">Save</a>
""",
            extra='<a class="btn" href="wealth-accounts.html">Back</a>',
        ),
    )
    write(
        "wealth-savings.html",
        mac(
            "Savings",
            "wealth",
            """<section class="group-box">
      <div class="row"><span class="av groc">S</span><div><b>Emergency fund</b><div class="sub">4.1 months of cushion</div></div><span class="amt">€8,200</span></div>
    </section>""",
            extra='<a class="btn blue" href="wealth-savings.html">Add Fund</a>',
        ),
    )
    write(
        "wealth-investments.html",
        mac(
            "Investments",
            "wealth",
            """<section class="group-box">
      <a class="row" href="wealth-investment.html"><span class="av inv">V</span><div><b>VWCE</b><div class="sub">IE00BK5BQT80 · +6.4%</div></div><span class="amt">€18,420</span><span class="chev">›</span></a>
      <a class="row" href="wealth-investment.html"><span class="av move">S</span><div><b>SXR8</b><div class="sub">IE00B5BMR087 · +4.1%</div></div><span class="amt">€12,180</span><span class="chev">›</span></a>
      <div class="row"><span class="av house">$</span><div><b>IBKR cash</b><div class="sub">USD 3,410</div></div><span class="amt">€3,140</span></div>
    </section>""",
            extra='<a class="btn blue" href="wealth-investments.html">Add Holding</a>',
        ),
    )
    write(
        "wealth-investment.html",
        mac(
            "VWCE",
            "wealth",
            """
    <section class="hero"><span class="k">Current value</span><div class="money">€18,420.00</div><p class="pace pos">+€1,110 · +6.4%</p></section>
    <section class="group-box">
      <div class="row"><div><b>ISIN</b></div><span>IE00BK5BQT80</span></div>
      <div class="field"><label>Update value</label><input value="18420.00" /></div>
    </section>
    <a class="btn blue block" href="wealth-investments.html">Save Value</a>
""",
            extra='<a class="btn" href="wealth-investments.html">Back</a>',
        ),
    )
    write(
        "wealth-loans.html",
        mac(
            "Money Lent",
            "wealth",
            """<section class="group-box">
      <a class="row" href="wealth-loan.html"><span class="av in">A</span><div><b>Ana</b><div class="sub">€500 repaid · €1,500 left</div></div><span class="amt">€1,500</span><span class="chev">›</span></a>
    </section>""",
            extra='<a class="btn blue" href="wealth-loans.html">Record a Loan</a>',
        ),
    )
    write(
        "wealth-loan.html",
        mac(
            "Ana",
            "wealth",
            """
    <section class="hero"><span class="k">Outstanding</span><div class="money">€1,500.00</div></section>
    <section class="group-box">
      <div class="row"><div><b>Principal</b></div><span>€2,000</span></div>
      <div class="row"><div><b>Repaid</b></div><span class="pos">€500</span></div>
      <div class="field"><label>Record a repayment</label><input value="100.00" /></div>
    </section>
    <a class="btn blue block" href="wealth-loans.html">Save</a>
""",
            extra='<a class="btn" href="wealth-loans.html">Back</a>',
        ),
    )
    write(
        "wealth-liabilities.html",
        mac(
            "Debts & Liabilities",
            "wealth",
            """<section class="group-box">
      <a class="row" href="wealth-liability.html"><span class="av debt">S</span><div><b>Santander consumer</b><div class="sub">Loan · 4.9% · day 5</div></div><span class="amt warn">−€6,200</span><span class="chev">›</span></a>
    </section>""",
            extra='<a class="btn blue" href="wealth-liabilities.html">Add Debt</a>',
        ),
    )
    write(
        "wealth-liability.html",
        mac(
            "Santander consumer",
            "wealth",
            """
    <section class="hero"><span class="k">Balance</span><div class="money">€6,200.00</div></section>
    <section class="group-box">
      <div class="row"><div><b>Kind</b></div><span>Loan</span></div>
      <div class="row"><div><b>Rate</b></div><span>4.9%</span></div>
      <div class="field"><label>Record a payment</label><input value="210.00" /></div>
    </section>
    <a class="btn blue block" href="wealth-liabilities.html">Save</a>
""",
            extra='<a class="btn" href="wealth-liabilities.html">Back</a>',
        ),
    )

    write(
        "insights.html",
        mac(
            "Insights",
            "insights",
            f"""
    <div style="display:flex;justify-content:space-between;align-items:center;margin:8px 0 16px;flex-wrap:wrap;gap:8px">
      {seg([("Month","insights.html", True),("Quarter","insights.html", False),("Year","insights.html", False)])}
      <button class="btn">August 2026</button>
    </div>
    <div class="stats">
      <div class="stat"><span class="k">Daily Spend</span><div class="money">€163.04</div></div>
      <div class="stat"><span class="k">Daily Guide</span><div class="money pos">€142.68</div></div>
      <div class="stat"><span class="k">Difference</span><div class="money warn">+€20.36</div></div>
    </div>
    <div class="remain" style="grid-template-columns:1fr 1fr">
      <a href="insights-calendar.html"><span class="k">Calendar</span><span class="money" style="font-size:22px">Heavy days</span><span class="meta">Rent, tithe, groceries</span></a>
      <a class="watch" href="insights-dining.html"><span class="k">Dining</span><span class="money">€186</span><span class="meta">+€41 vs July</span></a>
    </div>
    <div class="hrow"><h2>Where It Went</h2></div>
    <section class="group-box">
      <a class="row" href="insights-dining.html"><span class="av house">H</span><div><b>Housing</b></div><span class="amt">€1,150</span><span class="sub">54%</span><span class="chev">›</span></a>
      <div class="row"><span class="av give">†</span><div><b>Giving</b></div><span class="amt">€640</span><span class="sub">30%</span></div>
      <div class="row"><span class="av groc">G</span><div><b>Groceries</b></div><span class="amt">€214</span><span class="sub">10%</span></div>
      <a class="row" href="insights-dining.html"><span class="av dine">D</span><div><b>Dining</b></div><span class="amt warn">€186</span><span class="sub">9%</span><span class="chev">›</span></a>
    </section>
    <div class="split">
      <div class="card"><h2>The Read</h2><p class="note" style="padding:0">Spend is still under the calendar. Housing is rent on the 1st, not a leak. Dining is the watch.</p></div>
      <div class="card"><h2>Giving</h2><p class="note" style="padding:0">€640 of €640 · 10% target. Complete.</p></div>
    </div>
    <div class="card" style="margin-top:12px"><h2>Monthly Report</h2><p class="note" style="padding:0">Income €6,400 · Out €2,119.50 · Saved €4,280.50. Savings rate 67%.</p></div>
""",
            wide=True,
        ),
    )
    write(
        "insights-calendar.html",
        mac(
            "Calendar",
            "insights",
            f'<p class="pace" style="margin:0 0 12px">Heavy days: rent on the 1st, tithe on the 3rd, Mercadona on the 12th.</p>{CAL}',
            extra='<a class="btn" href="insights.html">Insights</a>',
        ),
    )
    write(
        "insights-dining.html",
        mac(
            "Dining",
            "insights",
            """
    <section class="hero"><span class="k">This month</span><div class="money">€186.00</div><p class="pace">+€41 vs July <span class="pill warn">Watch</span></p></section>
    <section class="group-box">
      <div class="tx"><span class="av dine">D</span><div><div class="name">Can Recasens</div><div class="sub">13 Aug</div></div><span class="amt">−42.80</span></div>
      <div class="tx"><span class="av dine">D</span><div><div class="name">Nomad Coffee</div><div class="sub">9 Aug</div></div><span class="amt">−6.50</span></div>
      <div class="tx"><span class="av dine">D</span><div><div class="name">Can Recasens</div><div class="sub">2 Aug</div></div><span class="amt">−38.20</span></div>
    </section>
""",
            extra='<a class="btn" href="insights.html">Insights</a>',
        ),
    )

    write(
        "review.html",
        mac(
            "Weekly Review",
            "review",
            """
    <p class="pace" style="margin:0 0 16px">Three imported lines still need a category. Nothing posts until you assign them.</p>
    <section class="group-box">
      <div class="q"><div><b>Unknown POS 8821</b><div class="sub">11 Aug · Santander · −€18.90</div></div><div class="actions"><button class="btn">Dining</button><button class="btn">Groceries</button><button class="btn">Skip</button></div></div>
      <div class="q"><div><b>Farmacia Palau</b><div class="sub">8 Aug · Santander · −€24.60</div></div><div class="actions"><button class="btn blue">Health</button><button class="btn">Skip</button></div></div>
      <div class="q"><div><b>Wise FX</b><div class="sub">7 Aug · Wise · −€9.40</div></div><div class="actions"><button class="btn">Fees</button><button class="btn">Transfer</button><button class="btn">Skip</button></div></div>
    </section>
""",
            extra='<a class="btn blue" href="review.html">Save</a>',
        ),
    )
    write(
        "import.html",
        mac(
            "Import",
            "import",
            """
    <div class="drop">
      <div class="money" style="font-size:22px">Drop a CSV</div>
      <p class="sub">Santander or Wise. You confirm before anything is booked.</p>
      <div class="seg" style="margin:14px 0">{seg_inner}</div>
      <a class="btn blue" href="import-review.html">Choose a File</a>
    </div>
    <section class="group-box">
      <div class="hrow" style="margin:12px 16px 0"><h2>History</h2></div>
      <a class="row" href="import-review.html"><div><b>santander-agosto.csv</b><div class="sub">12 Aug · 18 lines · committed</div></div><button class="btn">Rollback</button></a>
      <div class="row"><div><b>wise-julio.csv</b><div class="sub">1 Aug · 9 lines · committed</div></div><button class="btn">Rollback</button></div>
    </section>
""".replace("{seg_inner}", '<button class="on">Santander</button><button>Wise</button>'),
        ),
    )
    write(
        "import-review.html",
        mac(
            "Confirm Batch",
            "import",
            """
    <p class="pace" style="margin:0 0 16px">18 lines from Santander. 3 need a category. 1 tithe transfer detected.</p>
    <section class="group-box">
      <div class="tx"><span class="av house">H</span><div><div class="name">Alquiler August</div><div class="sub">Housing</div></div><span class="amt">−1,150.00</span></div>
      <div class="tx"><span class="av groc">G</span><div><div class="name">Mercadona</div><div class="sub">Groceries</div></div><span class="amt">−67.14</span></div>
      <div class="tx"><span class="av unk">?</span><div><div class="name">Unknown POS 8821</div><div class="sub">Needs a category</div></div><span class="amt">−18.90</span></div>
    </section>
    <a class="btn blue block" href="review.html">Commit 15 · Send 3 to Review</a>
    <a class="btn block" href="import.html">Discard</a>
""",
        ),
    )

    write(
        "wisdom.html",
        mac(
            "Wisdom",
            "wisdom",
            wisdom_tabs("stewardship")
            + """<div class="split">
      <div class="card"><h2>Give first</h2><p class="note" style="padding:0">The giving envelope fills on the 1st. Completing it is the plan, not the leftover.</p></div>
      <div class="card"><h2>Roof before restaurants</h2><p class="note" style="padding:0">Housing is a date. Do not read rent as a leak.</p></div>
      <div class="card"><h2>Do not spend tomorrow</h2><p class="note" style="padding:0">Daily guide is €142.68. A watch on dining is a throttle.</p></div>
      <div class="card"><h2>Own more than you owe</h2><p class="note" style="padding:0">Consumer debt is weight. Pay it on a calendar.</p></div>
    </div>""",
        ),
    )
    write(
        "wisdom-methods.html",
        mac(
            "Budgeting Methods",
            "wisdom",
            wisdom_tabs("methods")
            + """<section class="group-box">
      <div class="row"><div><b>5 Jars</b><div class="sub">Give first, then save, invest, and spend</div></div><span class="pill">Faith-based</span></div>
      <div class="row"><div><b>50 / 30 / 20</b><div class="sub">Needs, wants, and future</div></div><a class="btn" href="budget-method.html">Use</a></div>
      <div class="row"><div><b>60 / 30 / 10</b></div><a class="btn" href="budget-method.html">Use</a></div>
      <div class="row"><div><b>Zero-based</b></div><a class="btn" href="budget-method.html">Use</a></div>
      <div class="row"><div><b>Pay yourself first</b></div><a class="btn" href="budget-method.html">Use</a></div>
      <div class="row"><div><b>Values-based</b></div><a class="btn" href="budget-method.html">Use</a></div>
    </section>""",
        ),
    )
    write(
        "wisdom-principles.html",
        mac(
            "Financial Principles",
            "wisdom",
            wisdom_tabs("principles")
            + """<div class="split">
      <div class="card"><h2>Spend less than you earn</h2><p class="note" style="padding:0">The gap is the plan. Spendable is that gap, after envelopes.</p></div>
      <div class="card"><h2>Name every euro</h2><p class="note" style="padding:0">Unnamed money finds restaurants.</p></div>
      <div class="card"><h2>Debt has a date</h2><p class="note" style="padding:0">Pay on a calendar, not when leftover appears.</p></div>
      <div class="card"><h2>Cushion before speculation</h2><p class="note" style="padding:0">4.1 months is the floor, not the finish.</p></div>
    </div>""",
        ),
    )
    write(
        "wisdom-tools.html",
        mac(
            "Tools & Apps",
            "wisdom",
            wisdom_tabs("tools")
            + """<section class="group-box">
      <div class="row"><div><b>This app</b><div class="sub">Household books, envelopes, import, review</div></div><span class="pill">Here</span></div>
      <a class="row" href="import.html"><div><b>CSV Import</b><div class="sub">Santander and Wise statements</div></div><span class="chev">›</span></a>
      <a class="row" href="review.html"><div><b>Weekly Review</b><div class="sub">Assign what the bank could not</div></div><span class="chev">›</span></a>
    </section>""",
        ),
    )

    write("settings.html", mac("Settings", "settings", settings_inner))
    write(
        "settings-classify.html",
        mac(
            "Category Roles",
            "settings",
            """
    <p class="pace" style="margin:0 0 16px">Classification feeds Insights. Budget role decides which envelope a category joins when you apply a method.</p>
    <section class="group-box">
      <div class="row"><div><b>Housing</b><div class="sub">Essential · Housing</div></div><button class="btn">Edit</button></div>
      <div class="row"><div><b>Dining</b><div class="sub">Discretionary · Dining out</div></div><button class="btn">Edit</button></div>
      <div class="row"><div><b>Groceries</b><div class="sub">Essential · Groceries</div></div><button class="btn">Edit</button></div>
      <div class="row"><div><b>Transport</b><div class="sub">Essential · Transport</div></div><button class="btn">Edit</button></div>
      <div class="row"><div><b>Giving</b><div class="sub">Giving · Tithe</div></div><button class="btn">Edit</button></div>
      <div class="row"><div><b>Income</b><div class="sub">Savings · Income</div></div><button class="btn">Edit</button></div>
    </section>
""",
            extra='<a class="btn" href="settings.html">Back</a>',
        ),
    )

    capture_exp = """
    <div class="seg" style="margin-bottom:16px"><a class="on" href="capture.html">Expense</a><a href="capture-income.html">Income</a></div>
    <section class="group-box">
      <div class="field"><label>Amount</label><input value="42.80" /></div>
      <div class="field"><label>Currency</label><input value="EUR" /></div>
      <div class="field"><label>Description</label><input value="Can Recasens" /></div>
      <div class="field"><label>Category</label><input value="Dining" /></div>
      <div class="field"><label>Date</label><input value="2026-08-13" /></div>
    </section>
    <a class="btn blue block" href="home.html">Add Expense</a>
    <a class="btn block" href="capture.html">Save &amp; Add Another</a>
"""
    capture_inc = """
    <div class="seg" style="margin-bottom:16px"><a href="capture.html">Expense</a><a class="on" href="capture-income.html">Income</a></div>
    <section class="group-box">
      <div class="field"><label>Amount</label><input value="6400.00" /></div>
      <div class="field"><label>Currency</label><input value="EUR" /></div>
      <div class="field"><label>Description</label><input value="Client retainer" /></div>
      <div class="field"><label>Category</label><input value="Income" /></div>
      <div class="field"><label>Date</label><input value="2026-08-01" /></div>
    </section>
    <a class="btn blue block" href="home.html">Add Income</a>
    <a class="btn block" href="capture-income.html">Save &amp; Add Another</a>
"""
    write("capture.html", mac("Add Movement", "home", capture_exp, extra='<a class="btn" href="home.html">Close</a>'))
    write("capture-income.html", mac("Add Movement", "home", capture_inc, extra='<a class="btn" href="home.html">Close</a>'))

    for fname, heading, n, inner in onboarding_steps:
        write(
            fname,
            mac(
                "Setup Guide",
                "settings",
                f"""
    <span class="k">Step {n} of 6 · {heading}</span>
    {steps_bar(n)}
    <section class="group-box">{inner}</section>
""",
                extra='<a class="btn" href="home.html">Skip</a>',
            ),
        )

    write(
        "login.html",
        page(
            "Sign In",
            """  <div class="auth">
    <div class="auth-box">
      <span class="k">Budget &amp; Expense</span>
      <h1>Sign In</h1>
      <p class="sub">Then we open the household books.</p>
      <section class="group-box">
        <div class="field"><label>Email</label><input type="email" value="juanpablo@example.com" /></div>
        <div class="field"><label>Password</label><input type="password" value="············" /></div>
      </section>
      <a class="btn blue block" href="home.html">Sign In</a>
      <p class="sub" style="margin-top:16px;text-align:center">No account? <a href="signup.html">Sign Up</a></p>
    </div>
  </div>""",
        ),
    )
    write(
        "signup.html",
        page(
            "Sign Up",
            """  <div class="auth">
    <div class="auth-box">
      <span class="k">Budget &amp; Expense</span>
      <h1>Create the Books</h1>
      <p class="sub">One household. English or Spanish. EUR to start.</p>
      <section class="group-box">
        <div class="field"><label>Email</label><input type="email" value="juanpablo@example.com" /></div>
        <div class="field"><label>Password</label><input type="password" value="············" /></div>
        <div class="field"><label>Display name</label><input value="Juan Pablo" /></div>
      </section>
      <a class="btn blue block" href="onboarding.html">Create Account</a>
      <p class="sub" style="margin-top:16px;text-align:center">Already here? <a href="login.html">Sign In</a></p>
    </div>
  </div>""",
        ),
    )

    # Phone
    write("mobile.html", phone("Home · iPhone", "", home_phone, "home"))
    write(
        "mobile-more.html",
        phone(
            "Account · iPhone",
            "",
            home_phone,
            None,
            extra="""
        <div class="more-sheet">
          <span class="k">Juan Pablo</span>
          <p class="sub" style="margin:0 0 10px">juanpablo@example.com</p>
          <section class="group-box">
            <a class="row" href="mobile-review.html"><b>Review</b><span class="badge">3</span><span class="chev">›</span></a>
            <a class="row" href="mobile-import.html"><b>Import</b><span class="chev">›</span></a>
            <a class="row" href="mobile-wisdom.html"><b>Wisdom</b><span class="chev">›</span></a>
            <a class="row" href="mobile-settings.html"><b>Settings</b><span class="chev">›</span></a>
          </section>
          <section class="group-box">
            <div class="row"><div><b>Language</b></div><div class="seg"><button class="on">EN</button><button>ES</button></div></div>
            <div class="row"><div><b>Currency</b></div><span>EUR</span></div>
            <div class="row"><div><b>Appearance</b></div><span>Light</span></div>
          </section>
          <a class="row" href="mobile-login.html"><b>Log Out</b></a>
        </div>""",
        ),
    )
    write(
        "mobile-movements.html",
        phone(
            "Movements · iPhone",
            "Movements",
            f"""
          <div style="margin-bottom:12px">{seg([("All","mobile-movements.html", True),("Expenses","mobile-movements-out.html", False),("Income","mobile-movements-in.html", False)])}</div>
          <a class="btn" href="mobile-movements-recurring.html" style="margin-bottom:12px">Recurring</a>
          <section class="group-box">{TX}</section>
""",
            "movements",
        ),
    )
    write(
        "mobile-movements-out.html",
        phone(
            "Expenses · iPhone",
            "Expenses",
            f"""
          <div style="margin-bottom:12px">{seg([("All","mobile-movements.html", False),("Expenses","mobile-movements-out.html", True),("Income","mobile-movements-in.html", False)])}</div>
          <section class="group-box">
            <div class="tx"><span class="av dine">D</span><div><div class="name">Can Recasens</div><div class="sub">13 Aug</div></div><span class="amt">−42.80</span></div>
            <div class="tx"><span class="av groc">G</span><div><div class="name">Mercadona</div><div class="sub">12 Aug</div></div><span class="amt">−67.14</span></div>
            <div class="tx"><span class="av house">H</span><div><div class="name">Alquiler</div><div class="sub">1 Aug</div></div><span class="amt">−1,150.00</span></div>
          </section>
""",
            "movements",
        ),
    )
    write(
        "mobile-movements-in.html",
        phone(
            "Income · iPhone",
            "Income",
            f"""
          <div style="margin-bottom:12px">{seg([("All","mobile-movements.html", False),("Expenses","mobile-movements-out.html", False),("Income","mobile-movements-in.html", True)])}</div>
          <section class="group-box">
            <div class="tx"><span class="av in">+</span><div><div class="name">Client retainer</div><div class="sub">1 Aug</div></div><span class="amt pos">+6,400</span></div>
          </section>
""",
            "movements",
        ),
    )
    write(
        "mobile-movements-recurring.html",
        phone(
            "Recurring · iPhone",
            "Recurring",
            """
          <section class="group-box">
            <div class="tx"><span class="av house">H</span><div><div class="name">Alquiler</div><div class="sub">Day 1</div></div><span class="amt">−1,150</span></div>
            <div class="tx"><span class="av give">†</span><div><div class="name">Tithe</div><div class="sub">Day 3</div></div><span class="amt">−640</span></div>
          </section>
""",
            "movements",
        ),
    )
    write(
        "mobile-budget.html",
        phone(
            "Budget · iPhone",
            "Budget",
            """
          <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">
            <a class="btn blue" href="mobile-budget-new.html">New</a>
            <a class="btn" href="mobile-budget-method.html">Method</a>
            <a class="btn" href="mobile-budget-plan.html">Plan</a>
          </div>
          <div class="remain">
            <a class="watch" href="mobile-budget.html"><span class="k">Dining</span><span class="money">€34</span><span class="meta">Watch</span></a>
            <a href="mobile-budget.html"><span class="k">Housing</span><span class="money">€50</span><span class="meta">Left</span></a>
            <a href="mobile-budget.html"><span class="k">Groceries</span><span class="money">€236</span><span class="meta">Left</span></a>
            <a class="done" href="mobile-budget.html"><span class="k">Giving</span><span class="money">Done</span><span class="meta">This month</span></a>
          </div>
""",
            "budget",
        ),
    )
    write(
        "mobile-budget-new.html",
        phone(
            "New Envelope · iPhone",
            "New",
            """
          <section class="group-box">
            <div class="field"><label>Name</label><input value="Health" /></div>
            <div class="field"><label>Amount</label><input value="80.00" /></div>
          </section>
          <a class="btn blue block" href="mobile-budget.html">Create</a>
""",
            "budget",
        ),
    )
    write(
        "mobile-budget-method.html",
        phone(
            "Method · iPhone",
            "Method",
            """
          <section class="group-box">
            <div class="row"><div><b>5 Jars</b></div><span class="pill">On</span></div>
            <div class="row"><div><b>50 / 30 / 20</b></div><button class="btn">Use</button></div>
            <div class="row"><div><b>Zero-based</b></div><button class="btn">Use</button></div>
          </section>
""",
            "budget",
        ),
    )
    write(
        "mobile-budget-plan.html",
        phone(
            "Plan · iPhone",
            "Plan",
            """
          <section class="group-box">
            <div class="field"><label>Income</label><input value="6400.00" /></div>
          </section>
          <div class="plan" style="grid-template-columns:1fr 1fr">
            <div><span class="k">Needs</span><div class="money">55%</div></div>
            <div><span class="k">Give</span><div class="money">10%</div></div>
            <div><span class="k">Wants</span><div class="money">12%</div></div>
            <div><span class="k">Save</span><div class="money">23%</div></div>
          </div>
          <a class="btn blue block" href="mobile-budget.html">Save</a>
""",
            "budget",
        ),
    )
    write(
        "mobile-wealth.html",
        phone(
            "Net Worth · iPhone",
            "Net Worth",
            """
          <section class="hero"><span class="k">Household</span><div class="money">€57,700</div><p class="pace pos">+€1,240 this month</p></section>
          <section class="group-box">
            <a class="row" href="mobile-wealth-accounts.html"><div><b>Accounts</b></div><span class="amt">€12,400</span><span class="chev">›</span></a>
            <a class="row" href="mobile-wealth-investments.html"><div><b>Investments</b></div><span class="amt">€41,800</span><span class="chev">›</span></a>
            <a class="row" href="mobile-wealth-loans.html"><div><b>Lent</b></div><span class="amt">€1,500</span><span class="chev">›</span></a>
            <a class="row" href="mobile-wealth-liabilities.html"><div><b>Debts</b></div><span class="amt warn">−€6,200</span><span class="chev">›</span></a>
          </section>
""",
            "wealth",
        ),
    )
    write(
        "mobile-wealth-accounts.html",
        phone(
            "Accounts · iPhone",
            "Accounts",
            """
          <section class="group-box">
            <div class="row"><div><b>Santander</b><div class="sub">•••• 4412</div></div><span class="amt">€9,350</span></div>
            <div class="row"><div><b>Wise</b></div><span class="amt">€2,150</span></div>
          </section>
""",
            "wealth",
        ),
    )
    write(
        "mobile-wealth-investments.html",
        phone(
            "Investments · iPhone",
            "Investments",
            """
          <section class="group-box">
            <div class="row"><div><b>VWCE</b><div class="sub">+6.4%</div></div><span class="amt">€18,420</span></div>
            <div class="row"><div><b>SXR8</b><div class="sub">+4.1%</div></div><span class="amt">€12,180</span></div>
          </section>
""",
            "wealth",
        ),
    )
    write(
        "mobile-wealth-loans.html",
        phone(
            "Loans · iPhone",
            "Lent",
            """
          <section class="group-box">
            <div class="row"><div><b>Ana</b><div class="sub">€1,500 left</div></div><span class="amt">€1,500</span></div>
          </section>
""",
            "wealth",
        ),
    )
    write(
        "mobile-wealth-liabilities.html",
        phone(
            "Debts · iPhone",
            "Debts",
            """
          <section class="group-box">
            <div class="row"><div><b>Santander consumer</b><div class="sub">4.9%</div></div><span class="amt warn">−€6,200</span></div>
          </section>
""",
            "wealth",
        ),
    )
    write(
        "mobile-insights.html",
        phone(
            "Insights · iPhone",
            "Insights",
            """
          <div class="stats" style="grid-template-columns:1fr">
            <div class="stat"><span class="k">Daily Spend</span><div class="money">€163.04</div></div>
          </div>
          <a class="btn" href="mobile-insights-calendar.html" style="margin-bottom:12px">Calendar</a>
          <section class="group-box">
            <div class="row"><div><b>Housing</b></div><span class="amt">€1,150</span></div>
            <div class="row"><div><b>Giving</b></div><span class="amt">€640</span></div>
            <div class="row"><div><b>Dining</b></div><span class="amt warn">€186</span></div>
          </section>
""",
            "insights",
        ),
    )
    write("mobile-insights-calendar.html", phone("Calendar · iPhone", "August", CAL, "insights"))
    write(
        "mobile-review.html",
        phone(
            "Review · iPhone",
            "Review",
            """
          <section class="group-box">
            <div class="q" style="flex-wrap:wrap"><div><b>Unknown POS 8821</b><div class="sub">−€18.90</div></div><div class="actions"><button class="btn">Dining</button><button class="btn">Skip</button></div></div>
            <div class="q" style="flex-wrap:wrap"><div><b>Farmacia Palau</b><div class="sub">−€24.60</div></div><div class="actions"><button class="btn blue">Health</button></div></div>
          </section>
""",
            None,
        ),
    )
    write(
        "mobile-import.html",
        phone(
            "Import · iPhone",
            "Import",
            """
          <div class="drop">
            <div class="money" style="font-size:18px">Drop a CSV</div>
            <div class="seg" style="margin:12px 0"><button class="on">Santander</button><button>Wise</button></div>
            <a class="btn blue" href="mobile-review.html">Choose a File</a>
          </div>
""",
            None,
        ),
    )
    write(
        "mobile-wisdom.html",
        phone(
            "Wisdom · iPhone",
            "Wisdom",
            """
          <section class="group-box">
            <div class="row"><div><b>Give first</b><div class="sub">The giving envelope fills on the 1st.</div></div></div>
            <div class="row"><div><b>Roof before restaurants</b><div class="sub">Housing is a date.</div></div></div>
          </section>
""",
            None,
        ),
    )
    write(
        "mobile-settings.html",
        phone(
            "Settings · iPhone",
            "Settings",
            settings_inner.replace("onboarding.html", "mobile-onboarding.html")
            .replace("settings-classify.html", "mobile-settings.html")
            .replace("wealth-liabilities.html", "mobile-wealth-liabilities.html")
            .replace("login.html", "mobile-login.html"),
            None,
        ),
    )
    write(
        "mobile-capture.html",
        phone(
            "Add · iPhone",
            "Add",
            """
          <div class="seg" style="margin-bottom:12px"><a class="on" href="mobile-capture.html">Expense</a><a href="mobile-capture-income.html">Income</a></div>
          <section class="group-box">
            <div class="field"><label>Amount</label><input value="42.80" /></div>
            <div class="field"><label>Description</label><input value="Can Recasens" /></div>
            <div class="field"><label>Category</label><input value="Dining" /></div>
            <div class="field"><label>Date</label><input value="2026-08-13" /></div>
          </section>
          <a class="btn blue block" href="mobile.html">Add Expense</a>
          <a class="btn block" href="mobile-capture.html">Save &amp; Add Another</a>
""",
            "home",
            add=False,
        ),
    )
    write(
        "mobile-capture-income.html",
        phone(
            "Add Income · iPhone",
            "Add",
            """
          <div class="seg" style="margin-bottom:12px"><a href="mobile-capture.html">Expense</a><a class="on" href="mobile-capture-income.html">Income</a></div>
          <section class="group-box">
            <div class="field"><label>Amount</label><input value="6400.00" /></div>
            <div class="field"><label>Category</label><input value="Income" /></div>
          </section>
          <a class="btn blue block" href="mobile.html">Add Income</a>
""",
            "home",
            add=False,
        ),
    )
    write(
        "mobile-onboarding.html",
        phone(
            "Setup · iPhone",
            "Setup",
            f"""
          {steps_bar(2)}
          <section class="group-box">
            <div class="field"><label>Amount</label><input value="6400.00" /></div>
          </section>
          <a class="btn blue block" href="mobile.html">Continue</a>
""",
            None,
            add=False,
        ),
    )
    write(
        "mobile-login.html",
        page(
            "Sign In · iPhone",
            """  <div class="phone-wrap">
    <div>
      <p class="k" style="text-align:center;margin:0 0 12px;color:#fff"><a href="index.html">Phone</a></p>
      <div class="phone">
        <div class="notch"><span>21:39</span><span>EUR</span></div>
        <div class="phone-body">
          <div class="lt">Sign In</div>
          <section class="group-box">
            <div class="field"><label>Email</label><input type="email" value="juanpablo@example.com" /></div>
            <div class="field"><label>Password</label><input type="password" value="············" /></div>
          </section>
          <a class="btn blue block" href="mobile.html">Sign In</a>
          <p class="sub" style="text-align:center;margin-top:16px"><a href="mobile-signup.html">Sign Up</a></p>
        </div>
      </div>
    </div>
  </div>""",
        ),
    )
    write(
        "mobile-signup.html",
        page(
            "Sign Up · iPhone",
            """  <div class="phone-wrap">
    <div>
      <p class="k" style="text-align:center;margin:0 0 12px;color:#fff"><a href="index.html">Phone</a></p>
      <div class="phone">
        <div class="notch"><span>21:39</span><span>EUR</span></div>
        <div class="phone-body">
          <div class="lt">Create the Books</div>
          <section class="group-box">
            <div class="field"><label>Email</label><input type="email" value="juanpablo@example.com" /></div>
            <div class="field"><label>Password</label><input type="password" value="············" /></div>
            <div class="field"><label>Display name</label><input value="Juan Pablo" /></div>
          </section>
          <a class="btn blue block" href="mobile-onboarding.html">Create Account</a>
        </div>
      </div>
    </div>
  </div>""",
        ),
    )


if __name__ == "__main__":
    build()
    print("wrote", len(list(ROOT.glob("*.html"))), "html files")
