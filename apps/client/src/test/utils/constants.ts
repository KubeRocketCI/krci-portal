// Default cluster values for testing and storybook
export const TEST_CLUSTER_NAME = "in-cluster";
export const TEST_NAMESPACE = "default";
export const TEST_ALLOWED_NAMESPACES = ["default", "development", "staging", "production"];

// Mock permissions data with all actions allowed
export const mockPermissions = {
  create: { allowed: true, reason: "" },
  patch: { allowed: true, reason: "" },
  delete: { allowed: true, reason: "" },
};
