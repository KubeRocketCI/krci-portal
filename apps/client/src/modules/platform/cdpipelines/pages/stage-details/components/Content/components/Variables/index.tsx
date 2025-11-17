import { Button } from "@/core/components/ui/button";
import React from "react";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { useVariablesConfigMapWatch } from "../../../../hooks";
import { FormTextField } from "@/core/providers/Form/components/FormTextField";
import { EmptyList } from "@/core/components/EmptyList";
import { Plus, Trash } from "lucide-react";
import { LearnMoreLink } from "@/core/components/LearnMoreLink";
import { TabSection } from "@/core/components/TabSection";
import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";
import { NameValueTable } from "@/core/components/NameValueTable";

export const Variables = () => {
  // const params = routeStageDetails.useParams();
  // const {
  //   editConfigMap,
  //   mutations: { configMapEditMutation },
  // } = useConfigMapCRUD({});

  const variablesConfigMapWatch = useVariablesConfigMapWatch();

  const variablesConfigMap = variablesConfigMapWatch.query.data;

  const dataEntries = Object.entries<string>(variablesConfigMap?.data || {});

  const defaultValues = {
    variables: dataEntries.map(([key, value]) => ({
      key,
      value,
    })),
  };

  const form = useForm({
    defaultValues,
  });

  const {
    register,
    control,
    formState: { errors, isDirty },
    reset,
    handleSubmit,
  } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "variables",
  });

  const handleDelete = React.useCallback(
    (index: number) => {
      remove(index);
    },
    [remove]
  );

  const onSubmit = React.useCallback(
    (values: { variables: { key: string; value: string }[] }) => {
      const configMapCopy = { ...variablesConfigMap };
      configMapCopy.data = values.variables.reduce<Record<string, string>>((acc, { key, value }) => {
        acc[key] = value;
        return acc;
      }, {});

      // editConfigMap({ configMapData: configMapCopy });
      reset(values, { keepValues: true });
    },
    [variablesConfigMap, reset]
  );

  const appendNewRow = React.useCallback(() => append({ key: "", value: "" }), [append]);

  const renderContent = React.useCallback(() => {
    if (fields.length || dataEntries?.length) {
      return (
        <form>
          <div className="flex flex-col gap-4">
            {fields.length ? (
              <NameValueTable
                rows={fields.map((_field, index) => ({
                  name: (
                    <FormTextField
                      {...register(`variables.${index}.key`, {
                        required: "Enter a key",
                      })}
                      placeholder={"Var name"}
                      label={""}
                      control={control}
                      errors={errors}
                    />
                  ),
                  value: (
                    <div className="flex items-center gap-1">
                      <FormTextField
                        {...register(`variables.${index}.value`, {
                          required: "Enter a value",
                        })}
                        label={""}
                        placeholder={"Var value"}
                        control={control}
                        errors={errors}
                      />
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(index)} data-test="delete">
                        <Trash size={16} />
                      </Button>
                    </div>
                  ),
                }))}
              />
            ) : (
              <EmptyList customText="Are you sure you want to save empty variable list?" />
            )}
            <div className="flex flex-col items-end pr-4">
              <Button
                type={"button"}
                size={"sm"}
                variant="ghost"
                className="min-w-0"
                onClick={appendNewRow}
                data-test="add"
              >
                <Plus size={16} />
              </Button>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => reset()} disabled={!isDirty}>
                undo changes
              </Button>
              <Button
                size={"sm"}
                variant={"default"}
                // disabled={configMapEditMutation.isLoading || !isDirty}
                onClick={handleSubmit(onSubmit)}
              >
                save
              </Button>
            </div>
          </div>
        </form>
      );
    }

    if (!dataEntries?.length) {
      return (
        <EmptyList
          customText="No variables found."
          handleClick={appendNewRow}
          linkText="Click here to add a new variable."
        />
      );
    }
  }, [
    appendNewRow,
    control,
    dataEntries?.length,
    errors,
    fields,
    handleDelete,
    handleSubmit,
    isDirty,
    onSubmit,
    register,
    reset,
  ]);

  return (
    <TabSection
      title={
        <>
          <span className="text-foreground text-3xl font-semibold">Variables</span>{" "}
          <LearnMoreLink url={EDP_USER_GUIDE.VARIABLES_INJECTION.url} />
        </>
      }
    >
      <FormProvider {...form}>{renderContent()}</FormProvider>
    </TabSection>
  );
};
