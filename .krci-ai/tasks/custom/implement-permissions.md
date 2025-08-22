# Task: Implement Permissions

## Description

Implement Role-Based Access Control (RBAC) permission checks using the established permission system with Keycloak integration and hook creators.

## Prerequisites

- [ ] **Permission requirements defined**: RBAC rules and access control specified
- [ ] **Resource configuration exists**: K8s resource config available
- [ ] **UI integration points identified**: Components requiring validation
- [ ] **Backend procedures secured**: API endpoints with permission validation

### Reference Assets

Dependencies:

- [auth.md](./.krci-ai/data/custom/auth.md)
- [api.md](./.krci-ai/data/custom/api.md)
- [common-components.md](./.krci-ai/data/custom/common-components.md)
- [permission-patterns.md](./.krci-ai/templates/custom/permission-patterns.md)

## Implementation Checklist

### Permission Hook Setup

- [ ] **Create permission hook**: Use `createUsePermissionsHook(k8sResourceConfig)`
- [ ] **Export from module**: Add permission hook to resource module exports
- [ ] **Test permission data**: Verify hook returns proper permission structure

### UI Integration

- [ ] **Use ButtonWithPermission**: Replace buttons with permission-aware components
- [ ] **Add permission checks**: Validate permissions before showing UI elements
- [ ] **Handle disabled states**: Show appropriate tooltips for forbidden actions
- [ ] **Add bulk operation validation**: Check permissions for selected items

### API Integration

- [ ] **Add server validation**: Implement permission checks in tRPC procedures
- [ ] **Validate on mutation**: Check permissions before executing operations
- [ ] **Handle permission errors**: Return proper error messages for forbidden actions

## Success Criteria

- [ ] **Permission hook implemented**: Hook returns proper permission data
- [ ] **UI validation working**: Components respect permission states
- [ ] **Server protection active**: API endpoints validate permissions
- [ ] **Error handling**: Proper feedback for permission denials
- [ ] **Testing complete**: Permission scenarios tested thoroughly

## Best Practices

1. **Always validate twice**: Check permissions on both client and server
2. **Use ButtonWithPermission**: For all action buttons requiring permissions
3. **Provide clear feedback**: Show why actions are disabled
4. **Handle loading states**: Account for permission loading time
5. **Test edge cases**: Verify behavior when permissions change
