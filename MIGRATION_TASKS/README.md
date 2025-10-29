# Component Migration Tasks

Individual migration task files for each MUI component. Each file is a self-contained agent task.

## Task Structure

Each task file contains:
- **Status & estimation** - Current progress and file count
- **Transformation** - Before/after code examples
- **Files list** - TBD initially, AI populates during discovery
- **Checklist** - Simple progress tracking
- **Notes** - Issues encountered

## Using Tasks

### For AI Agents
1. Open the relevant task file
2. Run discovery commands to find all files
3. Fill list with discovered files
4. Migrate files systematically in size of 20 items per iteration
5. Update checkboxes after iteration
5. Document issues in Notes section

### Creating New Tasks
1. Copy `COMPONENT_MIGRATION_TEMPLATE.md`
2. Rename to `[COMPONENT]_MIGRATION_TASK.md`
3. Fill in component-specific transformation examples

## Task Files

| Component | Task File | Status |
|-----------|-----------|---------|
| Box | [BOX_MIGRATION_TASK.md](./BOX_MIGRATION_TASK.md) | Not Started |
