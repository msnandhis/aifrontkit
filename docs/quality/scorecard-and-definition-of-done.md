# Scorecard and definition of done

## Release rule

The scorecard makes polish review consistent; it does not convert judgment into arithmetic. A component can pass 90 points and still fail release because of a blocker. Stable release requires:

- at least 90 out of 100;
- no blocking failure;
- every applicable scenario in `component.json` represented by a deterministic fixture;
- automated checks passing;
- completed human visual, keyboard, responsive, and theme review;
- a reviewer who did not author the final visual pass when a second maintainer is available.

Experimental work may be incomplete but must be labeled and isolated as described in the workflow policy. Preview and stable releases both meet the score, blocker, contract, fixture, and evidence requirements above. Preview signals that the public API may still change with release notes; it never signals lower visual, interaction, or accessibility quality. Stable additionally requires demonstrated compatibility, migration discipline, and the published support commitment. Neither maturity can bypass this contract.

## Blocking failures

Any of these blocks preview-to-stable promotion regardless of score:

- critical or serious accessibility violation;
- inaccessible primary action, broken keyboard path, focus loss, or focus trap;
- content loss, duplicate consequential action, or unusable failure/recovery state;
- page-level horizontal overflow at a required viewport or 200% zoom;
- unreadable text or control contrast in a declared theme;
- required state, fixture, compatibility range, or migration guidance missing;
- live service, AIFrontKit platform, Pro, or runtime license dependency in official Community component source;
- an unreviewed visual-regression change;
- a flaky, random, clock-dependent, or network-dependent release fixture;
- a release claim that conflicts with the component manifest or public behavior contract.

## 100-point scorecard

Score each line using evidence from the required fixtures and viewports. Award full points only when the result is consistent; award half points for a localized, non-blocking weakness with an owner and follow-up. Do not award points for planned work.

| Area | Points | Full-credit evidence |
| --- | ---: | --- |
| Visual hierarchy | 15 | Primary content and action are immediately clear; chrome is quiet; alignment, grouping, and surface use remain coherent across states. |
| Typography and spacing | 10 | Type is readable, line length is controlled, spacing follows the token rhythm, and long/localized content does not damage hierarchy. |
| Interaction quality | 15 | Applicable hover, focus, pressed, disabled, loading, success, error, cancel, retry, and recovery behavior is understandable and stable. |
| State completeness | 15 | Every manifest state is implemented and every required scenario is deterministic, credible, and documented. |
| Accessibility | 20 | Semantics, naming, keyboard, focus, announcements, contrast, zoom/reflow, reduced motion, and touch targets pass automated and manual review. |
| Responsive behavior | 10 | Required viewports, intermediate widths, RTL, long content, safe areas, and software-keyboard risks are handled without obstruction or page overflow. |
| Theme and customization | 5 | Light, dark, and high contrast preserve hierarchy; declared variants and token overrides remain coherent. |
| Motion and performance | 5 | Motion is purposeful and reduced-motion safe; streamed or async updates avoid visible jank, layout shift, and unnecessary rendering. |
| Documentation and source quality | 5 | Public API, purpose, anatomy, usage, customization, accessibility, compatibility, and upgrade implications are accurate and readable. |
| **Total** | **100** | **Stable threshold: 90, with no blockers.** |

## Review record

The pull request or release record includes:

```text
Component and registry version:
Maturity before / after:
Manifest changed: yes / no
Fixture and baseline identifiers:
Automated checks:
Required viewport/theme matrix reviewed:
Keyboard and focus review:
Screen-reader smoke review:
Reduced-motion review:
Score by area and total:
Blocking findings:
Accepted non-blocking findings, owner, and due version:
Author:
Reviewer:
```

Visual baselines are evidence, not authority. A pixel-perfect match can still have poor hierarchy, misleading copy, or unusable interaction. Baseline approval records why a change is expected.

## Definition of done

### Contract

- `component.json` is present, valid, and matches the registry item version and implementation.
- Purpose and non-goals are clear enough to reject unrelated features.
- Anatomy, slots, states, variants, themes, viewports, accessibility, motion, fixtures, and compatibility are declared.
- Public API changes and source-owned upgrade impact are documented.

### Implementation

- Behavior remains in the correct primitive/runtime layer and presentation remains source-owned.
- Default output is polished without consumer CSS.
- Optional slots collapse cleanly and variants preserve shared semantics.
- Every declared state has understandable visual, semantic, and recovery behavior.
- No prohibited dependency, raw color, arbitrary z-index, hover-only path, or unbounded animation is introduced.

### Verification

- Type checking, linting, unit/interaction tests, registry validation, and compatibility fixtures pass.
- Deterministic visual fixtures cover the required state, theme, viewport, density, and motion matrix using risk-based pairwise coverage.
- Automated accessibility scans pass with no serious or critical findings.
- Manual keyboard, focus, screen-reader smoke, 200% zoom, high-contrast, touch, reduced-motion, RTL, and content-stress checks pass where applicable.
- The reviewer checks exact widths and at least one in-between width to catch breakpoint-only design.

### Documentation and release

- Installation, minimal use, public props, variants, slots, customization, accessibility, and compatibility are accurate.
- Examples render the released source and work without a live service.
- Visual changes include intentional baseline approval; breaking changes include migration guidance.
- Maturity and version metadata are updated together across `component.json`, `registry.json`, documentation, and release notes.
- The scorecard reaches the release threshold and the review record is attached.

Done means the component is safe to recommend, not merely ready for another team to finish.
