---
name: Immich
slug: immich
category: photos
summary: Photo and video backup with search
consequence: Takes over phone backup and adds face and object search.
cost: Wants 8 GB of RAM and a Postgres volume on local storage, not a share.
ports: [2283]
ram: 8 GB
deps: []
tags: [photos, backups, search]
generators:
  DB_PASSWORD: alnum32
---

# Immich

Immich is the photo and video backup server: the phone app uploads originals, the
web UI indexes them, and machine learning adds face and object search. It runs as
four containers — the server, a machine-learning worker, PostgreSQL and Valkey — so
this entry is larger than the rest of the catalog.

Immich's upload folder (the container's `/data`) lives in
`${DATA_DIR}/appdata/immich/library`; uploads, thumbnails and encoded video all go
there. The database is a Docker volume, `immich-pgdata`, so it sits on the Docker
data root — local storage on every supported host. That is deliberate: Immich's
Postgres image refuses to start on NFS, SMB and FUSE shares, and a database on a
network share corrupts under load. Back it up with your NAS's Docker-volume backup
job, or a throwaway container that tars `/var/lib/postgresql/data`. The database
image is Immich's official Postgres 16 base image, not a stock `postgres` image: it
carries the VectorChord and pgvector extensions the schema expects. Immich also
builds 14–18, but the major version must match the data directory — never change it
in place without a dump and restore. On a NAS with spinning disks, add
`DB_STORAGE_TYPE: HDD` to the database service; leave it out on SSDs.

The server, machine-learning worker and Valkey run as your PUID/PGID. The setup
command in the storage step creates their host folders and hands them to that user
before the first start — Docker would otherwise create missing folders as root and
the containers could not write to them.

First start: open `http://<host>:2283` and create the admin account. Hardware
transcoding is optional and needs `/dev/dri`; add it to `immich-server` only when the
host has an Intel or AMD GPU and the container user can read the device. On hosts
where that user is not in the `video` or `render` group, add `group_add` with the
GIDs from `getent group video render`. Keep the port on your LAN — stackr adds no
authentication or TLS.
