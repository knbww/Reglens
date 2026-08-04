# RegLens — design brief

## The situation

RegLens is a working Next.js 16 app. The engineering is sound; the tests pass.
**The design has been rejected three times by the client**, in these words:

> "The entire design is bad from start to finish… The UI and UX are simply
> subpar. It still reads like 'made by Claude Code, so the design is terrible.'
> … Bottom line: you changed the font, changed the color, and that's it."

Each attempt produced the same thing: left sidebar, top header, grey-on-white,
hairline borders, one neutral sans, one accent colour, cards in a grid. That is
the default an LLM produces for any web app, and the client can see it.

The brief is therefore not "restyle". It is: **decide what this product should
be, visually and structurally, and justify it from the subject matter.**

## The product

Regulatory compliance for small cross-border businesses in the US, Canada and
Mexico. The reference user is Frostonic: a direct-to-consumer brand importing
cold-plunge tubs from China and Vietnam, selling into the US, planning a
Canadian launch. Owner-operated. Not a compliance professional.

They open RegLens perhaps weekly, usually because something worried them. What
they need: what applies to me, what is late, what do I do next, and reassurance
when nothing is wrong.

The data is real and worth reading — see `src/data/policies.ts`,
`src/data/jurisdictions.ts`, `src/data/updates.ts`, `prisma/schema.prisma`.
Real statutes, agencies, citations, effective dates, penalties.

## Problems to solve — specific, and each one evidenced

**Structural**

1. Every row in the product is a link to somewhere else. The screens are tables
   of contents: you land, read lists, click away, lose your place. Almost
   nothing can be *done* where you find it. (Partly addressed on the dashboard
   only, via `src/components/app/today/today-queue.tsx`.)
2. The dashboard showed six-to-nine equally-weighted lists. No entry point.
3. Twelve routes with unclear hierarchy. Navigation was reduced to five items
   but the routes behind them were never consolidated: planner and reminders
   are two screens over one idea (`Reminder` already has a `taskId` foreign key
   to `Task`), and compare is a mode of search rather than a sibling of it.
4. Onboarding — the single highest-value screen, the thing that makes every
   other screen relevant — is a 670-line form, and it drops the user on a
   generic dashboard at the end instead of showing what was found for them.
5. "Compare jurisdictions" produces parallel walls of prose. Differences, which
   are the entire point, are not what the eye lands on.
6. The public landing page reads as a generic SaaS template.

**Visual**

7. No point of view about the subject. Nothing about the interface says
   "regulation" rather than "generic B2B app".
8. Colour has been used decoratively — a four-rung severity ramp painted across
   dozens of elements at once, so none of it signalled anything.
9. Charts were added (arc gauge, deadline timeline, jurisdiction strata,
   segmented relevance meters) and read as gimmicks: they encoded density or
   repeated what the adjacent list already said.
10. Typography has never carried the design. First 9px of range between `h1`
    and body; then a display serif that was unreadable at figure sizes.
11. Animation was decorative (staggered card entrances) and one attempt gated
    motion behind a JavaScript media-query read that returned "reduced" during
    server render, so nothing animated in production at all.

## What "good" looks like

- A stranger should not be able to tell this was designed by an AI.
- It should look like it was made *for regulatory compliance* specifically —
  the visual language should come from the subject, not from a UI kit.
- Calm and authoritative. The user is anxious; the product should settle them.
- Dense where it needs to be, without being busy. This is a professional tool,
  not a consumer app.
- Beautiful in the way a well-made reference book, instrument or document is
  beautiful — through proportion, typography and restraint.

## Hard constraints

- Next.js 16 App Router, React 19, Tailwind v4, `next/font/google` only.
- Light theme only for now. Must print (there are `@media print` rules).
- Must stay accessible: visible focus, real semantics, colour never the sole
  signal, works at 390px.
- The browser suite in `scripts/test-ui.ts` drives the real UI. Any redesign
  must keep its roles, accessible names and visible strings working.
- No new runtime dependencies without a reason.

## Explicitly open — do not assume the current answers

Navigation position and whether it should persist at all. Page composition.
Whether cards should exist. Colour, including whether there should be any.
Type pairing. Density. Whether the dashboard should exist as a concept.
