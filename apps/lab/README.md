# AIFrontKit Component Lab

Internal quality workbench for reviewing real registry components before release. It is deliberately separate from the public playground: the lab exposes incomplete, failed, narrow, RTL, long-content, reduced-motion, and zoom stress states.

## Run locally

Build the workspace packages once, then start the lab:

```bash
pnpm build
pnpm --filter @aifrontkit/lab dev
```

The default address is `http://127.0.0.1:5174`.

## Review contract

1. Select every fixture and confirm its expected state is legible.
2. Review light, dark, and high-contrast modes.
3. Review 375, 768, 1024, and 1440 viewport presets.
4. Check compact and comfortable density, zero and subtle motion, RTL, 200% zoom, and long-content stress.
5. Complete the visible quality checklist before approving a visual baseline.

The preview imports registry source directly from `registry/components`. It must never recreate a documentation-only version of a component.
