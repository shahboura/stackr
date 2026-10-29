---
name: Jellyfin
slug: jellyfin
category: media
summary: Movies and TV anywhere
consequence: Adds a web player and a library index over the files on disk.
cost: Transcodes on the CPU unless you pass /dev/dri yourself.
ports: [8096]
ram: 1 GB
deps: []
tags: [media, streaming]
generators: {}
---

# Jellyfin

Jellyfin is the media server the rest of this stack feeds. It indexes the files
on disk, fetches artwork and subtitles, and streams them to phones, TVs and
browsers without an account or a subscription.

The container sees the media library at `/data/media` — the same files Sonarr,
Radarr and qBittorrent write — so library paths match what the downloaders
produce. On first start, open `http://<host>:8096`, create the admin user, then
add two libraries: **Shows** at `/data/media/tv` and **Movies** at
`/data/media/movies`.

Transcoding runs on the CPU by default. If the host has Intel or AMD graphics,
add `/dev/dri` to the `devices:` list yourself; the template leaves it out
because a missing device stops the container from starting. Hardware
transcoding is optional — direct play needs no extra configuration.
