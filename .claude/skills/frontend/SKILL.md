---
name: frontend
description: Applies distinctive frontend design principles for the ARGPT financial dashboard. Use when building or improving UI, creating pages, styling components, or working on any visual frontend task.
---

You tend to converge toward generic, "on distribution" outputs. In frontend
design, this creates what users call the "AI slop" aesthetic. Avoid this: make
creative, distinctive frontends that surprise and delight.

## ARGPT Dashboard Context

This is a financial portfolio dashboard. Design accordingly:
- **Dark theme by default** — reduces eye strain for market-hours monitoring
- **Monospaced numbers** — tabular figures for aligned columns in tables
- **Green/red P&L coloring** — green for gains, red for losses, neutral for zero
- **Data-dense tables** — compact rows, no wasted space, scannable at a glance
- **Portfolio-appropriate typography** — professional, readable, not playful
- **Currency formatting**: ARS uses `.` for thousands and `,` for decimals (1.234.567,89). USD uses `,` for thousands and `.` for decimals (1,234,567.89)

## Workflow

1. **Understand the context** before writing any CSS or markup. What data is
   being displayed? What decisions will the user make from it?

2. **Make deliberate aesthetic choices** — pick a direction and commit to it:
   - Choose a font pairing (heading + body) that has personality
   - Define a color palette with 1 dominant color and 1-2 sharp accents
   - Dark theme with proper contrast ratios
   - Set the overall mood: technical, precise, data-forward

3. **Build with progressive enhancement** — the page works without JavaScript.
   Vanilla JS enhances interactions. Semantic HTML first, then style.

4. **Prioritize accessibility** — semantic HTML elements, proper labels, ARIA
   attributes when needed, keyboard navigation, sufficient contrast ratios.

## Design principles

**Typography**: Use monospaced or tabular-figure fonts for all numeric data.
Choose a distinctive sans-serif for headings and labels. Avoid generic fonts
like Arial, Inter, Roboto, and system fonts.

**Color & Theme**: Dark background, muted UI chrome, high-contrast data.
Use CSS variables for consistency. Reserve bright colors for actionable data
(P&L, alerts, significant changes). Draw from terminal/IDE aesthetics.

**Motion**: Minimal — financial data should feel stable. Subtle transitions
for state changes only. No decorative animations.

**Layout**: Data-dense tables are the primary UI. Support sorting and filtering.
Use generous column spacing but compact row height. Dashboard grid for summary
cards above detail tables.

## What to avoid

- Playful or decorative aesthetics
- Wasted whitespace in data tables
- Animations that distract from data
- Generic SaaS dashboard look
