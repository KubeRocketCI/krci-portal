// PROTOTYPE (EPMDEDP-16072): throwaway. Not for main.
// Fixtures: recorded from the testbed DefectDojo by `packages/trpc/scripts/prototype-defectdojo-record.ts`.
import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";
import { withAppProviders } from "@sb/index";
import codebaseScopes from "@/modules/platform/security/prototype-defectdojo/__fixtures__/codebase-scopes.json";
import defectDojoTestbed from "@/modules/platform/security/prototype-defectdojo/__fixtures__/defectdojo-testbed.json";
import {
  createFixtureDefectDojoApi,
  type PrototypeDefectDojoFixtureMode,
} from "@/modules/platform/security/prototype-defectdojo/api/fixtureApi";
import { CodebaseFindingsVariant } from "./CodebaseFindingsVariant";
import type { CodebaseFindingsScope, CodebaseFindingsVariantKey, EnvironmentFocus } from "./types";

interface HarnessProps {
  variant: CodebaseFindingsVariantKey;
  /** A codebase of `codebase-scopes.json`. */
  codebaseName: string;
  mode: PrototypeDefectDojoFixtureMode;
  /** Drops the Environments of the scope: Code and Image keep their data, Runtime has none. */
  withoutEnvironments?: boolean;
  /** Environment in focus, as the Stage Applications tab passes it. */
  focus?: EnvironmentFocus;
}

function Harness({ variant, codebaseName, mode, withoutEnvironments = false, focus }: HarnessProps) {
  const api = React.useMemo(() => createFixtureDefectDojoApi(defectDojoTestbed, mode), [mode]);

  const scope = React.useMemo<CodebaseFindingsScope | undefined>(() => {
    const recorded = codebaseScopes.find((candidate) => candidate.codebaseName === codebaseName);
    if (!recorded) {
      return undefined;
    }
    return withoutEnvironments ? { ...recorded, environments: [] } : recorded;
  }, [codebaseName, withoutEnvironments]);

  if (!scope) {
    return <p>No recorded scope for {codebaseName}.</p>;
  }

  return <CodebaseFindingsVariant variant={variant} scope={scope} focus={focus} api={api} />;
}

const meta: Meta<typeof Harness> = {
  title: "Prototype/DefectDojo/Codebase Security Findings",
  component: Harness,
  decorators: [withAppProviders()],
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof Harness>;

const DATA_CODEBASE = "test-go-app";
const NO_DATA_CODEBASE = "test-node-app";

function dataStory(variant: CodebaseFindingsVariantKey): Story {
  return {
    args: { variant, codebaseName: DATA_CODEBASE, mode: "recorded" },
    play: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      await expect((await canvas.findAllByText("Semgrep JSON Report")).length).toBeGreaterThan(0);
      await expect((await canvas.findAllByText("Clean")).length).toBeGreaterThan(0);
      await expect(canvas.queryByText("No scan data")).not.toBeInTheDocument();
    },
  };
}

function noScanDataStory(variant: CodebaseFindingsVariantKey): Story {
  return {
    args: { variant, codebaseName: NO_DATA_CODEBASE, mode: "recorded" },
    play: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      // One per level. The levels leave their loading state at different times.
      await waitFor(() => expect(canvas.getAllByText("No scan data")).toHaveLength(3));
      await expect(canvas.queryByText("Clean")).not.toBeInTheDocument();
    },
  };
}

function runtimeNoScanDataStory(variant: CodebaseFindingsVariantKey): Story {
  return {
    args: { variant, codebaseName: DATA_CODEBASE, mode: "recorded", withoutEnvironments: true },
    play: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      await expect((await canvas.findAllByText("Semgrep JSON Report")).length).toBeGreaterThan(0);
      await expect(canvas.getAllByText("No scan data")).toHaveLength(1);
    },
  };
}

function notConfiguredStory(variant: CodebaseFindingsVariantKey): Story {
  return {
    args: { variant, codebaseName: DATA_CODEBASE, mode: "notConfigured" },
    play: async ({ canvasElement }) => {
      await expect(await within(canvasElement).findByText("DefectDojo is not connected")).toBeVisible();
    },
  };
}

function unreachableStory(variant: CodebaseFindingsVariantKey): Story {
  return {
    args: { variant, codebaseName: DATA_CODEBASE, mode: "unreachable" },
    play: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      await expect((await canvas.findAllByText("DefectDojo is unreachable")).length).toBeGreaterThan(0);
      await expect((await canvas.findAllByRole("button", { name: "Retry" })).length).toBeGreaterThan(0);
    },
  };
}

export const VariantAData: Story = dataStory("A");
export const VariantANoScanData: Story = noScanDataStory("A");
export const VariantARuntimeNoScanData: Story = runtimeNoScanDataStory("A");
export const VariantANotConfigured: Story = notConfiguredStory("A");
export const VariantAUnreachable: Story = unreachableStory("A");

export const VariantBData: Story = dataStory("B");
export const VariantBNoScanData: Story = noScanDataStory("B");
export const VariantBRuntimeNoScanData: Story = runtimeNoScanDataStory("B");
export const VariantBNotConfigured: Story = notConfiguredStory("B");
export const VariantBUnreachable: Story = unreachableStory("B");

export const VariantCData: Story = dataStory("C");
export const VariantCNoScanData: Story = noScanDataStory("C");
export const VariantCRuntimeNoScanData: Story = runtimeNoScanDataStory("C");
export const VariantCEnvironmentInFocus: Story = {
  args: {
    variant: "C",
    codebaseName: DATA_CODEBASE,
    mode: "recorded",
    focus: { cdPipeline: "demo", stage: "dev" },
  },
  play: async ({ canvasElement }) => {
    // The two Runtime scans of Environment demo / dev are marked.
    await waitFor(() => expect(canvasElement.querySelectorAll("[data-focused]")).toHaveLength(2));
  },
};
export const VariantCNotConfigured: Story = notConfiguredStory("C");
export const VariantCUnreachable: Story = unreachableStory("C");
