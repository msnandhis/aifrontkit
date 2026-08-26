---
title: File
description: Present file content with safe downloads, MIME identity, variants, sizes, and compound parts.
status: experimental
---

# File

Install File as editable source:

```bash
npx aifrontkit add file
```

The default component accepts a normalized file content part:

```tsx
<File file={part} variant="outline" size="default" />
```

Compose its parts when the product needs different metadata or actions:

```tsx
<File.Root file={part} variant="muted" size="lg">
  <File.Icon />
  <File.Details>
    <File.Name />
    <File.Size />
    <File.Status />
  </File.Details>
  <File.Download />
</File.Root>
```

`outline`, `ghost`, and `muted` control the surface. `sm`, `default`, and `lg`
control density while preserving accessible actions. MIME types select a semantic
icon family, and custom children replace the icon.

File sources are explicit URL, data, or opaque ID values. HTTP(S), blob, and valid
data targets can render native download links. Opaque provider IDs render no link
until the host resolves them, preventing broken or unsafe downloads.
