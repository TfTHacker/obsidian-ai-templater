DEV_NOTES.MD

# Updating the version

Manual flow (if needed):
1. update package.json version number
2. npm run version (updates the manifest and version file)
3. commit repo
4. npm run githubaction (commits the version number tag to the repo and pushes it, which kicks of the github action to prepare the release)

Automated flow:
1. Dependabot opens a dependency update PR.
2. CI runs and auto-merges the PR if it passes.
3. A push to `main` bumps the version, tags a release, and triggers the release workflow.

# Development workflow

- `npm run dev` starts esbuild in watch mode (rebuilds main.js on every src change).
- `npm run dev:vault` does the same and additionally deploys main.js, manifest.json and
  styles.css to the test vault configured in the script (env var AIT_OUT_DIR), where the
  hot-reload plugin reloads the plugin automatically.
- main.js is tracked in the repository so the plugin can be installed directly from a
  branch; data.json stays ignored because it contains local vault data and encrypted keys.
