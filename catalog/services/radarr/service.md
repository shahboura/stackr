---
name: Radarr
slug: radarr
category: media
summary: Movies, fetched, filed
consequence: Watches indexers and imports films into /data/media/movies.
cost: Needs qBittorrent and a root folder before it does anything.
ports: [7878]
ram: 512 MB
deps: [jellyfin]
tags: [movies, automation]
generators: {}
---

# Radarr

Radarr is the movie half of the arr stack. It watches release feeds, hands a
magnet or NZB to the download client, then renames and files the result into
your movie library.

It mounts the whole media root at `/data`, the same mount Sonarr and qBittorrent
use. That is what lets a finished download become a hardlink in
`/data/media/movies` instead of a second copy. Point Radarr at
`http://qbittorrent:8080` as the download client and use `/data/media/movies`
as the root folder.

If Radarr and qBittorrent see different paths for the same file, imports still
work but every one is a copy. The check is one command on the host: both the
download folder and the library must live on the same filesystem.
