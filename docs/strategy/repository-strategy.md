# Repository strategy

## Why three repositories

The product has three distinct trust and release boundaries:

1. `aifrontkit` is public OSS behavior, contracts, adapters, and community source.
2. `aifrontkit-pro` is private commercial UI source and complete workflows.
3. `aifrontkit-platform` is private business infrastructure and protected delivery.

Pro is separated from the platform because authored customer source should not share a codebase with identity, payments, entitlement policy, or service operations.

## Dependency direction

```text
released @aifrontkit packages ───────► Pro authored source
             │
             └───────────────────────► platform previews/contract validation

Pro immutable bundles ───────────────► platform publishing and download storage
```

OSS never imports Pro or platform code. Pro imports only released public contracts, never platform code. The platform receives reviewed Pro bundles through a publishing artifact, never through customer-runtime imports.

## Runtime independence

Public packages and lawfully downloaded Pro source compile and run without an AIFrontKit account, registry, token, entitlement request, billing service, telemetry heartbeat, or network call. Enforcement occurs at acquisition/update time.

## Release independence

Each repository has its own Git history, tags, CI, and release cadence. Cross-repository contracts use package/schema SemVer ranges, immutable registry item versions, compatibility fixtures, and an explicit supported-version matrix.
