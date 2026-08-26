# Component quality

AIFrontKit treats polish as a release contract, not a final styling pass. These documents turn the visual system into requirements that can be reviewed, tested, and repeated across Community and Pro components.

- [Component quality standard](./component-quality-standard.md) defines the product, visual, interaction, accessibility, responsive, motion, and source-quality bar.
- [Scorecard and definition of done](./scorecard-and-definition-of-done.md) defines blocking failures, the 100-point review, and the evidence needed to publish.
- [Workflow and review policy](./workflow-and-review-policy.md) defines how a component moves from a problem statement to a stable release.

The design tokens and visual direction remain authoritative in [`design-system/openfrontkit/MASTER.md`](../../design-system/openfrontkit/MASTER.md). A component's `component.json` records the component-specific contract and required quality evidence. The registry `registry.json` remains the distribution manifest. Neither file replaces the other.

The four booleans under `component.json#quality` declare mandatory release gates; they are not self-awarded proof that a review occurred. `quality.evidence` must resolve each declaration to checked-in browser, accessibility, interaction, and documentation evidence that explicitly covers the component. Fixtures must be renderable TSX modules using the real registry source, not scenario-name catalogs. Validation fails closed when a contract, evidence file, renderable fixture, required gate, or version parity is missing.

When a rule conflicts, use this order:

1. Accessibility, security, and data-integrity requirements.
2. The public primitive or runtime behavior contract.
3. The AIFrontKit design system.
4. The component quality manifest.
5. A fixture- or page-specific visual recipe.

Lower levels may refine higher levels but cannot weaken them.
