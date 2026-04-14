#!/usr/bin/env bash

set -euo pipefail

container_name="${1:-}"
timeout_seconds="${2:-120}"

if [[ -z "${container_name}" ]]; then
  echo "Usage: smoke-check.sh <container-name> [timeout-seconds]" >&2
  exit 1
fi

elapsed=0
poll_interval=5

while (( elapsed < timeout_seconds )); do
  status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}starting{{end}}' "${container_name}" 2>/dev/null || true)"

  if [[ "${status}" == "healthy" ]]; then
    echo "Container is healthy: ${container_name}"
    exit 0
  fi

  if [[ "${status}" == "unhealthy" ]]; then
    echo "Container is unhealthy: ${container_name}" >&2
    docker logs --tail 200 "${container_name}" >&2 || true
    exit 1
  fi

  sleep "${poll_interval}"
  elapsed=$((elapsed + poll_interval))
done

echo "Timed out waiting for container health: ${container_name}" >&2
docker logs --tail 200 "${container_name}" >&2 || true
exit 1
