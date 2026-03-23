# Thumbnail Wizard GitHub Pipeline Handoff

This project now follows the same controlled image deployment model as the other fortress-managed apps.

## Deployment flow

1. Push to `main` in the source repo.
2. GitHub Actions runs `.github/workflows/build-thumbnail-wizard.yml`.
3. The workflow runs tests, builds the container, and smokes:
   - `http://127.0.0.1:18082/`
   - `http://127.0.0.1:18082/asset-manifest.json`
4. The workflow pushes:
   - `ghcr.io/benlagrone/freetols:sha-<commit>`
   - `ghcr.io/benlagrone/freetols:latest`
5. On successful `main` pushes, the build workflow dispatches the fortress deploy workflow.
6. Fortress deploys only the `thumbnail-wizard` service on the Contabo VPS.

## GitHub workflows

- Source build workflow:
  - `.github/workflows/build-thumbnail-wizard.yml`
- Fortress deploy workflow:
  - `fortress-phronesis/.github/workflows/deploy-thumbnail-wizard.yml`

## Runtime contract

- Compose project on server: `thumbnail-wizard`
- Compose file on server: `docker-compose.thumbnail-wizard.yml`
- Service name: `thumbnail-wizard`
- Internal host port: `13082`
- Suggested public endpoint for the current VPS: `http://89.117.151.145:13082/`

Only the deploy source changes from a local on-host build to a pinned GHCR image pull during deployment.

## Secrets

### In the source repo

- `FORTRESS_WORKFLOW_TOKEN`
  - fine-grained token that can dispatch fortress workflows

### In `fortress-phronesis` environment `prod`

The current deploy workflow reuses the existing shared-host Unicornjump secrets:

- `UNICORNJUMP_DEPLOY_HOST`
- `UNICORNJUMP_DEPLOY_USER`
- `UNICORNJUMP_DEPLOY_ROOT`
- `UNICORNJUMP_DEPLOY_SSH_KEY`
- `UNICORNJUMP_DEPLOY_KNOWN_HOSTS`
- `UNICORNJUMP_GHCR_READ_TOKEN`

`FORTRESS_WORKFLOW_TOKEN` in the source repo is still optional for automatic dispatch. If it is missing, build-and-publish succeeds and deployment can be dispatched manually.

## Manual deployment

If needed, run the fortress workflow manually:

- workflow: `Deploy Thumbnail Wizard`
- inputs:
  - `source_sha=<commit sha>`
  - `environment=prod`

## Rollback

Redeploy an earlier green SHA by manually running the fortress workflow with the older `source_sha`.

## Current gate set

- React test suite via `CI=true npm test -- --watchAll=false`
- production web build via `npm run build`
- container smoke against `/` and `/asset-manifest.json`
