# Deployment Runbook (GHCR + Fortress + Contabo)

This app now follows the same pinned-image deployment pattern used by fortress-managed apps.

## Runtime Contract

- Source repo: `benlagrone/freetols` (update if the final GitHub repo name differs)
- Image repo: `ghcr.io/benlagrone/freetols`
- Fortress service: `thumbnail-wizard`
- Fortress compose file: `docker-compose.thumbnail-wizard.yml`
- Fortress compose project: `thumbnail-wizard`
- Local health URLs on host:
  - `http://127.0.0.1:13082/`
  - `http://127.0.0.1:13082/asset-manifest.json`
- Suggested public URL for the current VPS:
  - `http://89.117.151.145:13082/`

## Deployment Flow

1. Push to `main` in the source repo.
2. GitHub Actions runs `build-thumbnail-wizard.yml`.
3. The workflow runs tests, builds the production container, and smokes the app.
4. The workflow pushes:
   - `ghcr.io/benlagrone/freetols:sha-<commit>`
   - `ghcr.io/benlagrone/freetols:latest`
5. The source repo dispatches the fortress deploy workflow.
6. Fortress SSHes to the Contabo VPS, logs into GHCR, pulls the pinned SHA image, restarts `thumbnail-wizard`, and verifies health.

## One-Time GitHub Setup

### Source repo secrets

Set in the GitHub repo that hosts this app:

- `FORTRESS_WORKFLOW_TOKEN`
  - fine-grained token allowed to dispatch workflows in `benlagrone/fortress-phronesis`

### Fortress repo environment `prod` secrets

The current deploy workflow reuses the existing shared-host Unicornjump secrets in `benlagrone/fortress-phronesis`, environment `prod`:

- `UNICORNJUMP_DEPLOY_HOST`
- `UNICORNJUMP_DEPLOY_USER`
- `UNICORNJUMP_DEPLOY_ROOT`
- `UNICORNJUMP_DEPLOY_SSH_KEY`
- `UNICORNJUMP_DEPLOY_KNOWN_HOSTS`
- `UNICORNJUMP_GHCR_READ_TOKEN`

That keeps this deploy working on the same Contabo VPS without requiring a second copy of the same SSH credentials.

If you later want strict per-app secret names, switch the workflow to `THUMBNAIL_WIZARD_*` and add those secrets then.

## One-Time Server Bootstrap

Run on the Contabo VPS:

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl git
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker "$USER"
newgrp docker
docker --version
docker compose version
```

If you want direct access at `http://89.117.151.145:13082`, open the port:

```bash
sudo apt-get install -y ufw
sudo ufw allow OpenSSH
sudo ufw allow 13082/tcp
sudo ufw --force enable
sudo ufw status
```

No app repo clone is required on the server. The fortress deploy workflow clones or updates `fortress-phronesis` automatically at `THUMBNAIL_WIZARD_DEPLOY_ROOT`.

## First Deployment

1. Ensure the source repo is pushed to GitHub and Actions is enabled.
2. Ensure all source and fortress secrets are configured.
3. Push to `main`.
4. Watch these workflows:
   - source repo: `Build Thumbnail Wizard Image`
   - fortress repo: `Deploy Thumbnail Wizard`

## Updates

Deploy updates by pushing a new commit to `main`.

## Rollback

In `fortress-phronesis`, run the `Deploy Thumbnail Wizard` workflow manually with an older green SHA.

That redeploys the earlier pinned image without rebuilding on the server.

## Verification

On the server:

```bash
cd /root/workspace/fortress-phronesis
docker compose -p thumbnail-wizard -f docker-compose.thumbnail-wizard.yml ps
curl -fsSI http://127.0.0.1:13082/
curl -fsSI http://127.0.0.1:13082/asset-manifest.json
```

If using the public bind:

```bash
curl -fsSI http://89.117.151.145:13082/
curl -fsSI http://89.117.151.145:13082/asset-manifest.json
```

## Notes

- This replaces the old `git pull && docker compose build` on-host flow.
- The VPS now consumes immutable GHCR images instead of building from the app source repo locally.
- The live deploy workflow currently reuses `UNICORNJUMP_*` fortress secrets on the shared Contabo host.
- If the GitHub repo name or GHCR package name changes, update the image references in:
  - `.github/workflows/build-thumbnail-wizard.yml`
  - `GITHUB_PIPELINE_HANDOFF.md`
  - `fortress-phronesis/deploy/apps/thumbnail-wizard.yaml`
  - `fortress-phronesis/deploy/environments/prod.yaml`
  - `fortress-phronesis/.github/workflows/deploy-thumbnail-wizard.yml`
