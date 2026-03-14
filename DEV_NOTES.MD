DEV_NOTES.MD

# Updating the version

Manual flow (if needed):
1. update pacakage.json version number
2. npm run version (updates the manifest and version file)
3. commit repo
4. npm run githubaction (commits the version number tag to the repo and pushes it, which kicks of the github action to prepare the release)

Automated flow:
1. Dependabot opens a dependency update PR.
2. CI runs and auto-merges the PR if it passes.
3. A push to `main` bumps the version, tags a release, and triggers the release workflow.
