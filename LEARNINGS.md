# Learnings

Decisions from the design and brainstorming thread that are **not** obvious from
`PLAN.md` or `DESIGN.md`. Read this before adding a feature: most of it is either a
trap we already hit, or something deliberately rejected.

---

## 1. Product behaviours

1. **Detect instead of ask.** PUID/PGID from pasted `id` output (`uid=1000(bob)`), timezone
   from `Intl.DateTimeFormat().resolvedOptions().timeZone`, path preset from the OS answer.
   Every prefilled field is one the user cannot get wrong.
2. **Env rows carry provenance.** Show `type · default · required` beside every variable,
   generated from the same zod schema that validates it. This is the only thing that
   answers "what do I put here?" without a docs page.
3. **Show the change, not just the value.** When PUID changes, mark which services it
   affects. When a service is added, show the secrets it introduces.
4. **Secrets are masked by default**, with reveal + copy, auto-hide after ~30s.
5. **Tab selection persists** between `compose` and `.env` while moving through steps.
6. **The command is the hero** of the result screen: `docker compose up -d`, selectable.
7. **The result ends at the run command and file download.** No post-download
   checklist (removed by request).
8. **Plain / annotated toggle** on the composed YAML. Plain is what you copy; annotated
   explains each block. The plain view must be byte-identical to the download.
9. **Preview renders the real artifact**, never a stylised mock.
10. **A card says what you get in ≤7 words plus one technical tag.**
11. **One verb per button**: Continue, Review, Download.
12. **No modals in the wizard.** If it needs a modal, it needs a step.
13. **Named steps, five segments, no percentage.**
14. **The summary is pinned and live** at every step.
15. **Disable impossible choices with an inline reason** instead of rejecting at the end.

## 2. Content and SEO

- Every service page is prerendered; unique title and a description taken from the
  frontmatter `summary` (≤70 chars).
- `sitemap.xml` and `robots.txt` are generated from the catalog at build time.
- JSON-LD `SoftwareApplication` per service.
- `og:image` per service generated at build (satori/resvg). For this audience Discord and
  Reddit unfurls matter more than Google.
- Canonical tags so `/services/<slug>` and stack pages do not compete.
- **`noindex` on `/build`.** Wizard state lives in the URL hash, which crawlers ignore.
  Never move it to query params — that floods the index with permutations.
- **Guide prose is mandatory.** The schema fails the build when `service.md` has no body.
  50 thin pages get ignored or downgraded; the prose is the only thing that cannot be
  generated.
- Pagefind only once docs exceed ~30 pages. Below that, a client-side filter is enough.

## 3. Engineering conventions

- `crypto.getRandomValues` only. Lint against `Math.random`.
- **No third-party font CDN.** Fonts are self-hosted via `@fontsource-variable/*` so the
  "nothing uploaded / no telemetry" claim stays true.
- Passwords default to an `[A-Za-z0-9]` alphabet: `/`, `+`, `$` break some `.env` parsers
  and shell interpolation.
- Compose output: no `container_name`, healthchecks only when upstream documents one,
  `${VAR}` interpolation only.
- **Variables are derived** by scanning `${...}` in `compose.yml`. A variable cannot appear
  in `.env` unless compose uses it — drift becomes impossible.
- Schema validation fails the **build**, not the request.
- Golden-file tests: the media bundle output is committed and diffed in PRs.
- `docker compose config` runs in CI on the golden output. It is the only real proof the
  YAML is valid.
- Weekly `docker manifest inspect` per image: tag resolves **and** `linux/arm64` exists.
- Pin minor tags (`:1.20`). Never `:latest`, never digests.

## 4. Toolchain notes (SvelteKit 3 / Svelte 5)

- The adapter lives in `vite.config.ts` inside `sveltekit({ adapter })`. **There is no
  `svelte.config.js`** in this version.
- Runes are forced project-wide via `compilerOptions.runes`.
- `adapter-static` config: `{ pages: 'dist', assets: 'dist', fallback: undefined }`.
- Prerender: `export const prerender = true` in `src/routes/+layout.ts`.
- bun: `bun run --cwd <dir> <script>` — the flag goes **after** `run`, not before.

## 5. Deliberately rejected — do not add

| Rejected | Why |
|---|---|
| Permalink / shareable wizard state | Serialization plus versioning; old links rot as templates change |
| ZIP download | Two files. Copy and save are enough |
| `.env.example` | Only helps if committed; most people won't |
| Manual theme toggle | **Reversed by request**: system / light / dark switch |
| Multiple skins (paper / blueprint / terminal) | One identity, not three |
| Interactive diagram (click a node to edit) | Expensive half of that screen |
| argon2 / bcrypt | Needs WASM; only Vaultwarden and htpasswd use it. Lazy chunk later |
| Search index, Pagefind, Fuse | A filter over <60 items is instant |
| Tailwind, any component library | Bespoke design; scoped CSS plus tokens |
| Accounts, telemetry, analytics, i18n | Not the product |
| Reverse proxy / tunnel generation | LAN only in v1 |
| Nextcloud in the first bundle | Trap: trusted_domains, overwriteprotocol, cron container, Redis, DB |

## 6. Open risks

- **Hardlinks must be validated on real hardware** with real PUID/PGID/umask before the
  arr bundle ships. Wrong paths silently turn hardlinks into copies, which nobody notices
  until the disk fills.
- Upstream env var names drift. Every template is checked against current upstream docs
  when authored — never from memory.
- Golden files catch format drift, not semantic wrongness. The qBittorrent ↔ arr wiring is
  the most likely source of a config that validates but does not work.
