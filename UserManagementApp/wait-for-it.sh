#!/usr/bin/env bash
# Use this script to test if a given TCP host/port are available

set -e

TIMEOUT=15
DELAY=1

if [ "$#" -lt 2 ]; then
  echo "Usage: $0 host port"
  exit 1
fi

HOST=$1
PORT=$2
shift 2

for ((i=0; i<TIMEOUT; i++)); do
  if nc -z "$HOST" "$PORT"; then
    echo "$HOST:$PORT is available"
    exec "$@"
    exit 0
  fi
  echo "Waiting for $HOST:$PORT..."
  sleep "$DELAY"
done

echo "$HOST:$PORT is not available after $TIMEOUT seconds"
exit 1
