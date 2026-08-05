# RegLens — THE DISPATCH

Binding. Chosen direction; full reasoning in `design-directions.md`, rendered
proof in `design-directions.html`. If a rule here fights what you want to do,
the rule wins.

## The idea

The user opens this weekly, usually because something worried them. The most
settling thing you can hand an anxious person is not a control panel — it is
**a dated letter that has already done the thinking**.

So the landing surface is a *briefing*: addressed to the business, dated,
written in sentences, with controls set inline where the sentence that
justifies them ends. The visual language is the professional letter and the
printed law report — one reading measure, a wide outer margin carrying record
data, a serif drawn for continuous reading.

Every AI-built app is a control panel. A written briefing is a different kind
of object, and it cannot be mistaken for a template because templates have no
voice.

## Type — Literata, and nothing else

One family for the whole product. Variable, `opsz` 7–72, weights 300–700, real
italic. Loaded via `next/font/google`.

Chosen because TypeTogether drew it as a screen-native reading serif, and
because it is the closest freely-licensed relative to Century — the family the
US Supreme Court requires for booklet-format briefs under Rule 33.1(b). A
product whose job is to be believed is set in the type its jurisdiction
insists on.

**No monospace, anywhere.** Mono is a UI convention, not a document
convention; a reference work does not switch to Courier to print a date. Use
`font-variant-numeric: tabular-nums` for figures, and letter-spaced uppercase
at 13px in `ink-3` for citations and codes.

| Role | Size / line-height / weight |
| --- | --- |
| Colophon, disclaimer | 12 / 1.6 / 400 `ink-3` |
| Marginalia | 13 / 1.55 / 400 `ink-3`; labels uppercase `+0.07em` |
| Supporting, controls | 15 / 1.5 / 500 |
| Body prose | 18 / 1.75 / 400 |
| The aside voice | 18 / 1.75 / 400 *italic* `ink-2` |
| Sub-head | 24 / 1.3 / 600 |
| Letterhead rule line | 13 / 1 / 600 uppercase `+0.12em` |
| Briefing head (`h1`) | 34 / 1.2 / 600 `-0.015em` |

**Nothing is ever set larger than 34px.** A briefing does not shout. There is
no hero figure — the risk score is a number inside a sentence.

## Colour

| Token | Hex | Allowed on |
| --- | --- | --- |
| `leaf` | `#FBFAF6` | The sheet. The only background in the product. |
| `ink` | `#1A1A17` | Prose, headings. |
| `ink-2` | `#55534C` | Secondary prose, the aside voice. |
| `ink-3` | `#6F6B62` | Marginalia, colophon, dates. |
| `rule` | `#E4E1D7` | Hairlines only. |
| `counsel` | `#1F3A5F` | Words the reader can act on, with a 1px underline of the same colour. The one primary control per section. |
| `late` | `#8E1B12` | The word "late", the number of days. Nothing else. |

**The hard rule: colour never fills an area.** Not a button, not a badge, not a
row, not a chip. Colour inks a glyph or a 1px underline, and that is all. There
is not one filled block of colour in this product.

Budget: `late` at most twice per sheet. `counsel` only on actionable words.

## Layout and navigation

- **No persistent chrome.** No sidebar, no nav bar, no tab bar. A briefing with
  a nav bar is not a briefing.
- **Letterhead**, two lines: `REGLENS` in letter-spaced caps on a rule, then
  `Compliance briefing for {Business} · {weekday day month year}`.
- **Grid.** Sheet max `1160px`: a `66ch` reading column and a `240px` right
  margin, divided by a hairline. The margin carries agency, citation, effective
  date, jurisdiction. **Nothing in the margin is ever essential** — below
  900px it moves inline as a hairline-topped note and nothing is lost.
- **Navigation is:** links inside sentences; one search field in the
  letterhead; one `Index` link in the letterhead and colophon leading to a real
  back-of-book index — alphabetical, two columns, every surface and saved
  object with its count. That is the whole system.
- **Density** is deliberately low on the briefing and higher on corpus
  surfaces, where body drops to 16/1.6 and the margin narrows.

## Two borrowings, bounded

- **Line weight encodes jurisdictional rank**: the hairline under a
  jurisdiction name is 2px federal, 1.5px state/province, 1px dashed local.
- **A headnote block on policy records only** — never on the briefing —
  announcing `AGENCY / STATUS / EFFECTIVE / LAST UPDATED` as labelled fields
  before the prose, as the source documents do.

## Banned

Monospace. Filled colour of any kind. Cards, and boxes inside boxes. Gauges,
dials, meters, sparklines, progress rings. Pills, badges, `rounded-full`.
Coloured spines. Stat-box rows. Staggered entrances, hover lift or shadow.
Uppercase micro-labels used as hierarchy. Emoji, gradients, glassmorphism.
Anything above 34px.

## Writing the briefing

The prose is the product; it is a design artefact, not filler. **Write the
hard cases first** — 0 items, 1 item, 22 items, no profile, first visit, a
database error. If the 22-item briefing cannot be written well the direction
fails, and we need to know immediately.

Hard rule: the briefing names **at most three things** and counts the rest in
one sentence linking to the ledger. Design the count sentence, not an overflow
list. Every briefing's final paragraph ends with a route out.

## Behaviour

Act in place: the control lives in the sentence that justifies it. Empty is a
success state and gets the best sentence in the product. One primary control
per section.

## Motion

Pure CSS only — never gated on a JavaScript media-query read, which returns
"reduced" during server render and killed animation in production once already.
One 180ms fade per sheet on mount. One dispose animation when an item leaves
after you acted. Hover changes ground, nothing moves.

## Verification

`npm run typecheck` and `npm run lint` must pass. Do **not** run `npm run
build`, `dev` or `start` — `.next` is shared and concurrent builds collide.
Keep `scripts/test-ui.ts` passing; where a string must change, change the
assertion deliberately (`dashboard` leaves the product's vocabulary).
