import type { within } from "storybook/test";

type Scope = ReturnType<typeof within>;

export const bodyRows = (table: Scope): HTMLElement[] => table.getAllByRole("row").slice(1);

export const buttonLabels = (scope: Scope): (string | null)[] =>
  scope.getAllByRole("button").map((button: HTMLElement) => button.textContent);

export const FORBIDDEN_MESSAGE = "Kubernetes API request failed: 403 Forbidden. stages is forbidden for this user";
