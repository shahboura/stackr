---
name: Dozzle
slug: dozzle
category: tools
summary: All container logs
consequence: Streams every container log into a single web page.
cost: Docker socket access is root on the host; keep it on the LAN.
ports: [9999]
ram: 64 MB
deps: []
tags: [logs, diagnostics]
generators: {}
---

# Dozzle

Dozzle streams the logs of every container on the host into one page. When an
app refuses to start or an import fails silently, this is where the error is,
without `docker logs` and a terminal.

It reads `/var/run/docker.sock`. That socket is root-equivalent on the host:
the container can start, stop and delete other containers, and the `:ro` mount
flag only makes the socket file read-only on disk — API calls still go through.
Dozzle's destructive actions and shell are off by default, but anyone who can
reach port 9999 can read every container's log. Keep it on your LAN; do not
port-forward it. There is no login in this template.

`DOZZLE_NO_ANALYTICS=true` is set so the page does not phone home. The image runs
as root because it needs the socket; do not change that to PUID/PGID.
