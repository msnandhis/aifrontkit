# Contributing

Run `pnpm check` before opening a change. Public API changes require tests, documentation, a Changeset, and an ADR when they alter a repository or dependency boundary.

Keep feature code local until two real consumers justify promotion. Do not add generic catch-all `utils` or `shared` directories. New adapters normalize external input at their boundary and must include captured, redacted compatibility fixtures.

Never add Pro source, platform policy, credentials, generated build output, or runtime license checks to this repository.
