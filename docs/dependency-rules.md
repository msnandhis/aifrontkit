# Dependency rules

1. `core` imports only its own modules and platform-neutral dependencies.
2. `react` may import `core`; `core` never imports React.
3. Adapter packages may import `core`; adapters do not import one another or React.
4. `tokens` is standalone and contains no runtime behavior.
5. `testing` may import public package APIs but production packages never import `testing`.
6. Registry source may import public package exports. Packages never import registry source.
7. OSS never imports Pro or platform code, packages, URLs, credentials, or entitlement policy.
8. Deep imports into another package's `src` or `internal` folders are prohibited.

The root boundary check validates package manifests, source import specifiers, forbidden sibling-repository names, package-to-registry/app reach-through, registry-to-app imports, and app-to-app imports. Documentation and lab apps may consume registry-owned examples; registry and publishable packages may never consume app-owned source. Package `exports` define the supported compatibility surface.
