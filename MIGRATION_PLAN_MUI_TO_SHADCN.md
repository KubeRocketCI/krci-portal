# Migration Plan: MUI to shadcn/ui

> **Note:** This document uses interactive checkboxes. In VS Code, install the "Markdown Checkboxes" extension by Matt Bierner to toggle them interactively. Otherwise, you can edit the checkboxes manually by changing `- [ ]` to `- [x]` to mark tasks complete.

## Executive Summary

This document outlines the migration strategy for transitioning from Material-UI (MUI) to shadcn/ui in the krci-portal application.

**Scope:** 66+ components, 350+ import statements across the codebase  
**Estimated Effort:** 3-5 weeks (staged rollout)  
**Risk Level:** Medium-High (requires careful testing)

### Overall Progress

**Phase 1: Foundation**  
[ ] Not Started | [x] In Progress | [ ] Complete (90% - Layout components complete ✅, theme pending)

**Phase 2: Form Components**  
[ ] Not Started | [ ] In Progress | [ ] Complete

**Phase 3: Interactive Components**  
[ ] Not Started | [ ] In Progress | [ ] Complete

**Phase 4: Data Display**  
[ ] Not Started | [ ] In Progress | [ ] Complete

**Phase 5: Cleanup & Polish**  
[ ] Not Started | [ ] In Progress | [ ] Complete

**Total Completion:** 18% (1/5 phases 90% complete)

### 🎉 Recent Achievements

**December 2024 - Typography Migration Completed!**
- ✅ **100+ files migrated** from MUI Typography to semantic HTML + Tailwind
- ✅ **All color mappings corrected** - fixed critical `color="primary"` → `text-foreground` mapping
- ✅ **Zero inline styles** - all converted to Tailwind classes
- ✅ **All imports cleaned** - no unused Typography imports remain
- ✅ **Linter errors resolved** - all TypeScript/ESLint issues fixed

This completes the **Layout Components** phase, bringing us to 90% completion of Phase 1.

#### Component-Level Progress

**Layout Components**  
- [x] Box → `<div>` + Tailwind (82/82 files complete) ✅  
- [x] Stack → `<div>` + Flex (192+ files complete, including commented code) ✅  
- [x] Grid → `<div>` + CSS Grid (110/110 files complete) ✅  
- [x] Typography → Semantic HTML + Tailwind (100+ files complete) ✅

**Form Components**  
- [ ] TextField → Input + Label  
- [ ] Select → shadcn Select  
- [ ] Checkbox → shadcn Checkbox  
- [ ] Switch → shadcn Switch  
- [ ] Autocomplete → Custom + Popover + Command

**Button Components**  
- [ ] Button → shadcn Button  
- [ ] IconButton → Button variants  
- [ ] ToggleButton → Custom component

**Dialog & Overlay**  
- [ ] Dialog → shadcn Dialog  
- [ ] Tooltip → shadcn Tooltip

**Navigation**  
- [ ] Tabs → shadcn Tabs  
- [ ] Accordion → shadcn Accordion  
- [ ] Breadcrumbs → Custom component  
- [ ] Stepper → Custom component

**Data Display**  
- [ ] Table → shadcn Table  
- [ ] Card → shadcn Card  
- [ ] Alert → shadcn Alert  
- [ ] Chip → Badge or custom

---

## Migration Strategy

### Approach
- **Phased Migration**: Migrate component-by-component, not all at once
- **Feature Parity**: Ensure all functionality is maintained
- **Incremental Testing**: Test each component category before proceeding
- **Parallel Development**: Keep MUI and shadcn/ui coexisting during transition

### Key Considerations
1. **Theme Migration**: MUI's `useTheme` and styling system need replacement
2. **Custom Styling**: Replace MUI's `styled()` with Tailwind CSS utilities
3. **Simple Layout Components**: MUI `Box`, `Stack`, `Grid`, and `Typography` become plain HTML elements with Tailwind classes - no wrapper components needed
4. **Form State**: Ensure React Hook Form integration works with shadcn components
5. **Accessibility**: shadcn/ui uses Radix UI primitives (better a11y than MUI)
6. **Bundle Size**: Expect 20-30% reduction in bundle size (removing MUI + using plain HTML elements)

---

## Component Mapping: MUI → shadcn/ui

### ✅ Direct Equivalents (Easy Migration)

| MUI Component | shadcn/ui Component | Installation | Notes |
|--------------|---------------------|--------------|-------|
| **Button** | `Button` | `npx shadcn-ui@latest add button` | Similar API, uses variants |
| **Dialog** | `Dialog` | `npx shadcn-ui@latest add dialog` | Direct replacement |
| **DialogTitle** | `DialogTitle` | Part of `dialog` | Part of Dialog component |
| **DialogContent** | `DialogContent` | Part of `dialog` | Part of Dialog component |
| **Alert** | `Alert` | `npx shadcn-ui@latest add alert` | Similar structure |
| **Tooltip** | `Tooltip` | `npx shadcn-ui@latest add tooltip` | Radix UI based |
| **Checkbox** | `Checkbox` | `npx shadcn-ui@latest add checkbox` | Direct replacement |
| **Switch** | `Switch` | `npx shadcn-ui@latest add switch` | Radix UI Switch |
| **Select** | `Select` | `npx shadcn-ui@latest add select` | Composable approach |
| **Tabs** | `Tabs` | `npx shadcn-ui@latest add tabs` | API compatibility |
| **Accordion** | `Accordion` | `npx shadcn-ui@latest add accordion` | Direct replacement |
| **Table** | `Table` | `npx shadcn-ui@latest add table` | Headless, more flexible |
| **Card** | `Card` | `npx shadcn-ui@latest add card` | Similar structure |

### 🔄 Needs Adaptation (Medium Complexity)

| MUI Component | shadcn/ui Solution | Approach |
|--------------|-------------------|----------|
| **Box** | Plain HTML `<div>` + Tailwind | Direct replacement, no wrapper needed |
| **Stack** | Plain HTML `<div>` + Tailwind flex | Use `flex flex-col` or `flex flex-row` classes |
| **Grid** | Plain HTML `<div>` + Tailwind Grid | Use CSS Grid utilities like `grid grid-cols-*` |
| **TextField** | `Input` + custom components | Shadcn has `Input`, may need wrapper |
| **Autocomplete** | Custom implementation + `Popover` | Build using shadcn `Popover` + `Command` |
| **Typography** | Semantic HTML + Tailwind classes | Use `h1`, `h2`, `p`, etc. with Tailwind typography classes |
| **IconButton** | `Button` with `variant="ghost"` | Use shadcn Button with icon |
| **Chip** | `Badge` or custom component | Adapt Badge or create custom Chip |
| **Divider** | HTML `<hr>` or border utilities | Use CSS border classes |
| **Paper** | `Card` with elevated styles | Use Card component |
| **Breadcrumbs** | Custom component | Build with Link + Separator |
| **Stepper** | Custom component | Build using shadcn primitives |
| **FormControl** | Wrapper components | Create form wrapper components |
| **FormHelperText** | Custom component | Build error/helper text component |
| **FormControlLabel** | `Label` component | Use shadcn Label |
| **InputLabel** | `Label` component | Use shadcn Label |
| **InputAdornment** | Custom wrapper | Build with relative positioning |
| **CircularProgress** | Custom Spinner | Use shadcn's loading states or create spinner |
| **ToggleButton** | Custom component | Build with Button + state management |
| **ToggleButtonGroup** | Custom component | Build with ButtonGroup pattern |

### ⚠️ No Direct Equivalent (Complex Migration)

| MUI Component | Recommended Solution | Complexity |
|--------------|---------------------|------------|
| **Popper** | Floating UI library | High - requires external dependency |
| **ClickAwayListener** | Custom hook | Medium - create custom hook |
| **styled()** | Tailwind CSS classes | Low - refactor to utility classes |
| **useTheme** | CSS variables + Tailwind | Medium - theme system migration |
| **createTheme** | Tailwind config | Medium - migrate to Tailwind config |
| **alpha()** | Tailwind opacity utilities | Low - use opacity modifiers |
| **darken()** | CSS custom properties | Medium - define in theme |

### 📊 Data Display Components

| MUI Component | shadcn/ui Solution |
|--------------|-------------------|
| **List** | Custom component + `Card` |
| **ListItemButton** | `Button` variant |
| **ListItemIcon** | Wrap icon in component |
| **ListItemText** | Typography classes |
| **MenuList** | `DropdownMenu` |
| **MenuItem** | `DropdownMenuItem` |
| **TablePagination** | Custom component using Button |

---

## How to Use This Plan

### Individual Component Tasks
For detailed, step-by-step migration of individual components, see the task files in `MIGRATION_TASKS/`:
- Each component has its own task file (e.g., `BOX_MIGRATION_TASK.md`)
- Task files contain discovery commands, file lists, and progress tracking
- They're designed as standalone agent tasks that an AI can execute
- See [MIGRATION_TASKS/README.md](./MIGRATION_TASKS/README.md) for details

### For AI Agents
1. Start with Phase 1 (Foundation)
2. Open the relevant component task file from `MIGRATION_TASKS/`
3. Follow the instructions in the task file
4. Update checkboxes as you progress
5. Document issues in the task file's Notes section
6. Mark tasks complete in both the task file and this main plan

### Progress Tracking
- Update checkboxes in this main plan (overview)
- Update checkboxes in individual task files (detailed progress)
- Both trackers stay in sync for project visibility

---

## Migration Phases

### Phase 1: Foundation (Week 1) ⭐ Priority
**Goal:** Set up shadcn/ui infrastructure  
**Progress:** [ ] Not Started | [x] In Progress | [ ] Complete

- [ ] **Install shadcn/ui**
   ```bash
   npx shadcn-ui@latest init
   ```

- [ ] **Theme Migration**
   - [ ] Configure Tailwind CSS with design tokens
   - [ ] Set up CSS variables for theming
   - [ ] Create theme configuration file
   - [ ] Migrate color palette to CSS variables

- [ ] **Core Layout Components**
   - [x] Replace `<Box>` with plain `<div>` + Tailwind classes → [Task File](./MIGRATION_TASKS/BOX_MIGRATION_TASK.md) ✅ Complete (82/82 files)
   - [x] Replace `<Stack>` with plain `<div>` + flex classes → [Task File](./MIGRATION_TASKS/STACK_MIGRATION_TASK.md) ✅ Complete (192+ files, including commented code)
   - [x] Replace `<Grid>` with plain `<div>` + CSS Grid classes → [Task File](./MIGRATION_TASKS/GRID_MIGRATION_TASK.md) ✅ Complete (110/110 files)
   - [ ] Replace `<Typography>` with semantic HTML + Tailwind typography classes

**Components:** Box, Stack, Grid  
**Files Affected:** 384+ files total (Box: 82, Stack: 192+, Grid: 110) ✅  
**Key Change:** These become plain HTML elements, not components  
**Progress:** 3/4 layout components complete (Box ✅, Stack ✅, Grid ✅, Typography ⏳)

---

### Phase 2: Form Components (Week 1-2) ⭐ Priority
**Goal:** Migrate all form-related components  
**Progress:** [ ] Not Started | [ ] In Progress | [ ] Complete

- [ ] **Basic Inputs**
   - [ ] Install: `input`, `label`, `textarea`
   - [ ] Replace `TextField` with `Input` + `Label`
   - [ ] Replace `Select` with shadcn `Select`
   - [ ] Replace `Checkbox` with shadcn `Checkbox`
   - [ ] Replace `Switch` with shadcn `Switch`

- [ ] **Advanced Inputs**
   - [ ] Build Autocomplete component using `Popover` + `Command`
   - [ ] Create FormControl wrapper
   - [ ] Add FormHelperText component
   - [ ] Test with React Hook Form

**Components:** TextField, Select, Checkbox, Switch, Autocomplete  
**Files Affected:** ~80 files

---

### Phase 3: Interactive Components (Week 2-3)
**Goal:** Migrate buttons, dialogs, and navigation  
**Progress:** [ ] Not Started | [ ] In Progress | [ ] Complete

- [ ] **Buttons & CTAs**
   - [ ] Install: `button`
   - [ ] Replace `Button` component
   - [ ] Replace `IconButton` with Button variants
   - [ ] Build ToggleButton components
   - [ ] Build ButtonGroup patterns

- [ ] **Dialogs & Overlays**
   - [ ] Install: `dialog`, `tooltip`
   - [ ] Replace `Dialog` components
   - [ ] Replace `Tooltip` components
   - [ ] Test accessibility (keyboard navigation)

- [ ] **Navigation**
   - [ ] Install: `tabs`, `accordion`
   - [ ] Replace `Tabs` components
   - [ ] Replace `Accordion` components
   - [ ] Build `Breadcrumbs` component
   - [ ] Build `Stepper` component (if needed)

**Components:** Button, IconButton, Dialog, Tooltip, Tabs, Accordion  
**Files Affected:** ~100 files

---

### Phase 4: Data Display (Week 3-4)
**Goal:** Migrate tables, lists, and display components  
**Progress:** [ ] Not Started | [ ] In Progress | [ ] Complete

- [ ] **Tables**
   - [ ] Install: `table`
   - [ ] Replace `Table` components
   - [ ] Replace `TableRow`, `TableCell`, etc.
   - [ ] Build pagination component
   - [ ] Style table variants

- [ ] **Lists & Cards**
   - [ ] Install: `card`
   - [ ] Replace `Card` components
   - [ ] Replace `Paper` with `Card`
   - [ ] Build List components

- [ ] **Feedback Components**
   - [ ] Install: `alert`
   - [ ] Replace `Alert` components
   - [ ] Build Chip/Badge component
   - [ ] Build Spinner/Loading component

**Components:** Table, Card, Alert, Chip, CircularProgress  
**Files Affected:** ~50 files

---

### Phase 5: Cleanup & Polish (Week 4-5)
**Goal:** Remove MUI, finalize theme, test  
**Progress:** [ ] Not Started | [ ] In Progress | [ ] Complete

- [ ] **Remove MUI Dependencies**
   - [ ] Remove `@mui/material` from package.json
   - [ ] Remove theme providers
   - [ ] Remove unused imports

- [ ] **Custom Components**
   - [ ] Finalize custom components (Autocomplete, Stepper, etc.)
   - [ ] Add TypeScript types
   - [ ] Add Storybook stories (if applicable)

- [ ] **Testing & QA**
   - [ ] Visual regression testing
   - [ ] Accessibility audit
   - [ ] Cross-browser testing
   - [ ] Performance testing

- [ ] **Documentation**
   - [ ] Update component documentation
   - [ ] Create migration guide for future developers
   - [ ] Document design system tokens

---

## Detailed Component Migration Guide

### 1. Box → Plain HTML + Tailwind

**Before (MUI):**
```tsx
<Box sx={{ display: 'flex', padding: 2, gap: 2 }}>
  <Box sx={{ flex: 1 }}>Content</Box>
</Box>
```

**After (Plain HTML + Tailwind):**
```tsx
<div className="flex p-4 gap-4">
  <div className="flex-1">Content</div>
</div>
```

**Key Points:**
- No wrapper component needed - just use plain `<div>`
- All styling handled by Tailwind utility classes
- Simplifies component tree (one less layer)
- Better for bundle size (no extra JS)

---

### 2. Stack → Plain HTML + Tailwind

**Before (MUI):**
```tsx
<Stack direction="row" spacing={2}>
  <Button>Click</Button>
  <Button>Cancel</Button>
</Stack>
```

**After (Plain HTML + Tailwind):**
```tsx
<div className="flex flex-row gap-2">
  <Button>Click</Button>
  <Button>Cancel</Button>
</div>
```

**Common Patterns:**
- Vertical stack: `flex flex-col`
- Horizontal stack: `flex flex-row` (or just `flex`)
- Gap spacing: `gap-2`, `gap-4`, etc.
- Alignment: `items-center`, `justify-between`, etc.

---

### 3. Grid → Plain HTML + Tailwind CSS Grid

**Before (MUI):**
```tsx
<Grid container spacing={2}>
  <Grid item xs={12} md={6}>Item 1</Grid>
  <Grid item xs={12} md={6}>Item 2</Grid>
</Grid>
```

**After (Plain HTML + Tailwind):**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

**Grid Patterns:**
- 2 columns on mobile, 3 on desktop: `grid-cols-2 md:grid-cols-3`
- Auto-fit columns: `grid-cols-[repeat(auto-fit,minmax(250px,1fr))]`
- Gap spacing: `gap-4`, `gap-6`, etc.

---

### 4. TextField → Input + Label

**Before (MUI):**
```tsx
<TextField
  label="Username"
  error={!!errors.username}
  helperText={errors.username?.message}
/>
```

**After (shadcn/ui):**
```tsx
<div className="space-y-2">
  <Label htmlFor="username">Username</Label>
  <Input
    id="username"
    error={!!errors.username}
    {...field}
  />
  {errors.username && (
    <p className="text-sm text-destructive">
      {errors.username.message}
    </p>
  )}
</div>
```

---

### 5. Button → shadcn Button

**Before (MUI):**
```tsx
<Button variant="contained" color="primary">
  Submit
</Button>
```

**After (shadcn/ui):**
```tsx
<Button variant="default">
  Submit
</Button>
```

**Variants Mapping:**
- `contained` → `default`
- `outlined` → `outline`
- `text` → `ghost`

---

### 6. Dialog → shadcn Dialog

**Before (MUI):**
```tsx
<Dialog open={open} onClose={handleClose}>
  <DialogTitle>Title</DialogTitle>
  <DialogContent>
    Content
  </DialogContent>
  <DialogActions>
    <Button onClick={handleClose}>Cancel</Button>
  </DialogActions>
</Dialog>
```

**After (shadcn/ui):**
```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
    <div>Content</div>
    <DialogFooter>
      <Button onClick={() => setOpen(false)}>Cancel</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

### 7. Typography → Semantic HTML + Tailwind ✅ COMPLETED

**Status:** 100% Complete (100+ files migrated)  
**Key Achievements:**
- ✅ All Typography components converted to semantic HTML
- ✅ Corrected color mapping (`color="primary"` → `text-foreground`)
- ✅ Eliminated all inline styles in favor of Tailwind classes
- ✅ All imports cleaned up

**Before (MUI):**
```tsx
<Typography variant="h1">Heading</Typography>
<Typography variant="body1">Body text</Typography>
<Typography variant="caption">Small text</Typography>
```

**After (Semantic HTML + Tailwind):**
```tsx
<h1 className="text-4xl font-bold">Heading</h1>
<p className="text-base">Body text</p>
<p className="text-sm text-muted-foreground">Small text</p>
```

**Common Typography Classes:**
- Headings: `text-4xl font-bold`, `text-3xl font-semibold`, etc.
- Body: `text-base`, `text-lg`, `text-sm`
- Muted text: `text-muted-foreground`
- Font weights: `font-normal`, `font-medium`, `font-semibold`, `font-bold`
- Line heights: `leading-tight`, `leading-normal`, `leading-relaxed`

---

### 8. Theme Migration

**Before (MUI):**
```tsx
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
  },
})

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* app */}
    </ThemeProvider>
  )
}
```

**After (shadcn/ui + Tailwind):**
```tsx
// tailwind.config.ts
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: 'hsl(var(--primary))',
        // ... more colors
      },
    },
  },
}
```

```tsx
// globals.css
@layer base {
  :root {
    --primary: 221 83% 53%;
    /* ... more CSS variables */
  }
}
```

---

## Code Transformation Tools

### 1. Codemods
Create automated scripts to help with migration:
```bash
# Example codemod for Box
npx jscodeshift -t transform-box.tsx src/
```

### 2. Find & Replace Patterns
Use VS Code's search and replace with regex:
- `import.*from.*@mui/material` → Replace with shadcn imports
- MUI `sx` props → Tailwind classes

### 3. Component Aliasing
Create temporary aliases during migration:
```tsx
// lib/ui/box.tsx (temporary bridge)
import { cn } from '@/lib/utils'
export const Box = ({ children, className, ...props }) => (
  <div className={cn(className)} {...props}>{children}</div>
)
```

---

## Testing Strategy

### 1. Unit Tests
- Test each component in isolation
- Test prop handling and behavior
- Test accessibility attributes

### 2. Integration Tests
- Test component interactions
- Test form flows
- Test navigation flows

### 3. Visual Regression Testing
- Use tools like Percy or Chromatic
- Compare before/after screenshots
- Catch styling differences

### 4. Accessibility Testing
- Use axe-core or similar tools
- Test keyboard navigation
- Test screen reader compatibility

---

## Risk Mitigation

### Risks & Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| Breaking changes in forms | High | Medium | Create comprehensive test suite |
| Theme inconsistencies | Medium | Medium | Use CSS variables, systematic review |
| Bundle size increase | Low | Low | Monitor with bundle analyzer |
| Timeline delays | Medium | Medium | Phased approach, MVP first |
| Missing functionality | High | Low | Audit before migration, build custom |

---

## Success Criteria

- [ ] All MUI components replaced with shadcn/ui equivalents
- [ ] No visual regressions (verified with automated testing)
- [ ] Bundle size reduced by 20%+
- [ ] All accessibility tests passing
- [ ] 100% TypeScript coverage maintained
- [ ] All form validations working
- [ ] Documentation updated
- [ ] Team trained on new components

---

## Timeline

```
Week 1: Foundation + Form Components (Phase 1-2)
Week 2: Interactive Components (Phase 3)
Week 3: Data Display (Phase 4)
Week 4: Cleanup + Testing (Phase 5)
Week 5: Final QA + Documentation
```

---

## Resources

- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [Radix UI Primitives](https://www.radix-ui.com)
- [Component Examples](https://ui.shadcn.com/examples)

---

## Next Steps

1. Review this migration plan with the team
2. Set up shadcn/ui project (`npx shadcn-ui@latest init`)
3. Create feature branch: `feat/mui-to-shadcn-migration`
4. Start with Phase 1: Foundation components
5. Set up regular check-ins for migration progress

