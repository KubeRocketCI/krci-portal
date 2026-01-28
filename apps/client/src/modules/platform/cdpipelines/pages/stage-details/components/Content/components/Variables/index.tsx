import { Button } from "@/core/components/ui/button";
import React from "react";
import { useVariablesConfigMapWatch } from "../../../../hooks";
import { Input } from "@/core/components/ui/input";
import { EmptyList } from "@/core/components/EmptyList";
import { Plus, Trash } from "lucide-react";
import { LearnMoreLink } from "@/core/components/LearnMoreLink";
import { TabSection } from "@/core/components/TabSection";
import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";
import { NameValueTable } from "@/core/components/NameValueTable";
import { useConfigMapPermissions } from "@/k8s/api/groups/Core/ConfigMap";

type Variable = {
  key: string;
  value: string;
};

export const Variables = () => {
  // const params = routeStageDetails.useParams();
  // const {
  //   editConfigMap,
  //   mutations: { configMapEditMutation },
  // } = useConfigMapCRUD({});

  const variablesConfigMapWatch = useVariablesConfigMapWatch();
  const configMapPermissions = useConfigMapPermissions();

  const variablesConfigMap = variablesConfigMapWatch.query.data;

  const dataEntries = Object.entries<string>(variablesConfigMap?.data || {});

  const initialVariables = React.useMemo(
    () =>
      dataEntries.map(([key, value]) => ({
        key,
        value,
      })),
    [dataEntries]
  );

  const [variables, setVariables] = React.useState<Variable[]>(initialVariables);

  // Update variables when dataEntries changes
  React.useEffect(() => {
    setVariables(initialVariables);
  }, [initialVariables]);

  const isDirty = React.useMemo(() => {
    if (variables.length !== dataEntries.length) return true;
    return variables.some((v, index) => {
      const [originalKey, originalValue] = dataEntries[index] || ["", ""];
      return v.key !== originalKey || v.value !== originalValue;
    });
  }, [variables, dataEntries]);

  const handleDelete = React.useCallback((index: number) => {
    setVariables((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleKeyChange = React.useCallback((index: number, newKey: string) => {
    setVariables((prev) => prev.map((v, i) => (i === index ? { ...v, key: newKey } : v)));
  }, []);

  const handleValueChange = React.useCallback((index: number, newValue: string) => {
    setVariables((prev) => prev.map((v, i) => (i === index ? { ...v, value: newValue } : v)));
  }, []);

  const onSubmit = React.useCallback(() => {
    const configMapCopy = { ...variablesConfigMap };
    configMapCopy.data = variables.reduce<Record<string, string>>((acc, { key, value }) => {
      if (key.trim()) {
        acc[key] = value;
      }
      return acc;
    }, {});

    // editConfigMap({ configMapData: configMapCopy });
    // Reset state to match new data (simulating successful save)
    setVariables(
      Object.entries(configMapCopy.data).map(([key, value]) => ({
        key,
        value,
      }))
    );
  }, [variablesConfigMap, variables]);

  const appendNewRow = React.useCallback(() => {
    setVariables((prev) => [...prev, { key: "", value: "" }]);
  }, []);

  const handleReset = React.useCallback(() => {
    setVariables(initialVariables);
  }, [initialVariables]);

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
              undo changes
            </Button>
            <Button
              size="sm"
              variant="default"
              // disabled={configMapEditMutation.isLoading || !isDirty}
              onClick={onSubmit}
            >
              save
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
          linkText="Click here to add a new variable."
        />
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- permission fields omitted to avoid unnecessary callback recreation
  }, [
    appendNewRow,
    dataEntries?.length,
    variables,
    handleDelete,
    handleKeyChange,
    handleValueChange,
    isDirty,
    onSubmit,
    handleReset,
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
      {renderContent()}
    </TabSection>
  );
};
