---
title: File
description: Present file content with safe downloads, MIME identity, variants, sizes, and compound parts.
status: experimental
---

# File

File is the reference compound source component. It provides a polished default
while keeping icon, metadata, status, and actions independently composable. It
does not upload, fetch, authorize, or resolve provider file IDs.

## Preview

The playground renders the real source component. Change the file name, MIME
type, byte size, lifecycle, variant, visual size, source type, and compound
slots. Generated code uses the exact metadata visible in the preview.

## Installation

```bash
pnpm add @aifrontkit/core
npx aifrontkit add file
```

```tsx
import { File } from "@/components/aifrontkit/file";
```

## Usage

```tsx
<File
  variant="outline"
  size="default"
  file={{
    type: "file",
    name: "report.pdf",
    mediaType: "application/pdf",
    size: 248000,
    source: { kind: "url", url: reportUrl }
  }}
/>
```

Compose the parts when the product needs different metadata or actions:

```tsx
<File.Root file={part} variant="muted" size="lg">
  <File.Icon />
  <File.Details>
    <File.Name />
    <File.Size />
    <File.Status />
  </File.Details>
  <File.Download unavailable="Download unavailable" />
</File.Root>
```

## Anatomy

| Part | Responsibility |
| --- | --- |
| `File` | Complete default composition. |
| `File.Root` | Named article and compound context. |
| `File.Icon` | MIME-aware decorative icon or custom children. |
| `File.Details` | Bounded metadata group. |
| `File.Name` | Truncated name with a full title. |
| `File.Size` | Human-readable optional byte size. |
| `File.Status` | Loading or failed meaning. |
| `File.Download` | Native link for a safe browser-resolvable target. |

Compound parts must be descendants of `File.Root`.

## Variants and states

`variant` accepts `outline` (default), `ghost`, or `muted`. `size` accepts `sm`,
`default`, or `lg`. These axes affect presentation only.

`file.status` accepts `loading`, `ready`, or `failed`; omitted status is ready.
Root exposes `data-status` and `aria-busy` while loading. Status renders no text
for ready files unless custom children are supplied.

MIME classification returns `image`, `document`, `data`, `text`, `audio`,
`video`, `archive`, or `file`. Pass children to `File.Icon` to override the
built-in icon without changing file semantics.

## API reference

### File and File.Root

| Prop | Type | Default | Purpose |
| --- | --- | --- | --- |
| `file` | `FileContentPart` | Required | Normalized file name, type, size, status, and source. |
| `variant` | `"outline" \| "ghost" \| "muted"` | `"outline"` | Surface treatment. |
| `size` | `"sm" \| "default" \| "lg"` | `"default"` | Density and type scale. |
| `icon` | `ReactNode` | MIME icon | Default File-only icon override. |
| `actions` | `ReactNode` | `File.Download` | Default File-only action override. |
| `children` | `ReactNode` | Required on Root | Compound composition. |

Root also accepts native `article` props. Its default accessible name is
`File: {file.name}`.

### Compound parts

`Icon`, `Details`, `Name`, `Size`, and `Status` accept the corresponding native
element props. Children replace their derived content. `File.Download` accepts
native anchor props plus `unavailable?: ReactNode`; it renders nothing when no
safe target exists unless `unavailable` is supplied.

Stable selectors are `data-slot="file"`, `file-icon`, `file-details`, `file-name`,
`file-size`, `file-status`, `file-download`, and `file-download-unavailable`.

## Download safety

`source.kind` may be `url`, `data`, or `id`. HTTP, HTTPS, blob, and valid `data:`
values can become links. Opaque IDs and unsupported URL protocols do not. Resolve
an ID in host code, then pass a browser-safe URL or supply a custom action.

## Styling and motion

The CSS Module uses semantic surface, border, text, status, and focus roles.
Long names truncate while their full text remains available through `title`.
Only restrained surface and action transitions animate; reduced motion removes
their duration.

## Accessibility

File is a named article. Its icon is decorative, download has an explicit name,
and failed state uses an alert. Do not make the entire card clickable when it also
contains actions. Custom actions need visible focus and descriptive names.

## Responsive behavior

The details column can shrink without forcing page overflow. Preserve the action
target, truncate the visible name, and keep status text adjacent to the file it
describes. The component does not change variants automatically by viewport.

## Errors and recovery

Failed preparation displays `File unavailable`; loading displays `Preparing file`.
File does not retry. Supply a host action through `actions` or compound children
when retry, preview, authorization, or ID resolution is available.

## Testing

Cover every MIME family, absent size, long and localized names, loading and failed
states, unsafe and opaque sources, custom icons/actions, keyboard focus, narrow
widths, dark mode, and reduced motion.

## Compatibility

Registry version `0.1.0`; React `>=18.3 <20`; UI contract schema major `1`;
`@aifrontkit/core >=0.1.0 <1`. No platform runtime is required.
