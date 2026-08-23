#!/bin/sh
set -e

ADMIN_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/postgres"

until pg_isready -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" >/dev/null 2>&1; do
    echo "[entrypoint] waiting for postgres at ${POSTGRES_HOST}:${POSTGRES_PORT}"
    sleep 2
done

psql -v ON_ERROR_STOP=1 "$ADMIN_URL" -f - <<SQL
SELECT format('CREATE DATABASE %I', 'user')
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'user')\gexec
SQL

./node_modules/.bin/prisma migrate deploy

exec node --import @swc-node/register/esm-register --enable-source-maps dist/src/main.js
