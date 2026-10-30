# stackr

Generate a `compose.yaml` + `.env` for a self-hosted media stack, in the browser.
Static site, no backend, no accounts, no telemetry.

## Quick start

```bash
bun install
bun run dev        # http://localhost:5173
bun run build      # static output in dist/
bun run check      # typecheck
bun test           # unit + golden tests
```

The catalog has nine services: Jellyfin, Sonarr, Radarr, Prowlarr, qBittorrent,
Seerr, Dozzle, Immich, and Audiobookshelf. The wizard walks Host → Storage → Ports →
Inputs → Review and downloads two files: `compose.yaml` and `.env`.

## Deploy

Cloudflare Workers Static Assets via `wrangler.jsonc`. The deploy workflow is
`.github/workflows/deploy.yml`; it runs on pushes to `main` or `master` and on
manual dispatch.

Required repository secrets:

| Secret | Value |
|---|---|
| `CLOUDFLARE_API_TOKEN` | API token with **Account → Workers Scripts → Edit** |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID |

`ci.yml` runs typecheck, tests, build, golden compose validation, and the
prerender checks. `images.yml` runs weekly to check pinned image tags and
`linux/arm64` manifests.

## Docs

`PLAN.md` for decisions and milestones, `DESIGN.md` for the visual spec, and
`LEARNINGS.md` for behaviour rules and rejected options.

## Built with

[agents-opencode](https://github.com/shahboura/agents-opencode) — the agent pack used to build stackr.
