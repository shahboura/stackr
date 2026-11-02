<p align="center">
  <img src="static/icon.png" width="76" height="76" alt="" />
</p>

<h1 align="center">stackr</h1>

<p align="center">
  Pick your services. Get a working <code>compose.yaml</code> + <code>.env</code> for a
  self-hosted media stack — in the browser.
</p>

<p align="center">
  <a href="https://github.com/shahboura/stackr/actions/workflows/ci.yml"><img src="https://github.com/shahboura/stackr/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://github.com/shahboura/stackr/actions/workflows/deploy.yml"><img src="https://github.com/shahboura/stackr/actions/workflows/deploy.yml/badge.svg" alt="Deploy" /></a>
</p>

## Why

Setting up a media stack starts with ten browser tabs: which image tag, which PUID, which port, what secret format Sonarr expects. stackr asks five questions and hands back two files you can run.

No backend, no accounts, no telemetry.

## What you get

- **`compose.yaml`** — nine services, pinned tags, LAN-only port mappings.
- **`.env`** — secrets generated with WebCrypto, in the format each service expects.
- **No silent breakage** — ports are checked for conflicts before you download, and a weekly job verifies every pinned tag still publishes a `linux/arm64` manifest.

Services: Jellyfin · Sonarr · Radarr · Prowlarr · qBittorrent · Seerr · Dozzle · Immich · Audiobookshelf.

Guide pages for each service are generated from the same folders that drive the wizard.

## Quick start

```bash
bun install
bun run dev        # http://localhost:5173
bun run build      # static output in dist/
bun run check      # typecheck
bun test           # unit + golden tests
```

The wizard walks Host → Storage → Ports → Inputs → Review and downloads `compose.yaml` and `.env`.

## Deploy

Cloudflare Workers Static Assets via `wrangler.jsonc`. `.github/workflows/deploy.yml` runs on pushes to `main` or `master` and on manual dispatch.

| Secret | Value |
|---|---|
| `CLOUDFLARE_API_TOKEN` | API token with **Account → Workers Scripts → Edit** |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID |

`ci.yml` runs typecheck, tests, build, golden compose validation, and prerender checks. `images.yml` runs weekly to check pinned image tags and `linux/arm64` manifests.

## Docs

`PLAN.md` for decisions and milestones, `DESIGN.md` for the visual spec, and `LEARNINGS.md` for behaviour rules and rejected options.

## Built with

[agents-opencode](https://github.com/shahboura/agents-opencode) — the agent pack used to build stackr.
