#!/usr/bin/env bash

set -euo pipefail

required_vars=(
  APP_NAME
  DEPLOY_ENV
  APP_IMAGE
  APP_PORT
  APP_RUNTIME_ENV_FILE
  PROJECT_ROOT
  GHCR_USERNAME
  GHCR_TOKEN
)

for var_name in "${required_vars[@]}"; do
  if [[ -z "${!var_name:-}" ]]; then
    echo "Missing required variable: ${var_name}" >&2
    exit 1
  fi
done

previous_tag_file="${PROJECT_ROOT}/previous-image-tag"

if [[ -z "${IMAGE_TAG:-}" ]]; then
  if [[ ! -f "${previous_tag_file}" ]]; then
    echo "No previous image tag recorded for rollback." >&2
    exit 1
  fi

  IMAGE_TAG="$(<"${previous_tag_file}")"
fi

export IMAGE_TAG
"${PROJECT_ROOT}/scripts/deploy.sh"
