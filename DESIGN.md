# stackr — Design Spec

Approved direction: **Apple-style shell + a dark technical card for generated output.**
Light default; dark follows the OS unless the user picks system, light, or dark in the nav.

`src/app.css` is the source of truth for tokens. This document explains the *decisions*.

---

## 1. Principles

1. **Structure borrowed from a configurator, not a landing page.** Preview on the left,
   one decision on the right, status pinned in the footer. (Apple's buy-Mac flow.)
2. **The summary never leaves the viewport.** Port conflicts, secret count, hardlink status
   update live and stay visible at every step.
3. **Shadows, not borders.** Cards float on the page background. Borders are reserved for
   dividers and inputs.
4. **One accent colour, used for action only.** Blue means "press this". Everything else is
   ink, secondary ink, or line.
5. **Density over emptiness.** Apple can afford a void because the product is a photo. This
   product needs ports, dependencies, and conflict counts visible.
6. **Restraint budget: two typefaces, one accent, zero decoration.** Anything added has to
   displace something.

## 2. Tokens

Defined in `src/app.css`. Never hardcode a colour in a component.

| Token | Light | Dark |
|---|---|---|
| `--bg` | `#fbfbfd` | `#000000` |
| `--surface` | `#ffffff` | `#1c1c1e` |
| `--surface-2` | `#f5f5f7` | `#2c2c2e` |
| `--seg-active` | `#ffffff` | `#3a3a3c` |
| `--ink` | `#1d1d1f` | `#f5f5f7` |
| `--ink-2` | `#5f5f64` | `#98989d` |
| `--ink-3` | `#6e6e73` | `#9a9aa0` |
| `--line` | `#d2d2d7` | `#2d2d30` |
| `--line-soft` | `#ececef` | `#232326` |
| `--accent` | `#0071e3` | `#0a84ff` |
| `--ok` | `#0a7f4b` | `#30d158` |
| `--warn` | `#b4611f` | `#ff9f0a` |
| `--tech-bg` | `#0b1626` | `#101c2e` |
| `--tech-line` | `#16324c` | `#23364e` |
| `--tech-ink` | `#dbeaf7` | `#dbeaf7` |
| `--tech-mute` | `#6b93b8` | `#6b93b8` |
| `--tech-accent` | `#5eead4` | `#5eead4` |

Radii: `--radius: 18px` (cards, panels), `--radius-sm: 12px` (inner cards, inputs).
Shadow: `0 2px 12px rgb(0 0 0 / 6%), 0 1px 2px rgb(0 0 0 / 4%)`.

Input boundaries use a derived `--field-line` (`--ink-3` mixed with `--line`) so the
control edge clears 3:1 against the field fill.

**The technical card is dark in both themes.** It is the instrument panel: diagram, ports,
generated secrets. It stays navy on a white page and lightens slightly in dark mode
(`--tech-bg`), so it reads as an inset in both.

## 3. Typography

| Role | Font | Size | Weight | Tracking |
|---|---|---|---|---|
| Display h1 | Inter Variable | `clamp(38px, 7vw, 58px)` | 600 | `-0.035em` |
| h2 | Inter Variable | 34px | 600 | `-0.03em` |
| Body | Inter Variable | 16px | 400 | `-0.01em` |
| Lede | Inter Variable | 17px | 400 | `-0.01em` |
| Small | Inter Variable | 13px | 400 | `-0.01em` |
| Label | JetBrains Mono | 10–11px | 400 | uppercase, `0.14em` |
| Code / ports | JetBrains Mono | 11–12.5px | 400 | normal |

Line height 1.5 for body, 1.03–1.08 for display.

## 3b. Logo

```text
[ring + nine tiles]  stackr        ← mark, then "stack" in --ink, final "r" in --accent
```

- The mark is a kamon: a ring holding nine service tiles, the centre one a blue
  diamond. It is the catalog — nine services, one chosen. It never replaces the
  wordmark; it sits to its left.
- Primary mark: ring + nine tiles. At 16–20px the tiles soften into texture; the
  ring and the blue diamond carry the mark.
- Lockup: mark at 1× the wordmark size, `0.5em` gap, optically centred. The mark
  box, the word box and the cap height share the same centre line.
- Wordmark: Inter Variable, 600, 16px, tracking `-0.03em`. The `s` is drawn at
  Inter's x-height so it can stand alone; only the final `r` is accented.
- Favicon: the mark alone on a `#fbfbfd` tile.
- The header wordmark is the only home affordance on every route, including `/build`.
  Do not replace it with a text “Catalog” link; the wizard keeps its Back button and the
  result keeps “Back to catalog”. In-page wordmarks are decoration, not navigation.

## 4. Screens

### Catalog
- Centred hero: display h1 + one-sentence lede, max 52ch.
- One search field centred under the lede; `/` focuses it and Escape clears it. There is
  no category filter: category is metadata on every card (`MEDIA · :8096`) and stays
  searchable. The field shows a `/` keycap until it has a query; the keycap is hidden
  on touch widths.
- Card grid: 4 columns ≥1024px, 2 columns ≥640px, 2 columns on phone (never 1 — the cards
  are small enough and 8 services should fit in one thumb-scroll).
- Card: 18px radius, `--surface`, shadow, no border. Contents: 58px icon tile, name 15/600,
  one line ≤7 words, one metadata line (category · port, or category · RAM), and an
  `Add` / `Added` text action. Selected cards get a 20px blue check badge top-right — not a
  coloured border.
- **Bag bar** pinned to the bottom: blurred surface, 1px top rule, `N services` + conflict
  count on the left, blue pill CTA on the right. It replaces a cart page.

### Wizard
- A full-width step header above both columns: the question on the left, the explanatory
  note on the right (stacked below 1024px). The preview card and the first option card
  therefore share a top edge.
- Two columns below the header: **preview left (flex 1)**, **options right (520px)**.
- Preview is the real white code card, with no outer mat; inside it shows the *real*
  generated YAML. Never a stylised mock — credibility depends on it being the artifact.
- Below 1024px the preview collapses to a 56px `Preview · compose.yaml · Show` bar, so the
  first question stays near the top. Code is capped at ~56vh on desktop.
- Options: radio rows separated by 1px `--line-soft`. Selected = 5px blue ring on the radio.
- Footer status bar: `Ports — no conflicts · Hardlinks — one mount · Secrets — 4`, then the CTA.
- Progress: five segments + `Step 3 of 5`. No percentages.
- Reference material (environment variables, folder commands) uses native `<details>`,
  labelled with what is inside; the decision itself stays visible.

### Result
- Two columns: **dark technical card left**, **one file card right**; the Checks strip
  spans the full width beneath both.
- Technical card: topology diagram (nodes = rects with name, image tag, port), generated
  secrets beneath a rule, all in JetBrains Mono.
- File card: the tab strip (`compose.yaml` / `.env`) lives inside the card head, so the
  card still top-aligns with the technical card. One pane at every width, with meta, hint,
  copy and download. Both download buttons name the visible file.
- Checks strip: Ports / Hardlinks / Volumes / Generated in browser — value in `--ok`.
- Footer: `Run docker compose up -d` with the command in mono, plus the download CTA.

## 5. Responsive

| Breakpoint | Behaviour |
|---|---|
| ≥1024px | As specified above; preview expanded; checks strip 4-up |
| 640–1023px | Catalog 2 columns; wizard preview is a collapsed bar above options; result keeps two columns and a 2-up checks strip |
| <640px | Single column. Bag bar becomes a floating pill. Wizard preview stays collapsed. Footer status collapses to one line (`Ports — ok`) before the CTA |

**The result screen does not shrink — it changes shape.** Below 640px the topology diagram is
replaced by a **vertical spine**: services stacked down one trunk line, port right-aligned,
the shared volume as a dashed card. The file tabs stay inside the file card at every width;
only the column count and topology shape change.

Touch targets ≥ 44px. No horizontal scroll at 375px.

## 6. Component rules

**Option row (the configurator pattern)** — three parts, always:

```text
Plain Linux                    ← what it is
/srv/media, hardlink-safe      ← the consequence
0 extra steps                  ← what it costs you
```

`consequence` and `cost` are fields in `service.md` frontmatter. An option without a
consequence line is a bug.

**Disable, never reject.** Impossible combinations (Vaultwarden without TLS, colliding port,
Immich under 4 GB) render disabled with the reason inline. The user must never reach the
download step and fail.

**One verb per button:** Continue, Review, Download. Never "Submit", "Generate", "Build".

**Generated secrets are masked by default** with a reveal + copy action, auto-hiding
after ~30s, and a mono comment explaining the format. A secret the user cannot read is a
secret they will regenerate by hand.

**No modals in the wizard.** If something needs a modal, it needs a step.

**Copy feedback** is a 1.5s icon swap (copy → check) plus a polite screen-reader announcement; the control keeps a stable accessible name. No toast.

## 7. Content rules

- Sentence case everywhere. No Title Case In Headings.
- Numbers are specific: "4 secrets", "2 conflicts", "8.4 KB".
- Warnings state the consequence, not the category: "Anything that can write to
  `/var/run/docker.sock` is root on this host" — not "Security warning".
- No emoji as icons. Service icons come from selfh.st; UI icons from Lucide.

## 8. Do not

- Add Tailwind or a component library. The design is bespoke; scoped CSS + tokens is enough.
- Add a second accent colour or a decorative gradient.
- Put a border on a card.
- Add skins or themes beyond system / light / dark.
- Use `--tech-*` tokens outside the technical card.
