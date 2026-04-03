import { Button } from "@/core/components/ui/button";
import React from "react";
import { useVariablesConfigMapWatch } from "../../../../hooks";
import { Input } from "@/core/components/ui/input";
import { EmptyList } from "@/core/components/EmptyList";
import { Plus, Trash } from "lucide-react";
import { NameValueTable } from "@/core/components/NameValueTable";
import { useConfigMapCRUD, useConfigMapPermissions } from "@/k8s/api/groups/Core/ConfigMap";
import { Card } from "@/core/components/ui/card";
import { LearnMoreLink } from "@/core/components/LearnMoreLink";
import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";
import { useAppForm } from "@/core/components/form";
import { useStore } from "@tanstack/react-form";

type Variable = {
  key: string;
  value: string;
};

type VariablesFormValues = {
  variables: Variable[];
};

export const Variables = () => {
  const variablesConfigMapWatch = useVariablesConfigMapWatch();
  const configMapPermissions = useConfigMapPermissions();
  const { triggerEditConfigMap, mutations } = useConfigMapCRUD();

  const variablesConfigMap = variablesConfigMapWatch.query.data;

  const dataEntries = React.useMemo(
    () => Object.entries<string>(variablesConfigMap?.data || {}),
    [variablesConfigMap?.data]
  );

  const configDataSnapshot = JSON.stringify(variablesConfigMap?.data ?? {});

  const initialVariables = React.useMemo(
    () =>
      dataEntries.map(([key, value]) => ({
        key,
        value,
      })),
    [dataEntries]
  );

  const form = useAppForm({
    defaultValues: {
      variables: initialVariables,
    } as VariablesFormValues,
    onSubmit: async ({ value, formApi }) => {
      if (!variablesConfigMap) {
        return;
      }

      const configMapCopy = {
        ...variablesConfigMap,
        data: (value.variables || []).reduce<Record<string, string>>((acc, { key, value: itemValue }) => {
          if (key.trim()) {
            acc[key] = itemValue;
          }
          return acc;
        }, {}),
      };

      await new Promise<void>((resolve, reject) => {
        triggerEditConfigMap({
          data: {
            resource: configMapCopy,
          },
          callbacks: {
            onSuccess: () => {
              const nextVariables = Object.entries(configMapCopy.data ?? {}).map(([key, itemValue]) => ({
                key,
                value: itemValue,
              }));
              formApi.reset({ variables: nextVariables });
              resolve();
            },
            onError: () => reject(new Error("Failed to save variables")),
          },
        });
      });
    },
  });

  const variables = useStore(form.store, (state) => state.values.variables || []);
  const isDirty = useStore(form.store, (state) => state.isDirty);
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);

  // Update variables when config map data changes (stable dependency to avoid infinite loop)
  React.useEffect(() => {
    form.reset({ variables: initialVariables });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- configDataSnapshot is stable dependency to avoid infinite loop
  }, [configDataSnapshot]);

  const updateVariables = React.useCallback(
    (updater: (prev: Variable[]) => Variable[]) => {
      const currentVariables = form.getFieldValue("variables") || [];
      form.setFieldValue("variables", updater(currentVariables));
    },
    [form]
  );

  const handleDelete = React.useCallback(
    (index: number) => {
      updateVariables((prev) => prev.filter((_, i) => i !== index));
    },
    [updateVariables]
  );

  const handleKeyChange = React.useCallback(
    (index: number, newKey: string) => {
      updateVariables((prev) => prev.map((v, i) => (i === index ? { ...v, key: newKey } : v)));
    },
    [updateVariables]
  );

  const handleValueChange = React.useCallback(
    (index: number, newValue: string) => {
      updateVariables((prev) => prev.map((v, i) => (i === index ? { ...v, value: newValue } : v)));
    },
    [updateVariables]
  );

  const onSubmit = React.useCallback(() => {
    form.handleSubmit();
  }, [form]);

  const appendNewRow = React.useCallback(() => {
    updateVariables((prev) => [...prev, { key: "", value: "" }]);
  }, [updateVariables]);

  const handleReset = React.useCallback(() => {
    form.reset();
  }, [form]);

  const renderContent = React.useCallback(() => {
    if (variables.length || dataEntries?.length) {
      return (
        <div className="flex flex-col gap-4">
          {variables.length ? (
            <NameValueTable
              rows={variables.map((variable, index) => ({
                name: (
                  <Input
                    value={variable.key}
                    onChange={(e) => handleKeyChange(index, e.target.value)}
                    placeholder="Var name"
                  />
                ),
                value: (
                  <div className="flex items-center gap-1">
                    <Input
                      value={variable.value}
                      onChange={(e) => handleValueChange(index, e.target.value)}
                      placeholder="Var value"
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
            <Button type="button" size="sm" variant="ghost" className="min-w-0" onClick={appendNewRow} data-test="add">
              <Plus size={16} />
            </Button>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={handleReset} disabled={!isDirty}>
              Undo Changes
            </Button>
            <Button
              size="sm"
              variant="default"
              disabled={mutations.configMapEditMutation.isPending || isSubmitting || !isDirty}
              onClick={onSubmit}
            >
              Save
            </Button>
          </div>
        </div>
      );
    }

    if (!dataEntries?.length) {
      if (!configMapPermissions.data.patch.allowed) {
        return <EmptyList customText="No variables found." beforeLinkText={configMapPermissions.data.patch.reason} />;
      }

      return (
        <EmptyList
          customText="No variables found."
          handleClick={appendNewRow}
          linkText="Add variable"
          actionVariant="button"
        />
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- permission fields omitted to avoid unnecessary callback recreation
  }, [
    appendNewRow,
    dataEntries?.length,
    form,
    variables,
    handleDelete,
    handleKeyChange,
    handleValueChange,
    isDirty,
    onSubmit,
    handleReset,
  ]);

  return (
    <Card className="p-6" data-tour="stage-variables">
      <h3 className="text-foreground mb-4 text-xl font-semibold">
        Variables <LearnMoreLink url={EDP_USER_GUIDE.VARIABLES_INJECTION.url} />
      </h3>
      {renderContent()}
    </Card>
  );
};
