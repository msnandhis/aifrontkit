# Adoption measurement contract

`adoption-summary.schema.json` defines an optional local export for aggregated
developer-validation results. It is a research and product-planning contract,
not a runtime telemetry API.

The schema has no participant identifiers, event stream, arbitrary properties
or free-form text. Counts and duration buckets prevent accidental collection of
prompts, messages, files, source code, URLs or device details. Consent is
required in every valid export.

AIFrontKit packages do not collect or transmit this document. A facilitator may
create it after a consented study, inspect it locally and deliberately share it.
Do not add automatic network delivery or customer application instrumentation to
the public packages.

Run `pnpm adoption:validate` to validate the schema and checked-in example.
