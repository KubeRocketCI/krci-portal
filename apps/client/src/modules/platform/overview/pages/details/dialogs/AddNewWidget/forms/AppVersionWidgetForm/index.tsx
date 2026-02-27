import { Button } from "@/core/components/ui/button";
import React from "react";
import { v4 as uuidv4 } from "uuid";
import { WidgetType } from "../../types";
import { useCurrentDialog } from "../../providers/CurrentDialog/hooks";
import { useCodebaseWatchList } from "@/k8s/api/groups/KRCI/Codebase";
import { codebaseLabels, codebaseType } from "@my-project/shared";
import { mapArrayToSelectOptions } from "@/core/utils/forms/mapToSelectOptions";
import { ErrorContent } from "@/core/components/ErrorContent";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { RefPortal } from "@/core/components/RefPortal";
import { useAppForm } from "@/core/components/form";
import { useStore } from "@tanstack/react-form";

interface AppVersionWidgetFormValues {
  appName: string;
}

export const AppVersionWidgetForm = ({
  widgetType,
  addButtonContainerRef,
}: {
  widgetType: WidgetType;
  addButtonContainerRef: React.RefObject<HTMLDivElement | null>;
}) => {
  const {
    state: { closeDialog },
    props: { userWidgets, setUserWidgets },
  } = useCurrentDialog();

  const form = useAppForm({
    defaultValues: {
      appName: "",
    } satisfies AppVersionWidgetFormValues,
  });

  const codebaseListWatch = useCodebaseWatchList({
    labels: {
      [codebaseLabels.codebaseType]: codebaseType.application,
    },
  });

  const codebasesOptions = React.useMemo(
    () => mapArrayToSelectOptions(codebaseListWatch.data.array.map((el) => el.metadata.name)),
    [codebaseListWatch.data.array]
  );

  const handleAddButtonClick = React.useCallback(() => {
    const values = form.store.state.values;
    const newWidget = {
      type: widgetType,
      data: values,
      id: uuidv4(),
    };
    setUserWidgets([...(userWidgets || []), newWidget]);
    closeDialog();
  }, [closeDialog, form.store.state.values, setUserWidgets, userWidgets, widgetType]);

  // Subscribe to appName field value (replaces watch)
  const appNameFieldValue = useStore(form.store, (state) => state.values.appName);

  return (
    <>
      <LoadingWrapper isLoading={codebaseListWatch.query.isFetching}>
        {codebaseListWatch.query.error && <ErrorContent error={codebaseListWatch.query.error} />}

        <form.AppField name="appName">
          {(field) => <field.FormCombobox placeholder="Select Application" options={codebasesOptions} />}
        </form.AppField>
      </LoadingWrapper>
      <RefPortal containerRef={addButtonContainerRef}>
        <Button variant="default" onClick={handleAddButtonClick} disabled={!appNameFieldValue}>
          add
        </Button>
      </RefPortal>
    </>
  );
};
