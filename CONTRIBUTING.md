# Contributing

## Development Setup

```bash
npm install
make build
make lint
```

See the [README](README.md#development) for the full list of Make targets.

## Releasing

Releases are published to npm automatically by GitHub Actions when a version tag is pushed. The tag triggers the `publish.yml` workflow which builds the package and publishes it with npm provenance.

### First-time setup (one-time)

Before you can publish the first release, configure npm authentication for the GitHub Actions workflow:

**Option A — OIDC Trusted Publishing (recommended)**

1. Create the package on npmjs.com (run `npm publish --dry-run` locally to validate, or simply push the first tag and let CI create it).
2. On npmjs.com, go to your package settings → **Publishing access** → **Trusted Publishers** → **Add a publisher**.
3. Fill in:
   - Repository owner: `jsolana`
   - Repository name: `n8n-nodes-backstage`
   - Workflow name: `publish.yml`
   - Environment: _(leave blank)_
4. No secrets need to be configured in the GitHub repository.

**Option B — npm Automation Token (fallback)**

1. On npmjs.com: **Access Tokens** → **Generate New Token** → **Granular Access Token**.
   Scope it to this package with "Read and write" publish permission.
2. In GitHub: **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.
   Name it `NPM_TOKEN` and paste the token value.

### Prerequisites

- `@n8n/node-cli` >= 0.23.0 (required for provenance support). Verify with:
  ```bash
  npm list @n8n/node-cli
  ```
- All CI checks passing on `main` (lint + build).
- `CHANGELOG.md` updated with the new version's changes.

### Creating a release

Run the release target locally:

```bash
make release
```

This will:

1. Run lint and build to ensure the package is healthy.
2. Prompt you to choose a version bump (patch / minor / major).
3. Update `package.json` version.
4. Commit the version bump.
5. Create a git tag matching the new version (e.g. `0.1.0`).
6. Push the commit and tag to origin.

Once the tag reaches GitHub, the `publish.yml` workflow runs and publishes the package to npm with a provenance attestation.

### Tag convention

Tags use **bare semver** without a `v` prefix: `0.1.0`, `1.2.3`, `2.0.0-rc.1`.

### Verifying the publish

After the workflow completes:

```bash
make info
```

You can also check the provenance on npmjs.com under the package's **Provenance** tab.
