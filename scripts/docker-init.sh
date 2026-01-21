#!/bin/sh
set -e

echo "Waiting for PostgreSQL..."
until pg_isready -h postgres -U s_agent; do
  sleep 1
done

echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Starting application..."
exec "$@"