#!/usr/bin/env bash
# Serves the repo at http://localhost:8000 and opens one game's host and game
# windows. Usage: scripts/serve.sh <game-id>
set -euo pipefail

game="${1:?usage: serve.sh <game-id>}"

if [[ ! -d "games/$game" ]]; then
  echo "No game named '$game' in games/." >&2
  exit 1
fi

if lsof -nP -iTCP:8000 -sTCP:LISTEN >/dev/null; then
  echo "Port 8000 is already in use." >&2
  exit 1
fi

python3 -m http.server 8000 &
server=$!
trap 'kill "$server" 2>/dev/null' EXIT

until curl -s -o /dev/null http://localhost:8000; do
  kill -0 "$server" 2>/dev/null || exit 1
  sleep 0.2
done

# Both pages must run in the same browser to share state, and each needs its
# own window so the game view can move to the projector.
open -na "Google Chrome" --args --new-window "http://localhost:8000/games/$game/admin.html"
open -na "Google Chrome" --args --new-window "http://localhost:8000/games/$game/game.html"

wait "$server"
