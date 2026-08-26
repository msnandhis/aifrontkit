---
title: Versioning
description: Learn how packages, schemas, registry items, and documentation evolve independently.
status: experimental
---

# Versioning

Packages follow semantic versioning. Schema documents and registry manifests also
carry explicit format majors. A registry item has its own immutable version and
declares compatible package and schema ranges.

Documentation source remains single-mainline. Release tags produce immutable
artifacts, allowing `/docs` to represent the current major and `/docs/v1` to
retain a maintained older major without parallel `v1`, `v2`, and `v3.1` source
directories.

Breaking changes require migration guidance and compatibility fixtures. Minor
releases may add optional fields or capabilities but cannot silently change the
meaning of existing events or component contracts.
