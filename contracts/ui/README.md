# Framework-neutral UI contracts

These contracts define what an AIFrontKit capability means before a framework or styling implementation is chosen. Each contract owns:

- purpose and semantic anatomy;
- observable states;
- controlled variants;
- accessibility requirements;
- implementations that currently satisfy the contract.

Implementation versions must match their contract version. `pnpm contracts:validate` enforces the link and fails when an implementation path or manifest drifts.

Do not add React props, CSS class names, Angular decorators, or custom-element tag names here. Those belong to implementation manifests and API documentation.
