#!/usr/bin/env bash

set -euo pipefail

required_vars=(
  APP_NAME
  DEPLOY_ENV
  APP_IMAGE
  IMAGE_TAG
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

compose_file="${PROJECT_ROOT}/compose.yml"
release_env_file="${PROJECT_ROOT}/.release.env"
current_tag_file="${PROJECT_ROOT}/current-image-tag"
previous_tag_file="${PROJECT_ROOT}/previous-image-tag"
container_name="${APP_NAME}-${DEPLOY_ENV}"
app_network="${APP_NETWORK:-canva-schedule-network}"

mkdir -p "${PROJECT_ROOT}"

if [[ ! -f "${APP_RUNTIME_ENV_FILE}" ]]; then
  echo "Runtime env file not found: ${APP_RUNTIME_ENV_FILE}" >&2
  exit 1
fi

if [[ -f "${current_tag_file}" ]]; then
  current_tag="$(<"${current_tag_file}")"
  if [[ -n "${current_tag}" && "${current_tag}" != "${IMAGE_TAG}" ]]; then
    printf '%s' "${current_tag}" > "${previous_tag_file}"
  fi
fi

cat > "${release_env_file}" <<EOF
APP_IMAGE=${APP_IMAGE}
IMAGE_TAG=${IMAGE_TAG}
APP_PORT=${APP_PORT}
APP_ENV=${DEPLOY_ENV}
APP_VERSION=${IMAGE_TAG}
APP_CONTAINER_NAME=${container_name}
APP_RUNTIME_ENV_FILE=${APP_RUNTIME_ENV_FILE}
APP_NETWORK=${app_network}
EOF

printf '%s\n' "${GHCR_TOKEN}" | docker login ghcr.io -u "${GHCR_USERNAME}" --password-stdin

docker compose --env-file "${release_env_file}" -f "${compose_file}" pull

docker run --rm \
  --network "${app_network}" \
  --env-file "${APP_RUNTIME_ENV_FILE}" \
  --env-file "${release_env_file}" \
  "${APP_IMAGE}:${IMAGE_TAG}" \
  npx prisma migrate deploy

docker run --rm \
  --network "${app_network}" \
  --env-file "${APP_RUNTIME_ENV_FILE}" \
  --env-file "${release_env_file}" \
  "${APP_IMAGE}:${IMAGE_TAG}" \
  npx tsx prisma/seed-company-rules.ts

docker run --rm \
  --network "${app_network}" \
  --env-file "${APP_RUNTIME_ENV_FILE}" \
  --env-file "${release_env_file}" \
  "${APP_IMAGE}:${IMAGE_TAG}" \
  npx tsx prisma/seed-canva-templates.ts

docker compose --env-file "${release_env_file}" -f "${compose_file}" up -d --remove-orphans

"${PROJECT_ROOT}/scripts/smoke-check.sh" "${container_name}" 120

printf '%s' "${IMAGE_TAG}" > "${current_tag_file}"

echo "Deployment completed: ${container_name} -> ${IMAGE_TAG}"
