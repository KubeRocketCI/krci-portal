---
dependencies:
  data:
    - custom/auth.md
    - custom/api.md
    - custom/common-components.md
  templates:
    - custom/permission-patterns.md
---

# Task: Implement Permissions

## Description

Implement Role-Based Access Control (RBAC) permission checks using the established permission system with Keycloak integration and hook creators.

## Prerequisites

Permission requirements must be defined with RBAC rules and access control specified for all protected operations. Resource configuration should exist with Kubernetes resource config available for resource-based permissions. UI integration points must be identified with components requiring permission validation determined. Backend procedures should be secured with API endpoints requiring permission validation identified.

<instructions>
Create permission hook using createUsePermissionsHook function passing K8s resource configuration for resource-based authorization. Export permission hook from module index adding to resource module exports for easy import. Test permission data by verifying hook returns proper permission structure with create, read, update, and delete flags.

Integrate in UI by using ButtonWithPermission component replacing standard buttons for actions requiring authorization. Add permission checks validating permissions before showing UI elements to users preventing confusion. Handle disabled states by showing appropriate tooltips for forbidden actions explaining why action unavailable. Add bulk operation validation by checking permissions for all selected items ensuring authorized access.

Integrate in API by adding server validation implementing permission checks in tRPC procedures before operations execute. Validate on mutation by checking permissions before executing data modification operations. Handle permission errors by returning proper error messages for forbidden actions with appropriate HTTP status codes.

Reference auth.md for authentication and authorization patterns including session validation and permission checking. Use api.md patterns for implementing permission validation in tRPC procedures consistently. Apply common-components.md patterns for ButtonWithPermission and other permission-aware components. Follow permission-patterns.md template for consistent permission implementation across features.

Ensure security in depth by validating permissions on both client and server preventing bypass through client manipulation. Provide clear user feedback for permission denials explaining why actions unavailable. Test permission scenarios thoroughly including edge cases like permission changes during session.
</instructions>

## Framework Context: Permission System Architecture

RBAC Integration: The application implements Role-Based Access Control integrated with Keycloak authorization services. Permissions determine user access to resources and operations based on roles assigned in Keycloak. The system supports fine-grained permissions at resource level including create, read, update, and delete operations on specific resource types.

Permission Hook Pattern: Permission hooks provide React components with current user's permissions for specific resources. Create permission hooks using createUsePermissionsHook factory function passing resource configuration. Hooks return permission object with boolean flags for each operation type. Component code checks permission flags before rendering action buttons or executing operations.

Kubernetes Resource Model: Permissions align with Kubernetes resource model where each resource type has associated permissions. Resource configurations define resource metadata including API group, version, and kind. Permission checks validate authorization for operations on specific resource types like pods, deployments, or custom resources.

Client-Side Validation: Client permission checks provide immediate user feedback hiding unavailable actions. ButtonWithPermission component from common-components.md integrates permission checking with button rendering. Component disables buttons and shows tooltips when permissions lacking. Client validation improves user experience but must not replace server validation for security.

Server-Side Validation: Server must validate permissions before executing any protected operations regardless of client checks. Implement permission validation in tRPC procedure middleware or at procedure start. Check permissions using authorization service validating user token and resource access. Return appropriate error responses when permission validation fails.

Keycloak Integration: Permission validation integrates with Keycloak through authorization services checking policies and roles. Session context includes user token used for permission validation. Authorization service evaluates policies considering user roles, resource attributes, and operation type. Follow auth.md patterns for session handling and authorization integration.

Permission Error Handling: Handle permission errors gracefully with clear user feedback. Show appropriate error messages explaining permission denial. Provide guidance on obtaining necessary permissions when applicable. Log permission denials for security monitoring and audit purposes.

Bulk Operation Permissions: Bulk operations require permission validation for all selected items. Check permissions for each item before executing bulk operation. Handle partial permissions scenarios where user authorized for some items but not others. Provide clear feedback about which items processed successfully and which denied.

## Implementation Checklist

### Permission Hook Setup

- Create permission hook: Use `createUsePermissionsHook(k8sResourceConfig)`
- Export from module: Add permission hook to resource module exports
- Test permission data: Verify hook returns proper permission structure

### UI Integration

- Use ButtonWithPermission: Replace buttons with permission-aware components
- Add permission checks: Validate permissions before showing UI elements
- Handle disabled states: Show appropriate tooltips for forbidden actions
- Add bulk operation validation: Check permissions for selected items

### API Integration

- Add server validation: Implement permission checks in tRPC procedures
- Validate on mutation: Check permissions before executing operations
- Handle permission errors: Return proper error messages for forbidden actions

## Success Criteria

<success_criteria>

- Permission hook implemented and returns proper permission data structure
- UI validation working with components respecting permission states correctly
- Server protection active with API endpoints validating permissions before operations
- Error handling comprehensive with proper feedback for permission denials
- Testing complete with permission scenarios tested thoroughly including edge cases
- Security in depth achieved with validation on both client and server
- User experience optimized with clear feedback for unavailable actions
- Bulk operations secured with proper permission validation for all items
- Integration verified with Keycloak authorization services working correctly

</success_criteria>

## Best Practices

Always validate permissions on both client and server ensuring security in depth and preventing client-side bypass attempts. Use ButtonWithPermission component consistently for all action buttons requiring authorization providing uniform user experience. Provide clear feedback explaining why actions are disabled or unavailable helping users understand permission limitations. Handle loading states properly accounting for permission data loading time preventing UI flicker. Test edge cases thoroughly including permission changes during active session and partial permissions for bulk operations. Follow auth.md patterns consistently for session validation and permission checking across application. Log permission denials appropriately for security monitoring and audit compliance. Design permission granularity appropriately balancing security needs with usability and administrative overhead.
