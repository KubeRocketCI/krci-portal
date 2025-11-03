import { Autocomplete, Button, Chip, Dialog, DialogContent, DialogTitle, TextField } from "@mui/material";
import { Check, CircleX, X } from "lucide-react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { useShallow } from "zustand/react/shallow";
import { DialogProps } from "../../providers/Dialog/types";
import { useClusterStore } from "../../../k8s/store";
import { LOCAL_STORAGE_SERVICE } from "../../services/local-storage";
import { useMemo } from "react";

type NamespacesDialogProps = DialogProps<object>;

const names = {
  DEFAULT_NAMESPACE: "defaultNamespace",
  ALLOWED_NAMESPACES: "allowedNamespaces",
} as const;

type FormValues = {
  [names.DEFAULT_NAMESPACE]: string;
  [names.ALLOWED_NAMESPACES]: string[];
};

const LOCAL_STORAGE_KEY = "cluster_settings";

export default function NamespacesDialog({ state }: NamespacesDialogProps) {
  const { open, closeDialog } = state;

  const clusterStore = useClusterStore(
    useShallow((state) => ({
      clusterName: state.clusterName,
      defaultNamespace: state.defaultNamespace,
      setDefaultNamespace: state.setDefaultNamespace,
      allowedNamespaces: state.allowedNamespaces,
      setAllowedNamespaces: state.setAllowedNamespaces,
    }))
  );

  const clusterSettings = useMemo(() => {
    const settings = LOCAL_STORAGE_SERVICE.getItem(LOCAL_STORAGE_KEY) || {};
    return settings[clusterStore.clusterName] || {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clusterStore.clusterName, open]);

  const savedDefaultNamespaces = clusterSettings.saved_default_namespaces || [];
  const savedAllowedNamespaces = clusterSettings.saved_allowed_namespaces || [];

  const form = useForm<FormValues>({
    mode: "onBlur",
    values: {
      defaultNamespace: clusterStore.defaultNamespace,
      allowedNamespaces: clusterStore.allowedNamespaces,
    },
  });

  const handleSave = () => {
    const defaultNamespace = form.getValues(names.DEFAULT_NAMESPACE);
    const allowedNamespaces = form.getValues(names.ALLOWED_NAMESPACES);

    clusterStore.setDefaultNamespace(defaultNamespace);
    clusterStore.setAllowedNamespaces(allowedNamespaces);

    const settings = LOCAL_STORAGE_SERVICE.getItem(LOCAL_STORAGE_KEY) || {};

    const allDefaultNamespaces = new Set(
      [...savedDefaultNamespaces, clusterStore.defaultNamespace, defaultNamespace].filter(Boolean)
    );
    const updatedSavedDefaultNamespaces = Array.from(allDefaultNamespaces);

    const allAllowedNamespaces = new Set([...savedAllowedNamespaces, ...allowedNamespaces].filter(Boolean));
    const updatedSavedAllowedNamespaces = Array.from(allAllowedNamespaces);

    settings[clusterStore.clusterName] = {
      ...(settings[clusterStore.clusterName] || {}),
      default_namespace: defaultNamespace,
      allowed_namespaces: allowedNamespaces,
      saved_default_namespaces: updatedSavedDefaultNamespaces,
      saved_allowed_namespaces: updatedSavedAllowedNamespaces,
    };

    LOCAL_STORAGE_SERVICE.setItem(LOCAL_STORAGE_KEY, settings);

    closeDialog();
  };

  return (
    <Dialog open={open} onClose={closeDialog} maxWidth="sm" fullWidth>
      <DialogTitle>Namespaces</DialogTitle>
      <DialogContent>
        <FormProvider {...form}>
          <div className="flex flex-col gap-4">
            <Controller
              name={names.DEFAULT_NAMESPACE}
              control={form.control}
              rules={{
                required: "Enter a default namespace.",
                pattern: {
                  value: /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/,
                  message: "Invalid namespace format.",
                },
              }}
              render={({ field, fieldState }) => (
                <Autocomplete
                  freeSolo
                  options={savedDefaultNamespaces}
                  value={field.value || ""}
                  onInputChange={(_event, newInputValue) => {
                    field.onChange(newInputValue);
                  }}
                  onChange={(_event, newValue) => {
                    if (typeof newValue === "string") {
                      field.onChange(newValue);
                    }
                  }}
                  getOptionDisabled={(option) => option === clusterStore.defaultNamespace}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      variant="standard"
                      label="Default Namespace"
                      placeholder="Enter or select a default namespace"
                      error={!!fieldState.error}
                      helperText={
                        fieldState.error?.message ||
                        "The default namespace for e.g. when applying resources (when not specified directly)."
                      }
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <div className="mr-2">
                              {fieldState.error ? <CircleX className="size-4" /> : <Check className="size-4" />}
                            </div>
                            {params.InputProps.startAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              )}
            />
            <Controller
              name={names.ALLOWED_NAMESPACES}
              control={form.control}
              render={({ field }) => (
                <Autocomplete
                  multiple
                  freeSolo
                  options={savedAllowedNamespaces}
                  value={field.value || []}
                  onChange={(_event, newValue) => {
                    const namespaces = newValue.filter((ns) => {
                      return /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/.test(ns);
                    });

                    field.onChange(namespaces);
                  }}
                  getOptionDisabled={(option) => {
                    const currentValues = field.value || [];
                    return currentValues.includes(option);
                  }}
                  renderTags={(value: readonly string[], getTagProps) =>
                    value.map((namespace: string, index: number) => {
                      const { key, ...tagProps } = getTagProps({ index });
                      return (
                        <Chip
                          key={key}
                          {...tagProps}
                          label={String(namespace)}
                          color="primary"
                          size="small"
                          deleteIcon={<X className="size-4" />}
                        />
                      );
                    })
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      variant="standard"
                      label="Allowed namespaces"
                      placeholder="Type or select namespaces"
                      helperText="The list of namespaces you are allowed to access in this cluster."
                    />
                  )}
                />
              )}
            />
          </div>
          <div className="flex flex-row justify-end gap-2" style={{ marginTop: "16px" }}>
            <Button size="small" color="inherit" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              variant={"contained"}
              color={"primary"}
              size="small"
              onClick={handleSave}
              disabled={!form.formState.isDirty}
            >
              Save
            </Button>
          </div>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}

NamespacesDialog.displayName = "NamespacesDialog";
