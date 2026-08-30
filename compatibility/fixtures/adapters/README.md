# Adapter compatibility fixtures

These redacted snapshots pin the external protocol shapes consumed by the
structural adapters. Each fixture records the exact upstream package version,
capture date and canonical documentation source.

Updating a fixture is a deliberate compatibility review. Run both adapter test
suites and record any mapping or public type changes in a changeset.

## Automated monitoring

Run `pnpm compatibility:upstream` to compare the fixture metadata with each
package's public npm `latest` dist-tag. The command is read-only and reports
pins as current, behind or ahead. Add `--fail-on-drift` when a stale pin should
produce a failing exit code.

The weekly `upstream compatibility` workflow publishes the same table to the
GitHub Actions job summary and fails when a newer release needs review. It uses
only public npm metadata, has read-only repository permissions and never opens
a pull request or changes a supported version automatically.
