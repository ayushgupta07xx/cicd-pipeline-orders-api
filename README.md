# cicd-pipeline-orders-api

A Node/Express service deployed by the
[shared delivery pipeline](https://github.com/ayushgupta07xx/cicd-pipeline-shared-library).

## Why this repository exists

To test whether the pipeline is genuinely repository-agnostic, rather than
merely claimed to be. It is deliberately unlike `sample-app` in every dimension
the library might have assumed:

| | sample-app | orders-api |
|---|---|---|
| Language | Python / Flask | Node / Express |
| Port | 8080 | 3000 |
| Replicas | 2 | 1 |
| Test runner | pytest | node:test |
| Smoke path | `/health` | `/api/orders` |
| Container UID | 10001 | 1000 |

Onboarding required two files — a three-line `Jenkinsfile` and
`deploy-config.yaml` — and **one fix to the library**: the Test stage had
hardcoded a Python image and `pip install`, so it was never language-agnostic.
The test runtime now lives in each repository's config. That defect was only
discoverable by onboarding a genuinely different service, which is exactly what
this repository is for.

## Endpoints

| Path | Purpose |
|---|---|
| `/health` | Liveness probe |
| `/ready` | Readiness probe |
| `/api/orders` | Business endpoint; also the smoke-test target |
| `/api/build-info` | Build and runtime identity |
| `/metrics` | Prometheus exposition, including `app_build_info` |

## Local run

```bash
docker build -t orders-api:local .
docker run --rm -p 3099:3000 -e APP_ENV=local orders-api:local
```

## Tests

```bash
docker run --rm -v "$(pwd)":/w -w /w node:22-slim \
  sh -c 'npm install --no-audit --no-fund && npm test'
```
