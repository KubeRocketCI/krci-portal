export interface ValidationRule {
  pattern: RegExp;
  message: string;
}

export const validationRules: Record<string, ValidationRule[]> = {
  // TODO: to extend
  GIT_URL_PATH: [
    {
      pattern: /^[^/].*[^/]$/, // same: no leading/trailing slash
      message: "String cannot start or end with a slash symbol",
    },
    {
      pattern: /^[a-zA-Z0-9]/, // must start with alphanumeric
      message: "String has to start with an alphabet letter or a number",
    },
    {
      pattern: /^(?!.*[.]{2})(?!.*[/]{2})[a-zA-Z0-9._-]+(\/[a-zA-Z0-9._-]+)*$/,
      message:
        "Only alphanumeric characters, dot, dash, underscore and slashes are allowed. Consecutive slashes or dots are not allowed.",
    },
  ],
  BRANCH_NAME: [
    {
      pattern: /^(?![/.-])[A-Za-z0-9/._-]*(?<![/.-])$/,
      message:
        "Branch name may contain: upper-case and lower-case letters, numbers, slashes (/), dashes (-), dots (.), and underscores (_). It cannot start or end with a slash (/), dot (.), or dash (-). Consecutive special characters are not allowed. Minimum 2 characters.",
    },
  ],
};
