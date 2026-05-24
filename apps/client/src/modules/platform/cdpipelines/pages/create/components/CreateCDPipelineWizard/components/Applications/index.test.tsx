import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render } from "@testing-library/react";
import React from "react";

// ---- Module mocks must be hoisted before importing the component under test ----

const mockUseCodebaseWatchList = vi.fn();
const mockUseCodebaseBranchWatchList = vi.fn();

vi.mock("@/k8s/api/groups/KRCI/Codebase", () => ({
  useCodebaseWatchList: (opts: unknown) => mockUseCodebaseWatchList(opts),
}));

vi.mock("@/k8s/api/groups/KRCI/CodebaseBranch/hooks", () => ({
  useCodebaseBranchWatchList: (opts: unknown) => mockUseCodebaseBranchWatchList(opts),
}));

// Replace the heavy combobox with a stub that exposes the renderSelectedContent
// callback so application cards still mount under the form provider.
vi.mock("@/core/components/form/components/FormCombobox", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  FormCombobox: (props: any) => {
    const { renderSelectedContent, data, options } = props;
    if (!renderSelectedContent || !data?.form) return null;
    const selectedValues = (data.form.getFieldValue("applications") as string[]) ?? [];
    return (
      <div data-testid="form-combobox-stub">
        {renderSelectedContent({
          selectedValues,
          data,
          options: options ?? [],
          onRemove: () => {},
        })}
      </div>
    );
  },
}));

vi.mock("@/core/components/misc/LoadingWrapper", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  LoadingWrapper: ({ children }: any) => <>{children}</>,
}));

vi.mock("@/core/components/sprites/K8sRelatedIconsSVGSprite", () => ({
  UseSpriteSymbol: () => null,
}));

// ---- imports under test (after mocks) ----
import { Applications } from "./index";
import { CreateCDPipelineFormProvider } from "../../providers/form/provider";
import { CreateCDPipelineFormContext, type CreateCDPipelineFormInstance } from "../../providers/form/context";
import type { CreateCDPipelineFormValues } from "../../types";

const codebaseLabelKey = "app.edp.epam.com/codebaseName";

type FormRef = { current: CreateCDPipelineFormInstance | null };

const FormCapture: React.FC<{ formRef: FormRef }> = ({ formRef }) => {
  const form = React.useContext(CreateCDPipelineFormContext);
  formRef.current = form;
  return null;
};

const buildCodebase = (name: string, defaultBranch = "main") => ({
  metadata: { name, namespace: "ns", creationTimestamp: "2024-01-01T00:00:00Z" },
  spec: { defaultBranch, description: "", lang: "", framework: "", buildTool: "", type: "application" },
});

const buildBranch = (codebaseName: string, branchName: string) => ({
  metadata: {
    name: `${codebaseName}-${branchName}`,
    namespace: "ns",
    creationTimestamp: "2024-01-01T00:00:00Z",
  },
  spec: { branchName, codebaseName },
});

const renderApplications = (defaultValues: Partial<CreateCDPipelineFormValues>) => {
  const formRef: FormRef = { current: null };
  const utils = render(
    <CreateCDPipelineFormProvider defaultValues={defaultValues} onSubmit={async () => {}} onSubmitError={() => {}}>
      <FormCapture formRef={formRef} />
      <Applications />
    </CreateCDPipelineFormProvider>
  );
  return { formRef, ...utils };
};

describe("CreateCDPipelineWizard Applications", () => {
  beforeEach(() => {
    mockUseCodebaseWatchList.mockReset();
    mockUseCodebaseBranchWatchList.mockReset();
    mockUseCodebaseWatchList.mockReturnValue({
      data: { array: [buildCodebase("app-a"), buildCodebase("app-b")] },
      query: { isLoading: false },
    });
    mockUseCodebaseBranchWatchList.mockReturnValue({
      data: { array: [] },
      query: { isLoading: true },
    });
  });

  describe("Bug 1: handleApplicationsChange — value-based filter on app removal", () => {
    it("keeps inputDockerStreams in 1:1 alignment when removing an app whose appBranch was cleared (stale stream entry)", () => {
      // Realistic precondition: both apps auto-init their branches (fieldArray and
      // inputDockerStreams both length 2), then the user clears app-b's branch via
      // the FormCombobox. The per-card listener early-returns on empty values, so
      // inputDockerStreams retains the stale "app-b-main" entry while fieldArray[1].appBranch
      // is "". The bug is what happens next, when the user removes app-b entirely.
      const { formRef } = renderApplications({
        name: "",
        applications: ["app-a", "app-b"],
        inputDockerStreams: ["app-a-main", "app-b-main"],
        ui_applicationsFieldArray: [
          { appName: "app-a", appBranch: "app-a-main" },
          { appName: "app-b", appBranch: "" },
        ],
        ui_applicationsToPromoteAll: false,
        description: "",
        deploymentType: "container",
        applicationsToPromote: [],
      });

      const form = formRef.current!;
      act(() => {
        form.setFieldValue("applications", ["app-a"]);
      });

      const fieldArray = form.getFieldValue("ui_applicationsFieldArray");
      const inputDockerStreams = form.getFieldValue("inputDockerStreams") as string[];

      expect(fieldArray).toHaveLength(1);
      expect(inputDockerStreams).toHaveLength(1);
      expect(inputDockerStreams[0]).toBe("app-a-main");
    });

    it("preserves the remaining app's branch when two apps shared the same appBranch value", () => {
      const { formRef } = renderApplications({
        name: "",
        applications: ["app-a", "app-b"],
        inputDockerStreams: ["shared-main", "shared-main"],
        ui_applicationsFieldArray: [
          { appName: "app-a", appBranch: "shared-main" },
          { appName: "app-b", appBranch: "shared-main" },
        ],
        ui_applicationsToPromoteAll: false,
        description: "",
        deploymentType: "container",
        applicationsToPromote: [],
      });

      const form = formRef.current!;
      act(() => {
        form.setFieldValue("applications", ["app-a"]);
      });

      const fieldArray = form.getFieldValue("ui_applicationsFieldArray");
      const inputDockerStreams = form.getFieldValue("inputDockerStreams") as string[];

      expect(fieldArray).toHaveLength(1);
      expect(inputDockerStreams).toEqual(["shared-main"]);
    });
  });

  describe("Bug 2: ApplicationCard auto-init effect writes positionally", () => {
    it("writes the auto-selected branch to inputDockerStreams[index] (not append) when only the second app's branches have resolved", async () => {
      mockUseCodebaseBranchWatchList.mockImplementation((opts: { labels: Record<string, string> }) => {
        const codebase = opts.labels[codebaseLabelKey];
        if (codebase === "app-b") {
          return {
            data: { array: [buildBranch("app-b", "main")] },
            query: { isLoading: false },
          };
        }
        return {
          data: { array: [] },
          query: { isLoading: true },
        };
      });

      const { formRef } = renderApplications({
        name: "",
        applications: ["app-a", "app-b"],
        inputDockerStreams: [],
        ui_applicationsFieldArray: [
          { appName: "app-a", appBranch: "" },
          { appName: "app-b", appBranch: "" },
        ],
        ui_applicationsToPromoteAll: false,
        description: "",
        deploymentType: "container",
        applicationsToPromote: [],
      });

      await act(async () => {
        await Promise.resolve();
      });

      const form = formRef.current!;
      const inputDockerStreams = form.getFieldValue("inputDockerStreams") as string[];

      expect(inputDockerStreams[1]).toBe("app-b-main");
      expect(inputDockerStreams[0] ?? "").toBe("");
    });
  });
});
