# Reduce GeoJSON

Web app to reduce the size of GeoJSON files.

## How This Tool Reduces GeoJSON

This tool reduces GeoJSON file sizes through two main techniques:

### 1. Coordinate Precision Truncation

Coordinates in GeoJSON files often have excessive decimal places (e.g., `1.123456789`). For most web mapping applications, 6 decimal places (~0.1 meters accuracy) is more than sufficient. This tool truncates coordinates to your specified precision, significantly reducing file size.

### 2. Property Filtering

GeoJSON features often contain many properties that aren't needed for display. You can select only the properties you need, removing unnecessary data.

## Developing

1. Install dependencies: `pnpm install`
2. Run dev server: `pnpm dev`
3. Run tests: `pnpm test`
4. Run checks: `pnpm check && pnpm lint`

## Building

To create a production version:

```bash
pnpm build
```

## Testing

```bash
# Run tests once
pnpm test

# Watch mode
pnpm test:watch
```
