<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:change-tracking-rules -->
# Change Tracking

All implementation changes in this repository must be tracked in `changes/`.

Rules:
- For every user-facing or technical code change, add a new markdown note in `changes/`.
- Filename format: `YYYY-MM-DD-short-kebab-title.md`.
- Include, at minimum, these sections:
  - `Summary`
  - `Product Changes` (if applicable)
  - `Data Model` (if applicable)
  - `Validation`
- If a task only asks for analysis and no code/config/schema change is made, no change note is required.
<!-- END:change-tracking-rules -->
