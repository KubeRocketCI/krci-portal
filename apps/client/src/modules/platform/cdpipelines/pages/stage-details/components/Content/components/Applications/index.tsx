import { TabSection } from "@/core/components/TabSection";
import {
  CODEBASE_COMMON_BUILD_TOOLS,
  CODEBASE_COMMON_FRAMEWORKS,
  CODEBASE_COMMON_LANGUAGES,
} from "@/k8s/api/groups/KRCI/Codebase/configs/mappings";
import { getDeployedVersion } from "@my-project/shared";
import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import { ALL_VALUES_OVERRIDE_KEY, IMAGE_TAG_POSTFIX, VALUES_OVERRIDE_POSTFIX } from "../../../../constants";
import { useWatchStageAppCodebasesCombinedData } from "../../../../hooks";
import { ConfigurationTable } from "./components/ConfigurationTable";
import { ConfigurationTableActions } from "./components/ConfigurationTableActions";
import { PreviewTable } from "./components/PreviewTable";
import { PreviewTableActions } from "./components/PreviewTableActions";
import { applicationTableMode } from "./constants";
import { ApplicationsFormValues, ApplicationsTableMode } from "./types";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";

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
  const stageAppCodebasesCombinedDataWatch = useWatchStageAppCodebasesCombinedData();


  const baseDefaultValues = React.useMemo(
    () =>
      (stageAppCodebasesCombinedDataWatch.data?.stageAppCodebasesCombinedData || []).reduce<
        Record<string, boolean | string>
      >(
        (acc, cur) => {
          const {
            appCodebase: {
              spec: { lang, framework, buildTool },
              metadata: { name },
            },
            application,
          } = cur;

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

          acc[ALL_VALUES_OVERRIDE_KEY] = withValuesOverride;

          return acc;
        },
        {
          [ALL_VALUES_OVERRIDE_KEY]: false,
        }
      ),
    [stageAppCodebasesCombinedDataWatch.data?.stageAppCodebasesCombinedData]
  );

  const formState = useForm<ApplicationsFormValues>({
    defaultValues: baseDefaultValues as ApplicationsFormValues,
  });

  const [mode, setMode] = React.useState<ApplicationsTableMode>(applicationTableMode.preview);

  const toggleMode = React.useCallback(() => {
    setMode((prev) =>
      prev === applicationTableMode.preview ? applicationTableMode.configuration : applicationTableMode.preview
    );
  }, []);

  return (
    <FormProvider {...formState}>
      <TabSection
        title={
          <div className="flex flex-row gap-2 items-center">
            <h2 className="text-3xl font-semibold text-foreground">
              Applications
            </h2>
          </div>
        }
      >
        <LoadingWrapper isLoading={stageAppCodebasesCombinedDataWatch.isLoading}>
          <MemoizedApplicationsInner mode={mode} toggleMode={toggleMode} />
        </LoadingWrapper>
      </TabSection>
    </FormProvider>
  );
};
