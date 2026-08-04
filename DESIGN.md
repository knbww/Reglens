# RegLens — design direction

Binding. Read before touching UI. If a rule here fights what you want to do,
the rule wins.

## The idea

**RegLens is a register, not a dashboard.**

Regulation lives in gazettes, statutes, filings and registers. This product
should feel like a well-made modern reference work — authoritative,
typographically serious, records treated as records. It should not feel like
analytics software, and it should not feel like a startup landing page.

Everything below follows from that one idea. When in doubt, ask: would a
serious reference publication do this?

## Already decided — do not relitigate

- **No sidebar.** Navigation is a horizontal top bar in the masthead
  (`components/app/nav/top-nav.tsx`). Content gets the full width.
- **IBM Plex Sans + IBM Plex Mono.** Mono is not decoration: every value that
  is a *record* is set in it — citations, statute numbers, jurisdiction codes,
  dates, scores, counts. Prose is never mono.
- **Two colours.** `seal` (deep green) for anything the system asserts or you
  can act on: primary buttons, links, active nav. `alert` (red) means *late*
  and nothing else, ever. Everything else is ink on paper.
- **Radius is 4px.** Nothing in this product is pill-shaped.

## Banned — these are why the last three attempts read as machine-made

- Coloured accent bars or spines on the edge of cards
- Gauges, dials, donuts, meters, sparklines, progress rings
- Semantic colour ramps applied across many elements at once
- Pills and badges stacked in rows; any `rounded-full` container
- Staggered entrance animations; cards that lift, scale or shadow on hover
- A bordered card containing bordered rows
- Uppercase letter-spaced micro-labels used as hierarchy
- Emoji, gradients, glassmorphism, icon-per-feature rows
- Four bordered stat boxes across the top of a page

## Structure

**One question per page.** Write it as a comment at the top of the page
component. If a page answers three, it is three pages or three tabs.

**Act in place.** A row that can only be clicked through to somewhere else is a
failure. The action that disposes of a thing belongs on the thing.

**Empty is a success state**, and gets the same care as a full screen.

**Page anatomy** — nothing else competing:

1. Context line, small, muted
2. `h1` stating the answer, not the feature name
3. Optionally one supporting line
4. Content, separated by space and hairlines
5. Reference material last and visibly quieter, or on another page

**The margin.** Long-form pages (policy detail, reports, analyst answers) use a
two-column grid: a reading column of ~68ch and a narrow margin column holding
the record data — jurisdiction, agency, citation, effective date — set in mono.
That is how a reference work handles marginalia, and it removes the need for
definition-list grids and tag rows.

**Widths.** Reading: `max-w-2xl`. Lists and forms: `max-w-4xl`. Tables and
comparison: the full `max-w-6xl`.

## Type

| Class          | Use                                              |
| -------------- | ------------------------------------------------ |
| `text-figure`  | One hero number per page, at most                 |
| `text-display` | `h1` — the page's answer                          |
| `text-title`   | Section heads                                     |
| `text-[15px]`  | Body, row titles                                  |
| `text-[13px]`  | Supporting text                                   |
| `text-xs`      | Context lines, captions                           |
| `font-mono`    | Every record value. Add `tabular` in columns.     |

Weights 400 / 500 / 600 only. `leading-7` for prose.

## Components

- **One filled button per view.** Everything else is `ghost` or an underlined
  text link (`underline decoration-line-strong underline-offset-4`).
- **Rows, not cards.** Hairline separators, hover ground, generous padding.
  A border only when the thing is genuinely a separate object.
- **Forms**: label above, hint below, full width, real validation text.
- **Tables** for genuinely tabular data. `overflow-x-auto` on the container,
  never on the page.

## Motion

Pure CSS only. Never JavaScript-driven — a previous attempt gated animation on
a JS media-query read that defaulted to "off" during server render, so nothing
animated in production.

- `.rise` — one 180ms fade-up per region on mount. No stagger.
- `.dispose` — an item leaving after you acted on it. The only animation that
  means anything. Keep it.
- Hover changes background colour. Nothing moves.

## Accessibility

Colour is never the only signal. Visible focus ring on everything. Icon-only
controls get `aria-label`. Graphical figures also state their value in text.

## Verification

`npm run typecheck` and `npm run lint` must pass. Do **not** run `npm run
build`, `dev` or `start` — the `.next` directory is shared and concurrent
builds collide.
