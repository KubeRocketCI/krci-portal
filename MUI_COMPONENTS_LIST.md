# MUI Components Used in krci-portal

This document lists all Material-UI (MUI) components, hooks, and utilities used throughout the application for migration to shadcn/ui.

## Component Inventory

### Layout & Structure Components
- **Box** - Container/layout wrapper
- **Stack** - Flex container for layout
- **Grid** - Grid layout system (and GridSize type)
- **Paper** - Elevated container
- **Divider** - Horizontal divider

### Navigation Components
- **Tabs** - Tab navigation (imported as MuiTabs)
- **Tab** - Individual tab item
- **Stepper** - Step indicator
- **Step** - Individual step
- **StepLabel** - Step label
- **Breadcrumbs** - Breadcrumb navigation

### Input Components
- **TextField** (imported as MuiTextField) - Text input field
- **Autocomplete** (imported as MuiAutocomplete) - Autocomplete input
- **Select** - Dropdown select
- **Checkbox** - Checkbox input
- **Switch** - Toggle switch
- **InputBase** - Base input component
- **InputLabel** - Input label
- **InputAdornment** - Input prefix/suffix
- **FormControl** - Form control wrapper
- **FormControlLabel** - Label with form control
- **FormHelperText** - Helper text below input

### Button Components
- **Button** - Primary button component
- **IconButton** - Button with icon only
- **ButtonGroup** - Group of buttons
- **ToggleButton** - Toggleable button
- **ToggleButtonGroup** - Group of toggle buttons

### Dialog & Overlay Components
- **Dialog** - Modal dialog
- **DialogTitle** - Dialog header
- **DialogContent** - Dialog body content
- **DialogActions** - Dialog footer actions
- **Tooltip** - Hover tooltip
- **Popper** - Positioning engine
- **ClickAwayListener** - Detect clicks outside element

### Feedback Components
- **Alert** - Alert message
- **CircularProgress** - Loading spinner
- **Chip** - Compact label/tag

### Data Display Components
- **Typography** - Text component with variants
- **Table** - Data table
- **TableBody** - Table body
- **TableHead** - Table header
- **TableRow** - Table row
- **TableCell** - Table cell
- **TableContainer** - Table container
- **TablePagination** - Table pagination controls
- **List** (via ListItemButton, ListItemIcon, ListItemText)
- **ListItemButton** - List item button
- **ListItemIcon** - List item icon
- **ListItemText** - List item text
- **MenuList** - Menu list container
- **MenuItem** - Menu item
- **Accordion** - Expandable sections
- **AccordionSummary** - Accordion header
- **AccordionDetails** - Accordion content
- **Card** - Card container

### Miscellaneous
- **Link** (imported as MuiLink) - Anchor link
- **alpha** - Color opacity utility

### Theme & Styling
- **ThemeProvider** - Theme context provider
- **StyledEngineProvider** - Styling engine provider
- **styled** - CSS-in-JS styling utility
- **createTheme** - Theme creation utility
- **useTheme** - Hook to access theme
- **darken** - Color manipulation utility

### Type Definitions
- **AutocompleteProps** - Autocomplete props type
- **AutocompleteRenderInputParams** - Render input params type
- **ButtonProps** - Button props type
- **ChipProps** - Chip props type
- **FormControlLabelProps** - FormControlLabel props type
- **InputProps** - Input props type
- **SxProps** - SX props type (styling props)
- **StandardTextFieldProps** - TextField props type
- **TableCellProps** - TableCell props type
- **Theme** - Theme object type

### Aliased Imports (MUI with "Mui" prefix)
These are imported with "Mui" prefix to avoid naming conflicts:
- **MuiAutocomplete** - Alias for Autocomplete
- **MuiTextField** - Alias for TextField
- (**MuiTable**, **MuiTableBody**, **MuiTablePagination**, **MuiTableRow**) - Likely not used or legacy

## Migration Priority

### High Priority (Most Used)
1. **Box** - Used extensively for layout
2. **Stack** - Main flex container
3. **Grid** - Grid layouts
4. **Button** - Primary CTA component
5. **Dialog** - Modal dialogs
6. **TextField** - Form inputs
7. **Typography** - Text styling
8. **Tooltip** - User hints
9. **IconButton** - Icon buttons

### Medium Priority
10. **Accordion** - Expandable sections
11. **Chip** - Status badges
12. **Autocomplete** - Search/select inputs
13. **Table** - Data tables
14. **Tabs** - Tab navigation
15. **Alert** - Error/success messages
16. **Paper** - Elevated containers
17. **FormControl** & related - Form elements
18. **Select** - Dropdowns
19. **Checkbox** - Checkboxes
20. **Switch** - Toggles

### Lower Priority (Specialized)
21. **Stepper** - Wizard flows
22. **Breadcrumbs** - Navigation
23. **Popper** - Positioning
24. **Card** - Card containers
25. **MenuList/MenuItem** - Menus

## Notes
- MUI is the primary component library used throughout the application
- No imports from `@mui/icons-material`, `@mui/lab`, or `@mui/system` found
- Some components are aliased with "Mui" prefix to avoid conflicts
- Theme utilities and styling are heavily used (styled, useTheme, etc.)

