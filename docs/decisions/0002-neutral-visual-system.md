# ADR 0002: Polished neutral visual system

Status: accepted, 2026-08-26.

## Decision

Official registry components ship with a finished, brand-neutral design. They share semantic color, typography, space, density, shape, elevation, and motion contracts. Products customize those contracts globally, within a workspace, per component recipe, or by editing installed source.

Variants describe real product contexts such as minimal, dense, workspace, and mobile. They do not duplicate behavior or imitate named products. Motion uses the semantic levels `none`, `subtle`, and `expressive`, with bounded recipes and an authoritative reduced-motion override.

## Why

Unstyled primitives make every adopter repeat baseline product-design work. Strongly branded defaults are difficult to integrate. Arbitrary variant and animation props create an untestable combination space. A neutral, token-driven system supplies immediate quality while preserving ownership and controlled flexibility.

## Consequences

- Community includes accessible production defaults rather than a deliberately incomplete design.
- Pro differentiates through deeper compositions, workflows, and premium design—not basic accessibility or fixes.
- Registry manifests describe variant, token, state, responsive, and motion support.
- Visual review covers pairwise theme, density, variant, motion, and viewport combinations plus high-risk explicit cases.
- Component source uses semantic `--aifk-*` variables; raw palette values stay in theme definitions.
