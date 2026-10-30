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

The container sees the media library at `/data/media`, where Sonarr and Radarr
file downloads from `/data/downloads` — so library paths match what the arr apps
produce. On first start, open `http://<host>:8096`, create the admin user, then
add libraries: **Shows** at `/data/media/tv`, **Movies** at `/data/media/movies`,
and **Music** at `/data/media/music`.

Transcoding runs on the CPU by default. If the host has Intel or AMD graphics,
add `/dev/dri` to the `devices:` list yourself; the template leaves it out
because a missing device stops the container from starting. On Synology the
container user must also be able to read the device — add `group_add` with the
host's `video` and `render` GIDs (check with `getent group video render`) or
transcoding fails with permission errors. Hardware transcoding is optional —
direct play needs no extra configuration.

The template uses the LinuxServer image because it accepts PUID, PGID and UMASK
as environment variables, like the rest of the arr stack. The official
`jellyfin/jellyfin` image works too, but it ignores those variables: it needs
`user:` and the same `group_add` entries instead.
