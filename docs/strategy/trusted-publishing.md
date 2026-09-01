# Trusted publishing and release provenance

## Current decision

The repository has a manual preview workflow at
`.github/workflows/npm-preview-release.yml`. Its verification job is safe to run
without npm credentials. The publish job only runs from a `release/*` branch when
the operator explicitly enables its `publish` input. It also uses the protected
`npm` GitHub environment.

The protected `npm` GitHub environment exists and only accepts `release/*`
branches. Each maintained public package maps its trusted publisher to the exact
GitHub repository, workflow filename and `npm` environment. Public package
manifests declare the canonical repository, public access and provenance.

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
owner and the mapping above. The workflow uses Node.js 24 and npm 12.0.2 on a
GitHub-hosted runner and grants `id-token: write` only to the publish job. Trusted
publishing generates npm provenance without a long-lived npm token.

npm cannot attach trusted-publisher settings before a package record exists. The
first coordinated preview therefore used the workflow's explicit `bootstrap`
mode with a short-lived granular `NPM_BOOTSTRAP_TOKEN` stored only in the protected
`npm` environment. The token was restricted to the intended package set. A
follow-up preview with `bootstrap` disabled proved OIDC-only publication for
`aifrontkit`, `@aifrontkit/core`, `@aifrontkit/react` and
`@aifrontkit/adapters` before the bootstrap credential was removed.

npm provenance requires both public packages and a public source repository.
Trusted publishing can authenticate a private repository but npm will not attach
public provenance attestations to that build. Repository visibility is therefore
a release precondition, not a workflow implementation detail.

Keep release creation manual until tag, workspace ordering and Changesets behavior
have been exercised through the first preview. The local release gate validates
the same package tarballs and a clean consumer before the publish job runs.

## First preview version policy

All public packages remain below `1.0.0` while their contracts are in preview.
Breaking changes before `1.0.0` use a minor Changesets bump rather than a major
bump. The first coordinated preview plan therefore targets `0.2.0-next.0` after
entering `next` prerelease mode. Do this on a dedicated release branch because
Changesets prerelease mode should not block normal work on `main`.

Preview publication uses `scripts/publish-preview-packages.mjs` instead of the
generic Changesets publish command. Changesets intentionally sends packages that
have never had a stable release to `latest` even while prerelease mode is active.
The preview publisher passes `--tag next` for every maintained package so future
previews cannot move `latest`. The bootstrap previews remain visible under
`latest` until the first stable release establishes the stable line.

## Verification gate

The release job must run the complete `pnpm release:check` gate. Registry
publication must additionally run `aifrontkit provenance-sign` with an externally
supplied key then run `aifrontkit provenance-verify` with the corresponding public
key before publishing a signed registry mirror. The public key can be checked in.
The private key must come from a release signer or managed key service and must
never be written to the workspace or stored as a general repository secret. npm
package provenance remains independent of this registry-manifest signature.

References: [npm trusted publishers](https://docs.npmjs.com/trusted-publishers/)
and [npm provenance statements](https://docs.npmjs.com/generating-provenance-statements/).
