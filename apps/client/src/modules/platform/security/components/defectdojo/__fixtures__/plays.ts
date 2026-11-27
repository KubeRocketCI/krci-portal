import { within } from "storybook/test";

type Scope = ReturnType<typeof within>;

export const group = (scope: Scope, name: string): Scope => within(scope.getByRole("group", { name }));

export const stagePath = (namespace: string, cdPipeline: string, stage: string) =>
  `/c/in-cluster/cdpipelines/${namespace}/${cdPipeline}/stages/${stage}`;

export const codebasePath = (namespace: string, codebase: string) => `/c/in-cluster/projects/${namespace}/${codebase}`;

export const bodyRows = (table: Scope): HTMLElement[] => table.getAllByRole("row").slice(1);

export const buttonLabels = (scope: Scope): (string | null)[] =>
  scope.getAllByRole("button").map((button: HTMLElement) => button.textContent);

export const FORBIDDEN_MESSAGE = "Kubernetes API request failed: 403 Forbidden. stages is forbidden for this user";

export const chipLabels = (group: HTMLElement): (string | null)[] =>
  within(group)
    .getAllByRole("img")
    .map((chip: HTMLElement) => chip.getAttribute("aria-label"));
