import { Button } from "@/core/components/ui/button";
import React from "react";
import { useForm } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import { WidgetType } from "../../types";
import { useCurrentDialog } from "../../providers/CurrentDialog/hooks";
import { useCodebaseWatchList } from "@/k8s/api/groups/KRCI/Codebase";
import { codebaseLabels, codebaseType } from "@my-project/shared";
import { mapArrayToSelectOptions } from "@/core/utils/forms/mapToSelectOptions";
import { ErrorContent } from "@/core/components/ErrorContent";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { FormCombobox } from "@/core/providers/Form/components/FormCombobox";
import { RefPortal } from "@/core/components/RefPortal";

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

  const form = useForm({
    mode: "onChange",
    defaultValues: {
      appName: "",
    },
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
    const newWidget = {
      type: widgetType,
      data: form.getValues(),
      id: uuidv4(),
    };
    setUserWidgets([...(userWidgets || []), newWidget]);
    closeDialog();
  }, [closeDialog, form, setUserWidgets, userWidgets, widgetType]);

  const appNameFieldValue = form.watch("appName");

  return (
    <>
      <LoadingWrapper isLoading={codebaseListWatch.query.isFetching}>
        {codebaseListWatch.query.error && <ErrorContent error={codebaseListWatch.query.error} />}

        <FormCombobox
          {...form.register("appName")}
          control={form.control}
          placeholder={"Select Application"}
          options={codebasesOptions}
          errors={form.formState.errors}
        />
      </LoadingWrapper>
      <RefPortal containerRef={addButtonContainerRef}>
        <Button variant="default" onClick={handleAddButtonClick} disabled={!appNameFieldValue}>
          add
        </Button>
      </RefPortal>
    </>
  );
};
