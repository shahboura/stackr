---
name: Prowlarr
slug: prowlarr
category: media
summary: One indexer list
consequence: Syncs indexers and categories to Sonarr and Radarr.
cost: Each indexer still needs its own account and API key.
ports: [9696]
ram: 256 MB
deps: [sonarr, radarr]
tags: [indexers, automation]
generators: {}
---

# Prowlarr

Prowlarr holds your indexers — torrent trackers and Usenet indexers — in one
place and pushes them to Sonarr and Radarr, including their API keys and
categories. Add an indexer once instead of twice.

It does not touch media, so it only mounts its own config folder. Open
`http://<host>:9696`, add your indexers, then open **Settings → Apps** and add
Sonarr and Radarr using the hostnames `sonarr` and `radarr` and their ports
`8989` and `7878`. Both apps are on the same Docker network, so those names
resolve without a static IP.

Prowlarr does not download anything itself. If an indexer fails a test, check
the indexer credentials before changing anything in the arr apps.
