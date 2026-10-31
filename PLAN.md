# Compose Wizard — v1 Plan

A static site that generates `compose.yaml` + `.env` for a self-hosted stack, in the
browser, with secrets that are correct per service.

**Status:** approved. M0 (scaffold) complete. The v1 catalog shipped with seven services;
Immich and Audiobookshelf were added afterwards (see `README.md`).

Companion documents: `DESIGN.md` (visual spec) and `LEARNINGS.md` (behavioural rules, conventions, and things deliberately rejected). Read both before adding a feature.

---

## 1. Decision list

| # | Decision | Chosen | Why |
|---|---|---|---|
| 1 | Framework | SvelteKit 3 (Svelte 5) + `adapter-static` | The wizard is a stateful form app (~70% of the work); SvelteKit prerenders guide pages without treating the app as a guest |
| 2 | Design | Apple shell + dark technical card, light default + `prefers-color-scheme` dark | Approved from mockups |
| 3 | Exposure model | LAN only | Settled; no proxy, no tunnel in v1 |
| 4 | Output | One `compose.yaml` + one `.env`, two actions (copy / download) | One folder, one `docker compose up -d` |
| 5 | Template format | `service.md` (frontmatter + prose) + `compose.yml` | Prose can't be generated; compose is the source of truth for variables |
| 6 | Scope | 7 services, media bundle | The hardlink/arr stack is where real failure happens |
| 7 | Secrets | WebCrypto generators, values visible and copyable | "No bash" is the pitch |
| 8 | Hashing | Deferred (lazy `hash-wasm` later) | Needs WASM; only Vaultwarden/proxy basic-auth need it |
| 9 | Search | Live filter over the catalog | 7–60 items; no index needed |
| 10 | Pinning | Minor tags + scheduled image check in CI | `:latest` breaks users silently |
| 11 | Hosting | Cloudflare Workers Static Assets, no Functions | Static output only |
| 12 | Styling | Scoped CSS + one tokens file. **No Tailwind** | The design is bespoke; tokens + `.svelte` scoped styles need zero config and no extra build step |

**Assumptions**
- English only. No accounts, no telemetry, no server-side anything.
- `docker compose` v2 syntax; no Swarm, no Podman-specific keys.
- The author can validate the arr-stack hardlink setup on real hardware.

**Open items**
- Project name / domain → placeholder `stackr` in the UI.
- Repo location → **`/data/repos/stackr`** (settled).
- Whether guide pages ship in v1 → assumed **yes**, they're generated from the same folders.

---

## 2. Acceptance criteria (v1)

- A first-time user can go from landing page to a downloaded folder in **under 3 minutes**.
- The generated `compose.yaml` passes `docker compose config` with no warnings.
- The generated `.env` contains **no placeholder strings** — every secret is a real value.
- Selecting two services with the same host port shows a conflict **before** the download step.
- Every service page is reachable without JavaScript and has a unique title + description.
- The site works at 375 px with no horizontal scroll.
- Copy buttons copy exactly the file contents (no trailing newline drift, no HTML entities).

---

## 3. Repo layout

```text
/
├── catalog/
│   ├── services/
│   │   ├── jellyfin/{service.md, compose.yml}
│   │   ├── sonarr/{service.md, compose.yml}
│   │   ├── radarr/{service.md, compose.yml}
│   │   ├── prowlarr/{service.md, compose.yml}
│   │   ├── qbittorrent/{service.md, compose.yml}
│   │   ├── seerr/{service.md, compose.yml}
│   │   └── dozzle/{service.md, compose.yml}
│   └── bundles/
│       └── media.ts            # which services, preset answers
├── src/
│   ├── lib/
│   │   ├── catalog/            # loader + zod schema + derived variables
│   │   ├── compose/            # parse fragments → merge → emit YAML
│   │   ├── secrets/            # generators
│   │   ├── wizard/             # question graph, port checks, dep resolution
│   │   └── ui/                 # Button, Card, Option, Field, CopyButton
│   └── routes/
│       ├── +page.svelte        # catalog
│       ├── build/+page.svelte  # wizard
│       ├── services/[slug]/+page.svelte
│       └── +layout.svelte
├── static/
├── tests/
│   ├── golden/                 # expected compose + env output
│   └── *.test.ts
└── .github/workflows/
    ├── ci.yml
    └── images.yml
```

Adding a service = adding one folder. Everything else is derived.

---

## 4. Data contract

### `service.md`

```md
---
name: Immich
slug: immich
category: photos
summary: Photo and video backup with face recognition
ports: [2283]
ram: 4GB
deps: [postgres, redis]
tags: [photos, backups]
generators:
  DB_PASSWORD: alnum32
---
# Immich

Photo and video backup...
```

Rules:
- `slug` must equal the directory name (checked at build).
- `summary` is ≤ 70 characters — it's the catalog card *and* the meta description.
- `ports` are host ports; collisions are computed from these.
- `generators` keys must exist as `${VARS}` in `compose.yml` (checked at build).

### `compose.yml`

- Plain Compose, no templating syntax beyond `${VAR}`.
- Every `${VAR}` is either: present in `generators`, present in the bundle preset,
  or prompted as a plain field.
- No `container_name` (breaks scaling and `docker compose` naming).
- No host port bindings without a matching `ports:` entry in frontmatter.
- Healthchecks only when the image ships a known-good one — never invented.

### Variable derivation

```text
compose.yml  ──scan ${VARS}──►  set of required variables
                                     │
        generator? ─────────────────┤──► generate value
        preset?    ─────────────────┤──► use preset
        otherwise  ─────────────────┴──► prompt with default + type
```

This makes drift impossible: a variable cannot exist in `.env` unless the compose file uses it.

---

## 5. Secrets module

| Kind | Function | Used by |
|---|---|---|
| `hex32` | 16 random bytes → 32 hex chars | *arr API keys |
| `hex64` | 32 bytes → 64 hex chars | generic tokens |
| `base64_32` | 32 bytes → base64, no padding issues | oauth2-proxy style |
| `base64url_32` | 32 bytes → base64url | cookies |
| `alnum32` | 32 chars `[A-Za-z0-9]` | DB passwords (no `/ + $`) |
| `uuid` | `crypto.randomUUID()` | instance IDs |

Rules:
- `crypto.getRandomValues` only. No `Math.random` anywhere (lint rule).
- Generated values are **always visible** with reveal/copy — never hidden behind a download only.
- Every value is labelled with *why* that format (shown in the `.env` comment).
- Charset choice is per service, not cosmetic: `/` and `+` break some `.env` parsers.

Future: `hash-wasm` lazy chunk for argon2/bcrypt (Vaultwarden hashed token, htpasswd).

---

## 6. Build pipeline

```text
catalog/**            ─► zod validation ─► CatalogIndex (JSON, ~2 KB)
compose.yml fragments ──► parse → merge by service ──► emit YAML (banner + sections)
service.md            ─► frontmatter → meta; body → prerendered HTML
                          │
                          ├─► /services/[slug] (prerendered)
                          ├─► sitemap.xml
                          ├─► robots.txt
                          ├─► JSON-LD SoftwareApplication
                          └─► og:image (build-time SVG → PNG, optional)
```

YAML emission: parse to objects, merge, dump with a stable key order, prepend a
banner comment. Per-service comments inside the compose file are lost — guidance
lives in `.env` comments and on the service page instead.

---

## 7. Wizard behaviour

1. **Catalog** — select services; footer pins `N services · conflicts · secrets`.
2. **Steps** (5, one decision each):
   1. Where it runs (Linux / Unraid / Synology) → paths, PUID, PGID, umask
   2. Media layout (`/srv/media` structure) → volumes, hardlink check
   3. Ports → collisions, remap suggestion
   4. Services needing input → API keys, admin email, TZ (auto-detected)
   5. Review → conflicts, generated secret count, warnings
3. **Result** — one tabbed file card (`compose.yaml` / `.env`) + dark technical card + checks strip + download.

Rules baked in from the design review:
- Summary stays pinned; never scrolls away.
- Every option states **what it is / the consequence / what it costs**.
- Impossible choices are **disabled with a reason**, never rejected at the end.
- One verb per button: Continue / Review / Download.
- No modals in the wizard.
- Changing a value highlights what it affects (e.g. PUID → 3 services).

---

## 8. Testing

| Check | What it proves |
|---|---|
| Golden-file test: build the media bundle, compare `compose.yaml` + `.env` to committed snapshots | Output is stable and reviewable in PRs |
| `docker compose config` in CI on the golden output | The YAML is actually valid Compose |
| Zod schema test per service folder | A new template can't ship malformed |
| Port-collision unit tests | Two services on `8080` is caught |
| Generator tests: charset, length, uniqueness across 10k runs | Secrets are the right shape |
| `prefers-color-scheme` + 375 px snapshot | Responsive and dark mode don't regress |
| No-`Math.random` lint | Secrets stay cryptographic |

---

## 9. CI

**`ci.yml`** — typecheck, lint, unit tests, build, lighthouse budget (perf ≥ 95 on the catalog page).

**`images.yml`** — weekly: for every image in every `compose.yml`, run
`docker manifest inspect` and check (a) the tag still resolves, (b) `linux/arm64`
exists. Opens one PR listing drift.

This is the only thing that keeps a static site honest over years.

---

## 10. Milestones

| M | Deliverable | Done when |
|---|---|---|
| M0 | Scaffold: SvelteKit + static adapter + tokens | `bun run build` emits `dist/`, deploys to Workers |
| M1 | Catalog loader, schema, compose emitter, golden test | 2 services emit correct YAML + env |
| M2 | Wizard: 5 steps, pinned summary, port checks | Media bundle produces both files |
| M3 | Result screen, dark technical card, copy/download | Files copy byte-exact |
| M4 | Remaining 5 services + hardlink validation | 7 services, `docker compose config` clean |
| M5 | Prerendered service pages + sitemap + meta | Every page readable with JS off |
| M6 | CI: golden output, image freshness | Green on a fresh clone |

---

## 11. Risks

| Risk | Mitigation |
|---|---|
| arr-stack paths wrong → hardlinks silently become copies | Validate against real hardware before M4; document the check in the UI |
| Template rot | `images.yml` weekly |
| Thin SEO pages | `service.md` prose required by schema |
| `.env` charset issues | Restricted alphabets by default, no `/ + $` in passwords |
| Docker socket warning ignored | Inline, specific, non-dismissable in the Dozzle step |
| Scope creep into a proxy/tunnel | Explicitly out of v1 |
