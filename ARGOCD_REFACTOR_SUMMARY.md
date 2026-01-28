# Integration Forms Refactor – Summary

## Approach
- **Backend:** Composite tRPC procedures (QuickLink + Secret). Fail-fast, no rollback.
- **Client:** Single TanStack form, one mutation, dirty-field tracking. Pattern: ManageArgoCD.

## Status

| Module | Backend | Tests | Client |
|--------|---------|-------|--------|
| ManageArgoCD | ✅ | ✅ 9 | ✅ |
| ManageDependencyTrack | ✅ | ✅ 9 | ✅ |
| ManageSonar | ✅ | ✅ 9 | ✅ |
| ManageDefectDojo | ✅ | ✅ 9 | ✅ |
| ManageNexus | ✅ | ✅ 9 | ✅ |
| ManageChatAssistant | ✅ | ✅ 9 | ✅ |
| ManageJiraServer | ✅ | ✅ 9 | ✅ (JiraServer, no QuickLink) |
| ManageRegistry | ⏳ | ⏳ | ⏳ (4 resources) |
| ManageGitServer | ✅ | ⏳ | ✅ |

## Deferred
- **Jira:** Uses JiraServer + Secret; no QuickLink in system. QuickLink support can be added later or left as-is.

## Next
1. Registry: implement composite + client (4 resources).
2. ManageGitServer: add backend tests (9 cases).
3. Remove MultiFormContextProvider when all migrated.

## Reference
- Backend example: `packages/trpc/src/routers/k8s/procedures/composite/manageArgoCDIntegration/`
- Client example: `apps/client/.../argocd/components/ManageArgoCD/` (names.ts, providers/form/, composite mutate)
