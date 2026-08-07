#!/bin/sh
# One image, two very different processes:
#
#   serve  — the private control panel + publish scheduler
#   web    — the public anonymous studio
#
# docker-compose picks between them with `command:`, which arrives here as
# positional arguments and wins. But some platforms build straight from the
# Dockerfile and give you no way to set a command at all — Coolify's Dockerfile
# build pack stores a "start command" and then ignores it, which silently ran
# the control panel on the public studio's port. TABLIGH_CMD is the escape
# hatch for those: set it as an ordinary environment variable.
set -e

if [ "$#" -gt 0 ]; then
  exec node dist/cli.js "$@"
fi

exec node dist/cli.js "${TABLIGH_CMD:-serve}"
