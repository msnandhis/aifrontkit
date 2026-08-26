---
title: Registry manifest
description: Learn how installable source declares files, dependencies, compatibility, and provenance.
status: experimental
---

# Registry manifest

A registry manifest identifies an immutable item version and declares its type,
files, public package dependencies, registry dependencies, compatibility ranges,
license category, fixtures, and documentation metadata.

Packages provide behavior; registry items provide editable visual source. The
installer validates paths and dependency compatibility before presenting an
operation plan. Existing customer changes are never silently overwritten.

Public registry operations work anonymously. Protected Pro artifacts are acquired
through the platform, but downloaded source has no runtime license check or
platform network dependency.
