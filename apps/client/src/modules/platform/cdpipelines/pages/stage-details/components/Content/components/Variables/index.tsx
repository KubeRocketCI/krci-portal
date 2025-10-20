import { Button, IconButton, Stack, Typography } from "@mui/material";
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
          <Stack spacing={4}>
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
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <FormTextField
                        {...register(`variables.${index}.value`, {
                          required: "Enter a value",
                        })}
                        label={""}
                        placeholder={"Var value"}
                        control={control}
                        errors={errors}
                      />
                      <IconButton onClick={() => handleDelete(index)} size="small" data-test="delete">
                        <Trash size={16} />
                      </IconButton>
                    </Stack>
                  ),
                }))}
              />
            ) : (
              <EmptyList customText="Are you sure you want to save empty variable list?" />
            )}
            <Stack alignItems="flex-end" sx={{ pr: (t) => t.typography.pxToRem(16) }}>
              <Button
                type={"button"}
                size={"small"}
                component={"button"}
                style={{ minWidth: 0 }}
                onClick={appendNewRow}
                data-test="add"
              >
                <Plus size={16} />
              </Button>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ justifyContent: "flex-end" }}>
              <Button
                size="small"
                component={"button"}
                sx={{ ml: "auto !important" }}
                onClick={() => reset()}
                disabled={!isDirty}
              >
                undo changes
              </Button>
              <Button
                size={"small"}
                component={"button"}
                variant={"contained"}
                color={"primary"}
                // disabled={configMapEditMutation.isLoading || !isDirty}
                onClick={handleSubmit(onSubmit)}
              >
                save
              </Button>
            </Stack>
          </Stack>
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
          <Typography fontSize={28} color="primary.dark" component="span">
            Variables
          </Typography>{" "}
          <LearnMoreLink url={EDP_USER_GUIDE.VARIABLES_INJECTION.url} />
        </>
      }
    >
      <FormProvider {...form}>{renderContent()}</FormProvider>
    </TabSection>
  );
};
