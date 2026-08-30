# Trusted publishing and release provenance

## Current decision

The repository is ready for npm trusted publishing but does not activate a publish
workflow yet. Trusted publishing requires the final GitHub organization,
repository, workflow filename and npm package settings to match exactly. Those
external values are not represented in this checkout. The public package manifests
also do not yet declare repository URLs. Adding an active publish job now would
either fail or risk targeting the wrong package identity.

No npm token or registry signing private key belongs in repository secrets. npm
publishing should use GitHub OIDC and npm provenance. Registry manifests use the
separate Ed25519 signing flow documented in `docs/cli.md` because they can also be
mirrored independently of npm.

## Activation template

After the npm package owners configure trusted publishing for the final repository
and workflow filename, add a release job with these properties:

```yaml
name: release
on:
  workflow_dispatch:
permissions:
  contents: read
  id-token: write
jobs:
  publish:
    runs-on: ubuntu-latest
    environment: npm
    steps:
      - uses: actions/checkout@v6
      - uses: pnpm/action-setup@v4
        with:
          version: 11.19.0
      - uses: actions/setup-node@v6
        with:
          node-version: 24
          registry-url: https://registry.npmjs.org
          package-manager-cache: false
      - run: pnpm install --frozen-lockfile
      - run: pnpm release:check
      # Replace this line with the validated monorepo publisher.
      - run: pnpm changeset publish
        env:
          NPM_CONFIG_PROVENANCE: true
```

Before activation, confirm that every public package has the intended npm owner,
matching `repository.url` metadata and a trusted publisher entry for the exact
workflow filename. npm requires a compatible npm CLI and a GitHub-hosted runner.
Trusted publishing generates npm provenance automatically.

The checked-in Changesets version must not be assumed to handle OIDC authentication
correctly. Validate its publish subprocess against a disposable package or replace
the publish step with direct `npm publish` calls over reviewed package tarballs.
Keep release creation manual until tag, workspace ordering and Changesets behavior
have been exercised in a non-publishing dry run.

## Verification gate

The release job must run the complete `pnpm release:check` gate. Registry publication
must additionally run `aifrontkit provenance-sign` with an externally supplied key
then run `aifrontkit provenance-verify` with the corresponding public key before
upload. The public key can be checked in. The private key must come from a release
signer or managed key service and must never be written to the workspace.

References: [npm trusted publishers](https://docs.npmjs.com/trusted-publishers/)
and [npm provenance statements](https://docs.npmjs.com/generating-provenance-statements/).
