#!/bin/sh
# Prepare the database, then hand off to the container's CMD (gunicorn).
#
# Compose gates this container on the Postgres healthcheck, so the database is
# already accepting connections by the time we get here.
set -e

echo "==> Applying migrations"
python manage.py migrate --noinput

if [ "${SEED_DEMO_DATA:-0}" = "1" ]; then
  echo "==> Seeding demo data (idempotent)"
  python manage.py seed_demo
fi

echo "==> Starting: $*"
exec "$@"
