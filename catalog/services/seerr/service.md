---
name: Seerr
slug: seerr
category: media
summary: Requests, handled
consequence: Lets other people request films and shows into Sonarr and Radarr.
cost: Everyone needs a Jellyfin login; you approve what they ask for.
ports: [5055]
ram: 512 MB
deps: [jellyfin, sonarr, radarr]
tags: [requests, users]
generators:
  SEERR_API_KEY: hex32
---

# Seerr

Seerr gives everyone else a simple page to request movies and shows. Requests
flow into Sonarr and Radarr, and Seerr shows what is already in the Jellyfin
library, so nobody requests the same season twice.

The compose file passes `API_KEY` from `.env`. Seerr uses that value as its own
API key, so the key is stable across restarts instead of being generated into
the config folder on first boot. The value is 32 hex characters: safe in a URL,
a header and the `.env` file.

First start: open `http://<host>:5055`, sign in with the Jellyfin admin account,
then add Jellyfin, Sonarr (`http://sonarr:8989`) and Radarr
(`http://radarr:7878`). Seerr handles its own user logins through Jellyfin.
The config folder must be writable by the PUID/PGID you chose; the container
runs as that user.
