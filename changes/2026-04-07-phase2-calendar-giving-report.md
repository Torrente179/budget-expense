# Phase 2: Calendar budgeting, giving insights, and monthly report

## Summary

Added three major features: a calendar budgeting view for visualizing cash flow, a giving/tzedakah insights tracker on the dashboard, and a monthly spending report with category analysis and auto-generated insights. Also added the Calendar page to sidebar and mobile navigation.

## Product Changes

### Calendar budgeting page (`/calendar`)
- New page showing a **custom calendar grid** with color-coded day indicators:
  - **Green dots** for income received
  - **Red dots** for expenses
  - **Blue dots** for recurring bills due
- Clicking a day reveals a **detail panel** showing all transactions (income, expenses, recurring bills) with category icons, amounts, and descriptions.
- **Cash flow summary sidebar** showing total income, total expenses, net cash flow, and count of upcoming recurring bills for the rest of the month.
- Responsive layout: sidebar on desktop, stacked on mobile.
- Added to both desktop sidebar and mobile slide-out navigation.

### Giving & stewardship insights (dashboard)
- New `GivingInsights` component on the dashboard that **auto-detects** giving/tithe transactions by scanning category names and descriptions for keywords (tithe, diezmo, giving, donation, tzedakah, offering, ofrenda, church, etc.).
- Shows **total giving**, **giving as % of income**, and a **tithe benchmark progress bar** (10% goal).
- Category-level breakdown of giving transactions.
- Scripture quote (Proverbs 3:9-10) and setup tip for users without giving categories.

### Monthly spending report (dashboard)
- New `MonthlyReport` component showing:
  - **Month-over-month comparison** (this month vs last month with % change)
  - **Category spending bars** with budget vs actual comparison and "Over" badges for over-budget categories
  - **Auto-generated insights** covering savings rate, top-heavy categories, month-over-month trends, and over-budget warnings.
- Both components placed in a 2-column grid on the dashboard below recent expenses.

### Navigation
- Calendar page added to sidebar nav between Budgets and Investments.
- Calendar page added to mobile slide-out navigation.

## Data Model

No database schema changes. All features use existing tables (expenses, income_entries, recurring_expenses, budgets, categories). Giving detection is keyword-based on category names and expense descriptions.

## Validation

- Full Next.js production build passes with zero TypeScript errors.
- All new content is bilingual (EN/ES).
- Calendar page renders at `/calendar` route.
- Giving detection covers English and Spanish keywords.
- Monthly report generates context-aware insights based on actual spending patterns.
