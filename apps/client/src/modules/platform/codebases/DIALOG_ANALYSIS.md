# ManageCodebase Dialog & Wizard Analysis Summary

## Current Dialog Structure Summary

### Component Flow
- **Entry Point**: `ManageCodebaseDialog` - Determines mode (CREATE/EDIT) based on `codebase` prop
- **Create Mode**: Complex multi-step wizard with tabs and stepper
- **Edit Mode**: Simple single-form with limited editable fields

### Create Flow Structure
1. **Two Main Tabs**:
   - **Selection Tab**: Component type and strategy selection (Steps 0-1)
   - **Configuration Tab**: Form fields in two steps (Steps 2-3)

2. **Steps**:
   - Step 0: Select Component Type (Application/Autotest)
   - Step 1: Select Strategy (Create/Clone/Import)
   - Step 2: Codebase Info (basic fields: Git, Name, Description, Lang, Framework, etc.)
   - Step 3: Advanced Settings (Default Branch, Versioning, Jira, Codemie)

3. **Form Fields Location**: `components/fields/` (25+ field components)

4. **Form Actions**: 
   - Location: `components/Create/components/Inner/components/FormActions/`
   - Handles: Step navigation, validation, codebase creation, auth secrets

### Edit Flow Structure
1. **Single Form**: No tabs or steps
2. **Limited Fields**: Only Jira-related fields (CommitMessagePattern, JiraServer, TicketNamePattern, AdvancedJiraMapping, CodemieIntegration)
3. **Form Actions**: 
   - Location: `components/Edit/components/FormActions/`
   - Handles: Form reset, codebase patching

### Names Configuration
- **Current**: `CODEBASE_FORM_NAMES` with `path` (deprecated) and `formPart` (needed for tab validation)
- **Issue**: Contains all fields for both Create and Edit
- **Need**: Separate Create vs Edit names, remove `path`, keep `formPart`

### Key Dependencies
- FormContextProvider (React Hook Form)
- StepperContextProvider (step management)
- CurrentDialogContextProvider (dialog state)
- useCodebaseCRUD (API calls)

---

## Mocked Wizard Structure Summary

### Key Features
1. **6 Steps** (vs 4 in current dialog):
   - Step 1: Creation Method (Template/Scratch/Import)
   - Step 2: Template Selection (conditional, only if Template method)
   - Step 3: Basic Info (Name, Display Name, Description)
   - Step 4: Git Setup (Git Server, Org, Repo, Default Branch)
   - Step 5: Build Config (Language, Framework, Build Tool, CI/CD options)
   - Step 6: Review (summary cards, final confirmation)

2. **UI/UX Improvements**:
   - Visual progress stepper with icons
   - Step validation (`canProceed()`)
   - Conditional step skipping
   - Card-based layout
   - Save as Draft option
   - Review step before submission

3. **Template Support**: 
   - "Create from Template" option (exists in Marketplace but not in main dialog)
   - Template search and filtering
   - Template cards with features

### Differences from Current
- More granular steps (6 vs 4)
- Template selection integrated
- Better visual feedback
- Review step
- More modern UI patterns

---

## Migration Strategy Summary

### Target Structure
```
pages/
├── create/
│   ├── route.ts (PATH_CODEBASE_CREATE)
│   ├── page.tsx
│   └── components/
│       ├── CreateWizard/ (6 steps)
│       └── FormActions/
└── edit/
    ├── route.ts (PATH_CODEBASE_EDIT)
    ├── page.tsx
    └── components/
        ├── EditForm/
        └── FormActions/

components/
└── form-fields/ (reusable fields organized by category)
    ├── BasicInfo/
    ├── GitConfig/
    ├── BuildConfig/
    └── Advanced/
```

### Key Changes
1. **Routes**: Separate routes for create (`/components/create`) and edit (`/components/$namespace/$name/edit`)
2. **Form Fields**: Move to `components/form-fields/` organized by category
3. **Names**: Split into `CREATE_FORM_NAMES` and `EDIT_FORM_NAMES`, remove `path`, keep `formPart`
4. **Navigation**: Replace dialog opens with route navigation
5. **Template Integration**: Add template selection step in Create wizard

### Migration Phases
1. **Preparation**: Create form-fields structure, refactor names
2. **Create Page**: Implement 6-step wizard
3. **Edit Page**: Implement single-form page
4. **Integration**: Update all navigation points
5. **Cleanup**: Remove old dialog code

---

## Questions for Clarification

1. Should template selection integrate existing `CreateCodebaseFromTemplateDialog` logic?
2. Should we implement "Save as Draft" feature?
3. Should we maintain step skipping (e.g., skip template step if not using template)?
4. Are there other fields that should be editable in Edit form?
5. Should we keep dialog temporarily for backward compatibility?
6. Should validation be per-formPart or all fields on step navigation?
7. Should Edit route use path params or query params?

