---
name: qBittorrent
slug: qbittorrent
category: media
summary: Torrents, seeded
consequence: Saves downloads into /data/downloads, inside the shared mount.
cost: The first Web UI password is printed in the container log.
ports: [8080, 6881]
ram: 512 MB
deps: [sonarr, radarr]
tags: [torrents, downloader]
generators: {}
---

# qBittorrent

qBittorrent is the download client Sonarr and Radarr hand releases to. It saves
into `/data/downloads`, which is inside the same mount the arr apps see, so
finished files can be hardlinked into the library and still keep seeding.

On first start, the container prints a temporary password for `admin` in its
log. Open the Web UI, change the password immediately, then set **Tools →
Options → Downloads → Default save path** to `/data/downloads`. Create
`tv` and `movies` categories and point Sonarr and Radarr at
`/data/downloads/tv` and `/data/downloads/movies`.

The torrent port (6881 by default) is published as both TCP and UDP so peers can
connect to you. If another service already uses 8080, change the Web UI port in
the ports step — the container listens on the same port on both sides.
