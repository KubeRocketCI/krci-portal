# [Component Name] Migration

**Status:** [ ] Not Started | [ ] In Progress | [ ] Complete  
**Estimated:** ~[number] files

---

## Transformation

**Brief description of what changes:**

```tsx
// BEFORE
// MUI code here

// AFTER
// shadcn/ui or Tailwind code here
```

**Common Patterns:**
- Pattern 1 → Replacement 1
- Pattern 2 → Replacement 2

**Critical Rules:**
- ❌ **NO style attributes** - Use Tailwind classes only
- ❌ **NO pixels or rem manually** - Use Tailwind's relative units
- **Spacing calculation:** Tailwind base unit = 4px
  - Convert px values: divide by 4 to get Tailwind number (e.g., 120px = pb-30)
  - Convert pxToRem: divide by 4 to get Tailwind number

---

## Files to Migrate

_TBD: AI should discover and list all files_

```bash
# Discovery commands
grep -r "import.*[Component].*from.*@mui/material" apps/client/src
grep -r "<[Component]" apps/client/src --include="*.tsx"
```

---

## Checklist

- [ ] Discovery complete (all files listed above)
- [ ] All [Component] imports removed
- [ ] All transformations applied
- [ ] Verification: no remaining usage
- [ ] No linter errors
- [ ] Status: Complete

---

## Notes

_Issues encountered:_
