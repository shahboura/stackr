---
name: Audiobookshelf
slug: audiobookshelf
category: books
summary: Audiobooks and podcasts, streamed
consequence: Serves your audiobook and podcast folders with progress sync.
cost: Keeps SQLite in a local config folder; a network share will corrupt it.
ports: [13378]
ram: 512 MB
deps: []
tags: [audiobooks, podcasts]
generators: {}
---

# Audiobookshelf

Audiobookshelf serves audiobooks and podcasts to a web UI and mobile apps, keeping
each listener's position in sync across devices. It reads two media folders and
keeps its SQLite database and metadata in two app folders.

`/config` holds the SQLite database and must be on a local volume — not an SMB or
NFS share. `/metadata` holds covers, author images, logs and backups. The
`audiobooks` and `podcasts` mounts are the folders you already have; point them at
your own library layout.

The container runs as your PUID/PGID. The image ignores `PUID` and `PGID`
environment variables, which is why the template sets `user:` instead; the setup
command creates the four host folders and chowns them before the first start.
First start: open `http://<host>:13378`, create the admin user, then add one library
for `/audiobooks` and another for `/podcasts`. No healthcheck is added — upstream
recommends against one unless you run external monitoring.
