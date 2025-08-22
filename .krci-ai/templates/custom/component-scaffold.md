# Component Scaffold: {{component_name}}

## Target Path
{{component_path}}

## Folder Tree
{{folder_tree}}

## Files
### view.tsx
```tsx
{{view_tsx}}
```

### view.test.tsx
```tsx
{{view_test_tsx}}
```

### types.ts
```ts
{{types_ts}}
```

{{#if css_in_js}}
### styles.ts
```ts
{{styles_ts}}
```
{{/if}}

{{#if has_utils}}
### utils/{{utils_file}}
```ts
{{utils_ts}}
```
{{/if}}