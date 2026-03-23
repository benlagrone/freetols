# Thumbnail Wizard

Thumbnail Wizard is a React + Fabric.js thumbnail editor.

## Local Development

```bash
npm ci
npm start
```

## Production Container (Local)

Build and run with Docker:

```bash
docker compose build
docker compose up -d
```

Open:

- `http://localhost:8080`

If `8080` is already in use:

```bash
APP_PORT=18080 docker compose up -d
```

Stop:

```bash
docker compose down
```

## GHCR + Fortress Deployment

Production deployment now follows the fortress-controlled GHCR flow:

1. Push to `main`.
2. GitHub Actions builds and smokes the container.
3. The workflow publishes:
   - `ghcr.io/benlagrone/freetols:sha-<commit>`
   - `ghcr.io/benlagrone/freetols:latest`
4. The source workflow dispatches the fortress deploy workflow.
5. Fortress SSHes to the Contabo VPS, pulls the pinned SHA image, and restarts only the `thumbnail-wizard` service.

Primary references:

- `/.github/workflows/build-thumbnail-wizard.yml`
- `/GITHUB_PIPELINE_HANDOFF.md`
- `/DEPLOYMENT_RUNBOOK.md`

If the eventual GitHub repo or GHCR package name is not `benlagrone/freetols`, update those references before first push.

## What Was Added for Deployment

- Multi-stage production image: `Dockerfile`
- Runtime Nginx config (SPA + caching): `docker/nginx.conf`
- Deployment stack: `docker-compose.yml`
- Container ignore file: `.dockerignore`
- GHCR / fortress deployment runbook: `DEPLOYMENT_RUNBOOK.md`
- GitHub Actions build pipeline: `.github/workflows/build-thumbnail-wizard.yml`
