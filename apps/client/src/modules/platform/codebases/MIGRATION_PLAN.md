# ManageCodebase Dialog to Pages Migration Plan

## Executive Summary

This document outlines the plan to migrate the `ManageCodebaseDialog` from a dialog-based component to separate page-based routes for Create and Edit operations. The migration will improve code organization, enable better routing, and align with the new wizard-based UI/UX pattern.

---

## 1. Current Dialog Structure Analysis

### 1.1 Component Hierarchy

```
ManageCodebaseDialog (index.tsx)
├── Dialog (shadcn/ui)
│   ├── DialogContent
│   │   ├── CurrentDialogContextProvider
│   │   │   ├── Create Component (if mode === CREATE)
│   │   │   │   ├── FormContextProvider
│   │   │   │   ├── StepperContextProvider
│   │   │   │   │   ├── CreateContent
│   │   │   │   │   │   ├── DialogHeader
│   │   │   │   │   │   │   ├── SelectionHeader (Tab: SELECTION)
│   │   │   │   │   │   │   ├── ConfigurationDialogHeader (Tab: CONFIGURATION)
│   │   │   │   │   │   │   └── UnifiedStepper
│   │   │   │   │   │   ├── DialogBody
│   │   │   │   │   │   │   ├── Selection (Tab: SELECTION)
│   │   │   │   │   │   │   │   ├── Component Type Selection (Step 0)
│   │   │   │   │   │   │   │   └── Strategy Selection (Step 1)
│   │   │   │   │   │   │   └── Configuration (Tab: CONFIGURATION)
│   │   │   │   │   │   │       ├── Info Form (Step 2: CODEBASE_INFO)
│   │   │   │   │   │   │       └── Advanced Form (Step 3: ADVANCED_SETTINGS)
│   │   │   │   │   │   └── DialogFooter
│   │   │   │   │   │       ├── SelectionFooter (Tab: SELECTION)
│   │   │   │   │   │       └── ConfigurationFooter/FormActions (Tab: CONFIGURATION)
│   │   │   │   │   └── Edit Component (if mode === EDIT)
│   │   │   │   │       ├── FormContextProvider
│   │   │   │   │       ├── DialogHeader
│   │   │   │   │       │   └── CustomDialogHeader
│   │   │   │   │       ├── DialogBody
│   │   │   │   │       │   └── Form (single form, no tabs/steps)
│   │   │   │   │       └── DialogFooter
│   │   │   │   │           └── FormActions
```

### 1.2 Key Features

#### Create Flow:

- **Two Main Tabs**: Selection and Configuration
- **Selection Tab Steps**:
  - Step 0: Select Component Type (Application/Autotest)
  - Step 1: Select Strategy (Create/Clone/Import)
- **Configuration Tab Steps**:
  - Step 2: Codebase Info (basic fields)
  - Step 3: Advanced Settings (versioning, Jira, etc.)
- **Stepper Navigation**: Unified stepper showing all 4 steps
- **Form Validation**: Per-step validation before proceeding
- **Form Actions**: Create codebase with optional auth secrets

#### Edit Flow:

- **Single Form**: No tabs or steps
- **Limited Fields**: Only editable fields (Jira integration, commit message pattern, etc.)
- **Form Actions**: Patch codebase with undo changes option

### 1.3 Form Fields Organization

**Location**: `components/fields/`

**Fields Used in Create**:

- Selection: Type, Strategy
- Info Tab: GitServer, Owner, Repository, RepositoryUrl, GitUrlPath, Name, Description, Lang, Framework, BuildTool, TestReportFramework, Private, EmptyProject, CodebaseAuth, RepositoryLogin, RepositoryPasswordOrApiToken, CiTool
- Advanced Tab: DefaultBranch, DeploymentScript, CodebaseVersioning, CommitMessagePattern, JiraServerIntegration, JiraServer, TicketNamePattern, AdvancedJiraMapping, CodemieIntegration

**Fields Used in Edit**:

- CommitMessagePattern
- JiraServerIntegration
- JiraServer (conditional)
- TicketNamePattern (conditional)
- AdvancedJiraMapping (conditional)
- CodemieIntegration

### 1.4 Names Configuration

**Current Structure** (`names.ts`):

- `NAMES`: Constant string values for field names
- `CODEBASE_FORM_NAMES`: Object mapping names to:
  - `name`: Field name
  - `path`: Array path in resource object (e.g., `["spec", "type"]`)
  - `formPart`: Tab/step grouping (e.g., `configurationSteps.codebaseInfo`)
  - `notUsedInFormData`: Flag for UI-only fields

**Issues**:

- `path` is no longer needed (as mentioned by user)
- `formPart` is needed for tab validation
- Need to separate Create vs Edit names

### 1.5 Form Actions

**Create FormActions** (`components/Create/components/Inner/components/FormActions/index.tsx`):

- Handles step navigation (next/prev)
- Validates current step before proceeding
- Creates codebase via `triggerCreateCodebase`
- Handles codebase auth secrets
- Resets form on close

**Edit FormActions** (`components/Edit/components/FormActions/index.tsx`):

- Handles form reset (undo changes)
- Patches codebase via `triggerPatchCodebase`
- Only updates allowed fields (Jira-related)
- Closes dialog on success

### 1.6 Dependencies

- **Providers**: FormContextProvider, StepperContextProvider, CurrentDialogContextProvider
- **Hooks**: useDefaultValues, useFormContext, useStepperContext, useCurrentDialog
- **API**: useCodebaseCRUD (create, patch, secret management)
- **Utils**: createCodebaseDraftObject, editCodebaseObject

---

## 2. Mocked Wizard Structure Analysis

### 2.1 Key Features

1. **Creation Method Selection** (Step 1):
   - Create from Template
   - Start from Scratch
   - Import from Git

2. **Template Selection** (Step 2, conditional):
   - Search and filter templates
   - Category filtering
   - Template cards with features

3. **Basic Info** (Step 3):
   - Project Name
   - Display Name
   - Description

4. **Git Setup** (Step 4):
   - Git Server selection
   - Organization/Group
   - Repository Name
   - Default Branch
   - Repository preview

5. **Build Config** (Step 5):
   - Language
   - Framework
   - Build Tool
   - CI/CD Pipeline Template
   - Auto-trigger toggle
   - Quality gates toggle

6. **Review** (Step 6):
   - Summary cards for each section
   - Final confirmation

### 2.2 UI/UX Patterns

- **Progress Stepper**: Visual progress indicator with icons
- **Step Validation**: `canProceed()` function validates current step
- **Conditional Steps**: Template step skipped if not using template method
- **Navigation**: Back/Continue buttons, Save as Draft option
- **Card-based Layout**: Each step in a Card component
- **Visual Feedback**: Active/completed/skipped step states

### 2.3 Differences from Current Dialog

1. **Template Support**: New "Create from Template" option (exists in Marketplace but not in main dialog)
2. **More Steps**: 6 steps vs 4 in current dialog
3. **Better Progress Indication**: Visual stepper with icons
4. **Review Step**: Final review before creation
5. **Save as Draft**: Option to save progress

---

## 3. Migration Plan

### 3.1 High-Level Architecture

```
apps/client/src/modules/platform/codebases/
├── pages/
│   ├── create/
│   │   ├── page.tsx (route component)
│   │   ├── route.ts (route definition)
│   │   ├── route.lazy.ts (lazy loading)
│   │   ├── view.tsx (page layout)
│   │   ├── components/
│   │   │   ├── CreateWizard/
│   │   │   │   ├── index.tsx (main wizard component)
│   │   │   │   ├── components/
│   │   │   │   │   ├── MethodSelection/ (Step 1)
│   │   │   │   │   ├── TemplateSelection/ (Step 2, conditional)
│   │   │   │   │   ├── BasicInfo/ (Step 3)
│   │   │   │   │   ├── GitSetup/ (Step 4)
│   │   │   │   │   ├── BuildConfig/ (Step 5)
│   │   │   │   │   ├── Review/ (Step 6)
│   │   │   │   │   ├── WizardStepper/ (progress indicator)
│   │   │   │   │   └── WizardNavigation/ (back/continue buttons)
│   │   │   │   └── hooks/
│   │   │   │       ├── useWizardState.ts
│   │   │   │       ├── useStepValidation.ts
│   │   │   │       └── useDefaultValues.ts
│   │   │   └── FormActions/
│   │   │       └── index.tsx (onSubmit logic)
│   │   └── hooks/
│   │       └── useDefaultValues.ts
│   └── edit/
│       ├── page.tsx
│       ├── route.ts
│       ├── route.lazy.ts
│       ├── view.tsx
│       ├── components/
│       │   ├── EditForm/
│       │   │   ├── index.tsx
│       │   │   └── components/
│       │   │       ├── FormHeader/
│       │   │       └── FormContent/
│       │   └── FormActions/
│       │       └── index.tsx (onSubmit logic)
│       └── hooks/
│           └── useDefaultValues.ts
├── components/
│   └── form-fields/ (reusable form fields)
│       ├── index.ts (exports)
│       ├── BasicInfo/
│       │   ├── Name/
│       │   ├── Description/
│       │   └── ...
│       ├── GitConfig/
│       │   ├── GitServer/
│       │   ├── Owner/
│       │   ├── Repository/
│       │   └── ...
│       ├── BuildConfig/
│       │   ├── Lang/
│       │   ├── Framework/
│       │   ├── BuildTool/
│       │   └── ...
│       └── Advanced/
│           ├── DefaultBranch/
│           ├── Versioning/
│           ├── JiraIntegration/
│           └── ...
└── dialogs/
    └── ManageCodebase/ (DEPRECATED - to be removed after migration)
```

### 3.2 Route Definitions

**Create Route**:

```typescript
// pages/create/route.ts
export const PATH_CODEBASE_CREATE = "components/create" as const;
export const PATH_CODEBASE_CREATE_FULL = "/c/$clusterName/components/create" as const;

export const routeCodebaseCreate = createRoute({
  getParentRoute: () => routeCluster,
  path: PATH_CODEBASE_CREATE,
  head: () => ({
    meta: [{ title: "Create Component | KRCI" }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
```

**Edit Route**:

```typescript
// pages/edit/route.ts
export const PATH_CODEBASE_EDIT = "components/$namespace/$name/edit" as const;
export const PATH_CODEBASE_EDIT_FULL = "/c/$clusterName/components/$namespace/$name/edit" as const;

export const routeCodebaseEdit = createRoute({
  getParentRoute: () => routeCluster,
  path: PATH_CODEBASE_EDIT,
  head: ({ params }) => ({
    meta: [{ title: `Edit ${params.name} [${params.namespace}] | KRCI` }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
```

### 3.3 Names Configuration Refactoring

**New Structure** (`components/form-fields/names.ts`):

```typescript
// Base names (unchanged)
export const NAMES = { ... } as const;

// Create form names (with formPart for tab validation)
export const CREATE_FORM_NAMES = {
  [NAMES.TYPE]: {
    name: NAMES.TYPE,
    formPart: "method", // Step 1: Method selection
  },
  [NAMES.STRATEGY]: {
    name: NAMES.STRATEGY,
    formPart: "method", // Step 1: Method selection
  },
  [NAMES.NAME]: {
    name: NAMES.NAME,
    formPart: "basicInfo", // Step 3: Basic Info
  },
  [NAMES.DESCRIPTION]: {
    name: NAMES.DESCRIPTION,
    formPart: "basicInfo", // Step 3: Basic Info
  },
  // ... etc
} as const;

// Edit form names (no formPart needed, single form)
export const EDIT_FORM_NAMES = {
  [NAMES.COMMIT_MESSAGE_PATTERN]: {
    name: NAMES.COMMIT_MESSAGE_PATTERN,
  },
  [NAMES.JIRA_SERVER]: {
    name: NAMES.JIRA_SERVER,
  },
  // ... only editable fields
} as const;

// Form parts for validation
export const FORM_PARTS = {
  METHOD: "method",
  TEMPLATE: "template",
  BASIC_INFO: "basicInfo",
  GIT_SETUP: "gitSetup",
  BUILD_CONFIG: "buildConfig",
} as const;
```

### 3.4 Form Fields Migration

**Strategy**: Move reusable fields from `dialogs/ManageCodebase/components/fields/` to `components/form-fields/`

**Structure**:

```
components/form-fields/
├── index.ts
├── BasicInfo/
│   ├── Name/
│   │   └── index.tsx
│   ├── Description/
│   │   └── index.tsx
│   └── ...
├── GitConfig/
│   ├── GitServer/
│   ├── Owner/
│   ├── Repository/
│   ├── RepositoryUrl/
│   └── ...
├── BuildConfig/
│   ├── Lang/
│   ├── Framework/
│   ├── BuildTool/
│   ├── CiTool/
│   └── ...
└── Advanced/
    ├── DefaultBranch/
    ├── DeploymentScript/
    ├── CodebaseVersioning/
    ├── CommitMessagePattern/
    ├── JiraIntegration/
    │   ├── JiraServerIntegration/
    │   ├── JiraServer/
    │   ├── TicketNamePattern/
    │   └── AdvancedJiraMapping/
    └── CodemieIntegration/
```

**Field Component Pattern**:

- Each field is self-contained
- Uses `useTypedFormContext()` hook
- Handles its own validation
- Can be used in both Create and Edit forms

### 3.5 Create Page Implementation

**Step 1: Method Selection**

- Radio group: Template / Scratch / Import
- Similar to current Selection component but as first step

**Step 2: Template Selection** (conditional)

- Only shown if "Template" method selected
- Use MarketplaceList component logic
- Search and filter templates
- Skip to Step 3 if other methods

**Step 3: Basic Info**

- Name, Display Name, Description
- Uses form-fields from `BasicInfo/`

**Step 4: Git Setup**

- Git Server, Owner, Repository
- Default Branch
- Uses form-fields from `GitConfig/`

**Step 5: Build Config**

- Language, Framework, Build Tool
- CI/CD Pipeline options
- Uses form-fields from `BuildConfig/`

**Step 6: Review**

- Summary cards
- Final confirmation
- Submit button

**FormActions**:

- Move from `dialogs/ManageCodebase/components/Create/components/Inner/components/FormActions/`
- Adapt for page context (useNavigate instead of closeDialog)
- Keep same onSubmit logic

### 3.6 Edit Page Implementation

**Simpler Structure**:

- Single form (no steps/tabs)
- Only editable fields:
  - CommitMessagePattern
  - JiraServerIntegration (toggle)
  - JiraServer (conditional)
  - TicketNamePattern (conditional)
  - AdvancedJiraMapping (conditional)
  - CodemieIntegration

**FormActions**:

- Move from `dialogs/ManageCodebase/components/Edit/components/FormActions/`
- Use navigate(-1) or navigate to details page on success
- Keep same onSubmit logic

### 3.7 Navigation Updates

**Update all places that open ManageCodebaseDialog**:

1. **Create**:

   ```typescript
   // OLD
   setDialog(ManageCodebaseDialog, { codebase: undefined });

   // NEW
   navigate({ to: PATH_CODEBASE_CREATE_FULL });
   ```

2. **Edit**:

   ```typescript
   // OLD
   setDialog(ManageCodebaseDialog, { codebase });

   // NEW
   navigate({
     to: PATH_CODEBASE_EDIT_FULL,
     params: { namespace: codebase.metadata.namespace, name: codebase.metadata.name },
   });
   ```

**Files to Update**:

- `components/CodebaseActionsMenu/index.tsx`
- `pages/list/components/ComponentList/index.tsx`
- Any other components that open the dialog

### 3.8 Migration Steps

#### Phase 1: Preparation

1. ✅ Create migration plan document
2. Create `components/form-fields/` structure
3. Move and refactor form fields
4. Create new names configuration (CREATE_FORM_NAMES, EDIT_FORM_NAMES)
5. Update field components to use new names

#### Phase 2: Create Page

1. Create route definition (`pages/create/route.ts`)
2. Create page component structure
3. Implement wizard steps
4. Move and adapt FormActions
5. Implement step validation
6. Add progress stepper
7. Test create flow

#### Phase 3: Edit Page

1. Create route definition (`pages/edit/route.ts`)
2. Create page component structure
3. Implement edit form
4. Move and adapt FormActions
5. Test edit flow

#### Phase 4: Integration

1. Update navigation in all components
2. Update breadcrumbs
3. Test full flow
4. Remove old dialog code (after verification)

#### Phase 5: Cleanup

1. Remove `dialogs/ManageCodebase/` directory
2. Remove dialog-related providers if not used elsewhere
3. Update documentation

### 3.9 Key Considerations

1. **Template Support**: Integrate MarketplaceList template selection logic
2. **Form State Management**: Use React Hook Form (already in use)
3. **Validation**: Per-step validation before navigation
4. **Error Handling**: Show errors inline, prevent navigation if invalid
5. **Loading States**: Show loading during API calls
6. **Success Handling**: Navigate to details page or list on success
7. **Breadcrumbs**: Add breadcrumbs to pages
8. **Back Navigation**: Handle browser back button
9. **Draft Saving**: Consider implementing (mentioned in wizard mock)

### 3.10 Testing Checklist

- [ ] Create flow: All steps work correctly
- [ ] Create flow: Template selection works
- [ ] Create flow: Validation prevents invalid navigation
- [ ] Create flow: Form submission creates codebase
- [ ] Create flow: Success navigation works
- [ ] Edit flow: Form loads with existing values
- [ ] Edit flow: Only editable fields are shown
- [ ] Edit flow: Form submission patches codebase
- [ ] Edit flow: Success navigation works
- [ ] Navigation: All entry points updated
- [ ] Breadcrumbs: Correct on both pages
- [ ] Error handling: API errors displayed
- [ ] Loading states: Shown during operations

---

## 4. Clarifications & Decisions

### 4.1 Confirmed Decisions

1. **Template Integration**: ✅ Integrate directly into wizard (not use existing dialog)
2. **Draft Saving**: ❌ Out of scope
3. **Step Skipping**: ✅ Maintain conditional step skipping (e.g., skip template if not using template)
4. **Edit Fields**: ✅ Only fields shown in Edit Form (CommitMessagePattern, Jira fields, CodemieIntegration)
5. **Backward Compatibility**: ✅ Remove dialog immediately after migration
6. **Form Part Validation**: ✅ Validate current step before proceeding to next step
7. **Route Parameters**: ✅ Path-based (`/components/create` or `/components/$namespace/$name/edit`)
8. **Navigation**: ✅ Use `Link` component from `@tanstack/react-router`, not `navigate()` function
9. **FormActions**: ✅ May not need separate component - integrate directly into wizard
10. **Form Fields**: ✅ Use generic API - pass `name` via props for reusability

### 4.2 Creation Strategies

**Current**: 3 options

- Create from template (value: "create")
- Clone project (value: "clone")
- Import project (value: "import")

**New**: 4 separate options

1. **Create from Template** (new)
   - Strategy: `clone`
   - Pre-filled from template: `language`, `framework`, `buildTool`, `type`, `repositoryUrl` (template.spec.source)
   - User selects: `gitServer` (platform's git provider - destination), `owner`, `repositoryName` (destination)
   - Similar to `CreateCodebaseFromTemplate` dialog

2. **Start from Scratch**
   - Strategy: `create`
   - User selects: `gitServer` (platform's git provider), `owner`
   - User fills: `repositoryName` (new repository name)
   - Can set: `emptyProject` (true/false)

3. **Clone Project**
   - Strategy: `clone`
   - User provides: `repositoryUrl` (external source URL - origin for cloning)
   - User selects: `gitServer` (platform's git provider - destination), `owner`
   - User fills: `repositoryName` (destination repository name)
   - May need: `codebaseAuth` (repositoryLogin, repositoryPasswordOrApiToken) if private repo

4. **Import Project**
   - Strategy: `import`
   - User selects: `gitServer` (platform's git provider), `owner`
   - User selects: `repository` (from existing repositories list - FormCombobox dropdown)
   - Repository field is a dropdown/combobox with existing repos (fetched via API)

**Key Differences**:

- **Clone**: Has `RepositoryUrl` field (external source), may need auth credentials
- **Import**: `Repository` is a combobox selecting from existing repos (API-fetched list)
- **Create from Scratch**: `Repository` is a text field for new repo name
- **Create from Template**: `RepositoryUrl` is pre-filled from template, user selects destination GitServer/Owner/Repository

### 4.3 Edit Wizard Structure

**Approach**: Show disabled steps before Advanced section

- Visual stepper showing: Method → Template → Basic Info → Git Setup → Build Config (all disabled)
- Only Advanced step enabled for editing
- User can see full context but only edit Advanced fields

### 4.4 Form Fields Generic API

**Pattern**:

```tsx
// Form field component accepts name via props
<NameField name={CREATE_FORM_NAMES.NAME.name} />

// Or pass entire config if needed
<NameField fieldConfig={CREATE_FORM_NAMES.NAME} />
```

**Benefits**:

- Fields can be reused in both Create and Edit
- No hardcoded names in field components
- Easy to swap between CREATE_FORM_NAMES and EDIT_FORM_NAMES

---

## 5. Updated Implementation Plan

### 5.1 Create Page Structure

**Steps**:

1. **Method Selection**: 4 options (Create from Template, Start from Scratch, Clone, Import)
2. **Template Selection**: Conditional, only if "Create from Template" method selected
   - Shows template list with search/filter
   - Pre-fills: language, framework, buildTool, type, repositoryUrl
3. **Basic Info**: Name, Description
4. **Git Setup**:
   - **Create from Template/Scratch**:
     - If Gerrit OR no API: GitServer, GitUrlPath (single field)
     - Otherwise: GitServer, Owner, Repository (text field)
   - **Clone**:
     - RepositoryUrl (external source)
     - If Gerrit OR no API: GitServer, GitUrlPath (single field)
     - Otherwise: GitServer (destination), Owner, Repository (text field)
     - CodebaseAuth (optional)
   - **Import**:
     - If Gerrit OR no API: GitServer, GitUrlPath (single field)
     - Otherwise: GitServer, Owner, Repository (combobox - existing repos)
   - All: Default Branch
5. **Build Config**: Language, Framework, Build Tool, CI/CD options
   - **Create from Template**: Pre-filled, may be editable
   - **Others**: User selects
6. **Review**: Summary cards, final confirmation

**Key Changes from Current**:

- Remove wrapper components, extract business logic
- Integrate FormActions logic directly into wizard navigation
- Use Link component for navigation (back button, cancel)
- Step validation before proceeding

### 5.2 Edit Page Structure

**Approach**:

- Visual stepper with disabled steps (Method → Template → Basic Info → Git Setup → Build Config)
- Only Advanced step enabled
- Edit form with: CommitMessagePattern, JiraServerIntegration, JiraServer, TicketNamePattern, AdvancedJiraMapping, CodemieIntegration
- Submit button integrated (no separate FormActions component)

### 5.3 Form Fields Migration

**New Structure**:

```
components/form-fields/
├── index.ts
├── BasicInfo/
│   ├── Name/
│   │   └── index.tsx (accepts name prop)
│   ├── Description/
│   └── ...
├── GitConfig/
│   ├── GitServer/ (accepts name prop)
│   ├── Owner/ (accepts name prop)
│   └── ...
└── Advanced/
    ├── CommitMessagePattern/ (accepts name prop)
    └── ...
```

**Pattern Example**:

```tsx
// NameField component
interface NameFieldProps {
  name: string; // Field name from CREATE_FORM_NAMES or EDIT_FORM_NAMES
}

export const NameField: React.FC<NameFieldProps> = ({ name }) => {
  const {
    register,
    control,
    formState: { errors },
  } = useTypedFormContext();

  return (
    <FormTextField
      {...register(name, { required: "Name is required" })}
      label="Name"
      control={control}
      errors={errors}
    />
  );
};
```

### 5.4 Names Configuration

**New Structure**:

```typescript
// Base names (unchanged)
export const NAMES = { ... } as const;

// Create form names (with formPart for step validation)
export const CREATE_FORM_NAMES = {
  [NAMES.NAME]: {
    name: NAMES.NAME,
    formPart: "basicInfo", // Step 3: Basic Info
  },
  // ... etc
} as const;

// Edit form names (no formPart needed)
export const EDIT_FORM_NAMES = {
  [NAMES.COMMIT_MESSAGE_PATTERN]: {
    name: NAMES.COMMIT_MESSAGE_PATTERN,
  },
  // ... only editable fields
} as const;

// Form parts for validation
export const FORM_PARTS = {
  METHOD: "method",
  TEMPLATE: "template",
  BASIC_INFO: "basicInfo",
  GIT_SETUP: "gitSetup",
  BUILD_CONFIG: "buildConfig",
  ADVANCED: "advanced",
} as const;
```

### 5.5 Navigation Pattern

**Use Link Component**:

```tsx
import { Link } from "@tanstack/react-router";
import { routeCodebaseList } from "../pages/list/route";

// Cancel/Back button
<Link to={routeCodebaseList.fullPath}>
  <Button variant="ghost">Cancel</Button>
</Link>

// Success navigation
<Link
  to={routeCodebaseDetails.fullPath}
  params={{ namespace, name }}
>
  <Button>View Details</Button>
</Link>
```

**Update Entry Points**:

```tsx
// OLD
setDialog(ManageCodebaseDialog, { codebase: undefined });

// NEW
<Link to={routeCodebaseCreate.fullPath}>
  <Button>Create Component</Button>
</Link>;
```

### 5.6 Step Validation

**Pattern**:

```tsx
const handleNext = async () => {
  const currentStepFields = getFieldsForStep(currentStep);
  const isValid = await trigger(currentStepFields);

  if (isValid) {
    setStep(currentStep + 1);
  }
};
```

**Fields per Step**:

- Step 1 (Method): TYPE, STRATEGY
- Step 2 (Template): TEMPLATE_ID (if method === "createFromTemplate")
  - Pre-fills: LANG, FRAMEWORK, BUILD_TOOL, TYPE, REPOSITORY_URL
- Step 3 (Basic Info): NAME, DESCRIPTION
- Step 4 (Git Setup):
  - All: GIT_SERVER, DEFAULT_BRANCH
  - **If Gerrit OR no API**: GIT_URL_PATH (single field)
  - **Otherwise**:
    - Create from Template/Scratch: OWNER, REPOSITORY (text field)
    - Clone: REPOSITORY_URL (external), OWNER, REPOSITORY (text field), CODEBASE_AUTH (optional)
    - Import: OWNER, REPOSITORY (combobox - existing repos)
- Step 5 (Build Config): LANG, FRAMEWORK, BUILD_TOOL, CI_TOOL
  - Create from Template: Pre-filled, may be editable
- Step 6 (Review): No validation, just submit

---

## 6. Implementation Details

### 6.1 Strategy-Specific Form Fields

**Create from Template**:

- Template selection (Step 2)
- Pre-filled: lang, framework, buildTool, type, repositoryUrl
- Git Setup:
  - If Gerrit OR no API: gitServer, gitUrlPath (single field)
  - Otherwise: gitServer, owner, repositoryName (destination)
- Strategy: `clone`

**Start from Scratch**:

- No template selection
- Git Setup:
  - If Gerrit OR no API: gitServer, gitUrlPath (single field)
  - Otherwise: gitServer, owner, repositoryName (new)
- Strategy: `create`
- Can set: emptyProject

**Clone**:

- Git Setup:
  - repositoryUrl (external source)
  - If Gerrit OR no API: gitServer, gitUrlPath (single field)
  - Otherwise: gitServer (destination), owner, repositoryName (destination)
- Optional: codebaseAuth (if private repo)
- Strategy: `clone`

**Import**:

- Git Setup:
  - If Gerrit OR no API: gitServer, gitUrlPath (single field)
  - Otherwise: gitServer, owner, repository (combobox - existing repos from API)
- Strategy: `import`

### 6.2 Repository Field Behavior

The Repository field component should handle different strategies:

```tsx
// Repository field component
interface RepositoryFieldProps {
  name: string;
  strategy: "create" | "clone" | "import" | "createFromTemplate";
}

export const RepositoryField: React.FC<RepositoryFieldProps> = ({ name, strategy }) => {
  // Import: FormCombobox with existing repos
  if (strategy === "import") {
    return <FormCombobox ... />; // Fetch from API
  }

  // Clone/Create from Template/Scratch: FormTextField
  return <FormTextField ... />; // User enters name
};

// Git Setup field component should handle Gerrit case
interface GitSetupFieldProps {
  gitServer: string;
  strategy: "create" | "clone" | "import" | "createFromTemplate";
  hasApiBaseUrl: boolean;
}

export const GitSetupFields: React.FC<GitSetupFieldProps> = ({ gitServer, strategy, hasApiBaseUrl }) => {
  const isGerrit = gitServer.includes(gitProvider.gerrit);
  const useGitUrlPath = isGerrit || !hasApiBaseUrl;

  if (useGitUrlPath) {
    // Gerrit or no API: Single GitUrlPath field (no Owner select)
    return <GitUrlPathField name={CREATE_FORM_NAMES.GIT_URL_PATH.name} />;
  }

  // Otherwise show Owner + Repository (GitHub, GitLab, etc.)
  return (
    <>
      <OwnerField name={CREATE_FORM_NAMES.REPOSITORY_OWNER.name} />
      <RepositoryField name={CREATE_FORM_NAMES.REPOSITORY_NAME.name} strategy={strategy} />
    </>
  );
};
```

**Note**: The condition `gitServer.includes(gitProvider.gerrit) || !hasApiBaseUrl` determines whether to show:

- **GitUrlPath** (single field) - for Gerrit or when API is unavailable
- **Owner + Repository** (two fields) - for other providers (GitHub, GitLab, etc.) with API available

## 7. Next Steps

1. ✅ Clarify creation strategies structure (4 options - DONE)
2. ✅ Confirm Edit wizard step display approach (DONE)
3. Begin Phase 1: Preparation
   - Create form-fields structure
   - Refactor names configuration
   - Make fields accept name prop
4. Phase 2: Create Page
   - Implement 6-step wizard
   - Integrate template selection
   - Add step validation
5. Phase 3: Edit Page
   - Implement disabled stepper
   - Add edit form
6. Phase 4: Integration
   - Update all navigation points
   - Test full flow
7. Phase 5: Cleanup
   - Remove old dialog code

---

**Document Version**: 3.0  
**Last Updated**: 2024  
**Status**: ✅ Ready for implementation - All clarifications received
