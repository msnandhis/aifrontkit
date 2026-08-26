# File

`File` is the reference compound component for AIFrontKit. It ships a polished default and exposes every meaningful part for composition.

```tsx
<File file={part} variant="outline" size="default" />

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

Opaque provider IDs are not turned into broken or unsafe links. Resolve them in the host application and pass a URL or custom action.
