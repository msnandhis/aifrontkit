# Trusted publishing and release provenance

## Current decision

The repository has a manual preview workflow at
`.github/workflows/npm-preview-release.yml`. Its verification job is safe to run
without npm credentials. The publish job only runs from a `release/*` branch when
the operator explicitly enables its `publish` input. It also uses the protected
`npm` GitHub environment.

Publishing remains externally blocked until the package names are owned and every
npm package maps its trusted publisher to the exact GitHub repository, workflow
filename and `npm` environment. Public package manifests declare the canonical
repository, public access and provenance.

No npm token or registry signing private key belongs in repository secrets. npm
publishing should use GitHub OIDC and npm provenance. Registry manifests use the
separate Ed25519 signing flow documented in `docs/cli.md` because they can also be
mirrored independently of npm.

## Exact trusted-publisher mapping

Configure each public npm package with these GitHub Actions values:

- Organization or user: `msnandhis`
- Repository: `openfrontkit`
- Workflow filename: `npm-preview-release.yml`
- Environment: `npm`

Before enabling `publish`, confirm that every public package has the intended npm
owner and the mapping above. The workflow uses Node.js 24 on a GitHub-hosted runner
and grants `id-token: write` only to the publish job. Trusted publishing generates
npm provenance without a long-lived npm token.

Keep release creation manual until tag, workspace ordering and Changesets behavior
have been exercised through the first preview. The local release gate validates
the same package tarballs and a clean consumer before the publish job runs.

## First preview version policy

All public packages remain below `1.0.0` while their contracts are in preview.
Breaking changes before `1.0.0` use a minor Changesets bump rather than a major
bump. The first coordinated preview plan therefore targets `0.2.0-next.0` after
entering `next` prerelease mode. Do this on a dedicated release branch because
Changesets prerelease mode should not block normal work on `main`.

## Verification gate

The release job must run the complete `pnpm release:check` gate. Registry publication
must additionally run `aifrontkit provenance-sign` with an externally supplied key
then run `aifrontkit provenance-verify` with the corresponding public key before
upload. The public key can be checked in. The private key must come from a release
signer or managed key service and must never be written to the workspace.

References: [npm trusted publishers](https://docs.npmjs.com/trusted-publishers/)
and [npm provenance statements](https://docs.npmjs.com/generating-provenance-statements/).
