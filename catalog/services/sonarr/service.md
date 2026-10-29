---
name: Sonarr
slug: sonarr
category: media
summary: TV, fetched and filed
consequence: Watches indexers and imports episodes into /data/media/tv.
cost: Needs qBittorrent and a root folder before it does anything.
ports: [8989]
ram: 512 MB
deps: [jellyfin]
tags: [tv, automation]
generators: {}
---

# Sonarr

Sonarr watches your indexers for new episodes, sends releases to a download
client, and renames and files whatever arrives. It is the piece that turns a
download folder into a library Jellyfin can read.

Both Sonarr and qBittorrent mount the media root at `/data`. That shared mount
is what makes hardlinks work: Sonarr can link a finished download into
`/data/media/tv` without copying it or using a second disk. If the two paths
are on different mounts, Sonarr silently falls back to copying every episode —
the import still succeeds, but it doubles disk usage.

Point Sonarr at `http://qbittorrent:8080` as its download client and use
`/data/media/tv` as the root folder, not `/tv`. Downloads live at
`/data/downloads` and imports should use hardlinks, not copy.
