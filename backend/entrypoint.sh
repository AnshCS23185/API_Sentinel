#!/bin/sh
set -e

echo "Running database migrations..."
alembic upgrade head

echo "Bootstrapping admin..."
python -m app.utils.bootstrap_admin

echo "Starting API Sentinel..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
