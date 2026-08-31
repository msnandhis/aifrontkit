# Adapter compatibility fixtures

These redacted snapshots pin the external protocol shapes consumed by the
structural adapters. Each fixture records the exact upstream package version,
capture date and canonical documentation source. The checked-in matrix covers:

| Adapter family | Reviewed releases | Policy |
| --- | --- | --- |
| AI SDK | `6.0.272`, `7.0.85` | Maintained v6 dist-tag and current v7 dist-tag |
| AG-UI core | `0.0.50`, `0.0.59` | Minimum supported release and current release |
| LangGraph | `1.0.0`, `1.4.13` | Minimum supported 1.x release and current release |

Minimum pins remain fixed until the support policy deliberately moves. Current
and maintained-major pins track their declared npm dist-tags. This prevents an
older support floor from being incorrectly reported as release drift.

The LangGraph checkpoint-history fixture intentionally contains representative
private StateSnapshot fields. Its adapter tests prove that `values`, `writes`,
tasks and provider persistence handles never cross the public projection.

Updating a fixture is a deliberate compatibility review. Run both adapter test
suites and record any mapping or public type changes in a changeset.

## Automated monitoring

Run `pnpm compatibility:upstream` to compare tracked fixture metadata with the
declared public npm dist-tag. The command is read-only and reports pins as
current, behind, ahead or deliberately pinned. Add `--fail-on-drift` when a
stale tracked pin should produce a failing exit code.

Run `pnpm compatibility:verify` to install every exact upstream version in a
temporary isolated project then compile and execute its provider contract
probe. The probes exercise AI SDK UI message chunks and writers, AG-UI typed
events and schemas and LangGraph stream modes and StateSnapshot boundaries.
An export-presence check alone does not satisfy the compatibility gate. Use
`pnpm compatibility:verify --id ai-sdk-v7` for one matrix entry. Temporary
projects are always removed and upstream packages never become runtime or peer
dependencies of AIFrontKit packages.

The weekly `upstream compatibility` workflow publishes the same table to the
GitHub Actions job summary, exercises adapter projections and verifies every
published release in an isolated matrix job. It uses only public npm metadata,
has read-only repository permissions and never opens a pull request or changes
a supported version automatically.
