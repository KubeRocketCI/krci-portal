import { TabSection } from "@/core/components/TabSection";
import {
  CODEBASE_COMMON_BUILD_TOOLS,
  CODEBASE_COMMON_FRAMEWORKS,
  CODEBASE_COMMON_LANGUAGES,
} from "@/k8s/api/groups/KRCI/Codebase/configs/mappings";
import { getDeployedVersion } from "@my-project/shared";
import React from "react";
import { useForm } from "@tanstack/react-form";
import type { ReactFormExtendedApi, FormValidateOrFn, FormAsyncValidateOrFn } from "@tanstack/react-form";
import { ALL_VALUES_OVERRIDE_KEY, IMAGE_TAG_POSTFIX, VALUES_OVERRIDE_POSTFIX } from "../../../../constants";
import { usePipelineAppCodebasesWatch, useApplicationsWatch, createArgoApplicationsByNameMap } from "../../../../hooks";
import { ConfigurationTable } from "./components/ConfigurationTable";
import { ConfigurationTableActions } from "./components/ConfigurationTableActions";
import { PreviewTable } from "./components/PreviewTable";
import { PreviewTableActions } from "./components/PreviewTableActions";
import { applicationTableMode } from "./constants";
import { ApplicationsFormValues, ApplicationsTableMode } from "./types";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";

// Create context for Tanstack Form - properly typed with all validator parameters
type ApplicationsFormApi = ReactFormExtendedApi<
  ApplicationsFormValues, // TFormData
  FormValidateOrFn<ApplicationsFormValues> | undefined, // TOnMount
  FormValidateOrFn<ApplicationsFormValues> | undefined, // TOnChange
  FormAsyncValidateOrFn<ApplicationsFormValues> | undefined, // TOnChangeAsync
  FormValidateOrFn<ApplicationsFormValues> | undefined, // TOnBlur
  FormAsyncValidateOrFn<ApplicationsFormValues> | undefined, // TOnBlurAsync
  FormValidateOrFn<ApplicationsFormValues> | undefined, // TOnSubmit
  FormAsyncValidateOrFn<ApplicationsFormValues> | undefined, // TOnSubmitAsync
  FormValidateOrFn<ApplicationsFormValues> | undefined, // TOnDynamic
  FormAsyncValidateOrFn<ApplicationsFormValues> | undefined, // TOnDynamicAsync
  FormAsyncValidateOrFn<ApplicationsFormValues> | undefined, // TOnServer
  unknown // TSubmitMeta
>;

const ApplicationsFormContext = React.createContext<ApplicationsFormApi | null>(null);

export const useApplicationsForm = (): ApplicationsFormApi => {
  const context = React.useContext(ApplicationsFormContext);
  if (!context) {
    throw new Error("useApplicationsForm must be used within ApplicationsFormContext.Provider");
  }
  return context;
};

const MemoizedApplicationsInner = React.memo(
  ({ mode, toggleMode }: { mode: ApplicationsTableMode; toggleMode: () => void }) => {
    return (
      <>
        {mode === applicationTableMode.preview && (
          <>
            <PreviewTableActions toggleMode={toggleMode} />
            <PreviewTable />
          </>
        )}
        {mode === applicationTableMode.configuration && (
          <>
            <ConfigurationTableActions toggleMode={toggleMode} />
            <ConfigurationTable />
          </>
        )}
      </>
    );
  }
);

export const Applications = () => {
  const pipelineAppCodebasesWatch = usePipelineAppCodebasesWatch();
  const applicationsWatch = useApplicationsWatch();

  // Create map for quick lookup
  const argoAppsByName = React.useMemo(
    () => createArgoApplicationsByNameMap(applicationsWatch.data.array),
    [applicationsWatch.data.array]
  );

  const baseDefaultValues = React.useMemo(() => {
    const values = pipelineAppCodebasesWatch.data.reduce<Record<string, boolean | string>>((acc, appCodebase) => {
      const {
        spec: { lang, framework, buildTool },
        metadata: { name },
      } = appCodebase;

      const application = argoAppsByName.get(name);

      const isHelm =
        lang === CODEBASE_COMMON_LANGUAGES.HELM &&
        framework === CODEBASE_COMMON_FRAMEWORKS.HELM &&
        buildTool === CODEBASE_COMMON_BUILD_TOOLS.HELM;

      const withValuesOverride = application ? Object.hasOwn(application?.spec, "sources") : false;

      const deployedVersion = getDeployedVersion(withValuesOverride, isHelm, application);

      acc[`${name}${VALUES_OVERRIDE_POSTFIX}`] = withValuesOverride;

      if (deployedVersion !== "NaN") {
        acc[`${name}${IMAGE_TAG_POSTFIX}`] = deployedVersion;
      }

      return acc;
    }, {});

    // Calculate ALL_VALUES_OVERRIDE_KEY based on all apps
    const allAppsHaveValuesOverride = pipelineAppCodebasesWatch.data.every((appCodebase) => {
      const application = argoAppsByName.get(appCodebase.metadata.name);
      return application ? Object.hasOwn(application?.spec, "sources") : false;
    });

    values[ALL_VALUES_OVERRIDE_KEY] = allAppsHaveValuesOverride;

    return values;
  }, [pipelineAppCodebasesWatch.data, argoAppsByName]);

  const form = useForm({
    defaultValues: baseDefaultValues as ApplicationsFormValues,
  });

  const [mode, setMode] = React.useState<ApplicationsTableMode>(applicationTableMode.preview);

  const toggleMode = React.useCallback(() => {
    setMode((prev) =>
      prev === applicationTableMode.preview ? applicationTableMode.configuration : applicationTableMode.preview
    );
  }, []);

  const isLoading = pipelineAppCodebasesWatch.isLoading || applicationsWatch.isLoading;

  return (
    <ApplicationsFormContext.Provider value={form}>
      <TabSection
        title={
          <div className="flex flex-row items-center gap-2">
            <h2 className="text-foreground text-3xl font-semibold">Applications</h2>
          </div>
        }
      >
        <LoadingWrapper isLoading={isLoading}>
          <MemoizedApplicationsInner mode={mode} toggleMode={toggleMode} />
        </LoadingWrapper>
      </TabSection>
    </ApplicationsFormContext.Provider>
  );
};
