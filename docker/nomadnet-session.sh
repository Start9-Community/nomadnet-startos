#!/bin/sh
# Keeps the Nomad Network text UI running inside a detached tmux session so the
# client and node stay up with no browser attached; the web terminal (ttyd)
# attaches to this session. Quitting the UI from the browser restarts it.
set -eu

SESSION=nomadnet

# Website folders the config points at but StartOS could not mount (NextExplorer
# missing, or the folder deleted there). An empty folder serves an empty site;
# a missing one would crash nomadnet at startup. Mounted ones already exist.
for dir in ${SITE_DIRS:-}; do
  mkdir -p "$dir"
done

tmux new-session -d -s "$SESSION" -x 160 -y 48 \
  'while true; do nomadnet; echo; echo "Nomad Network exited. Restarting in 3 seconds..."; sleep 3; done'

shutdown() {
  trap '' TERM INT HUP
  # Ask nomadnet to exit cleanly so LXMF flushes its stores, then drop tmux.
  pkill -INT -f '/usr/local/bin/nomadnet$' 2>/dev/null || true
  i=0
  while pgrep -f '/usr/local/bin/nomadnet$' >/dev/null 2>&1 && [ "$i" -lt 20 ]; do
    sleep 0.5
    i=$((i + 1))
  done
  tmux kill-server 2>/dev/null || true
  exit 0
}
trap shutdown TERM INT HUP

while tmux has-session -t "$SESSION" 2>/dev/null; do
  sleep 2 &
  wait $! || true
done
echo "tmux session ended unexpectedly" >&2
exit 1
