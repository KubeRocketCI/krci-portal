import { Box, Button, Chip, Dialog, DialogContent, DialogTitle, Stack, Tooltip } from "@mui/material";
import { Check, CircleX, X } from "lucide-react";
import { FormProvider, useForm } from "react-hook-form";
import { useShallow } from "zustand/react/shallow";
import { DialogProps } from "../../providers/Dialog/types";
import { FormTextField } from "../../providers/Form/components/FormTextField";
import { FORM_CONTROL_LABEL_HEIGHT } from "../../providers/Form/constants";
import { useClusterStore } from "../../store";

type NamespacesDialogProps = DialogProps<object>;

const names = {
  DEFAULT_NAMESPACE: "defaultNamespace",
  ALLOWED_NAMESPACES: "allowedNamespaces",
  ALLOWED_NAMESPACES_INPUT: "allowedNamespacesInput",
} as const;

export default function NamespacesDialog({ state }: NamespacesDialogProps) {
  const { open, closeDialog } = state;

  const clusterStore = useClusterStore(
    useShallow((state) => ({
      defaultNamespace: state.defaultNamespace,
      setDefaultNamespace: state.setDefaultNamespace,
      allowedNamespaces: state.allowedNamespaces,
      setAllowedNamespaces: state.setAllowedNamespaces,
    }))
  );

  const form = useForm<{
    [names.DEFAULT_NAMESPACE]: string;
    [names.ALLOWED_NAMESPACES]: string[];
    [names.ALLOWED_NAMESPACES_INPUT]: string;
  }>({
    mode: "onBlur",
    defaultValues: {
      defaultNamespace: clusterStore.defaultNamespace,
      allowedNamespaces: clusterStore.allowedNamespaces,
    },
  });

  console.log(form.formState.errors);

  const allowedNamespaces = form.watch(names.ALLOWED_NAMESPACES) || [];

  const handleAdd = () => {
    const newNamespace = form.getValues(names.ALLOWED_NAMESPACES_INPUT);
    if (newNamespace && !allowedNamespaces.includes(newNamespace)) {
      form.setValue(names.ALLOWED_NAMESPACES, [...allowedNamespaces, newNamespace]);
      form.setValue(names.ALLOWED_NAMESPACES_INPUT, "");
    }
  };

  const handleDelete = (namespace: string) => {
    const updatedNamespaces = allowedNamespaces.filter((ns) => ns !== namespace);
    form.setValue(names.ALLOWED_NAMESPACES, updatedNamespaces);
  };

  const allowedNamespacesInputError = form.formState.errors[names.ALLOWED_NAMESPACES_INPUT]?.message;
  const allowedNamespacesInputValue = form.watch(names.ALLOWED_NAMESPACES_INPUT);

  return (
    <Dialog open={open} onClose={closeDialog} maxWidth="sm" fullWidth>
      <DialogTitle>Namespaces</DialogTitle>
      <DialogContent>
        <FormProvider {...form}>
          <Stack spacing={2}>
            <FormTextField
              {...form.register(names.DEFAULT_NAMESPACE, {
                required: "Enter a default namespace.",
                pattern: {
                  value: /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/,
                  message: "Invalid namespace format.",
                },
              })}
              placeholder={"Enter a default namespace"}
              label={"Default Namespace"}
              // @ts-expect-error temporary fix
              control={form.control}
              errors={form.formState.errors}
              TextFieldProps={{
                helperText: "The default namespace for e.g. when applying resources (when not specified directly).",
              }}
              InputProps={{
                startAdornment: (
                  <Box sx={{ mr: 0.5 }}>
                    {form.formState.errors[names.DEFAULT_NAMESPACE] ? (
                      <CircleX className="size-4" />
                    ) : (
                      <Check className="size-4" />
                    )}
                  </Box>
                ),
              }}
            />
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} alignItems="center" width="100%">
                <Box flexGrow={1}>
                  <FormTextField
                    {...form.register(names.ALLOWED_NAMESPACES_INPUT, {
                      required: "Enter a valid namespace.",
                      pattern: {
                        value: /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/,
                        message: "Invalid namespace format.",
                      },
                      validate: (value) => {
                        if (allowedNamespaces.includes(value)) {
                          return "Namespace already set.";
                        }
                        return true;
                      },
                    })}
                    // @ts-expect-error temporary fix
                    control={form.control}
                    label="Allowed namespaces"
                    placeholder="Type a namespace"
                    errors={form.formState.errors}
                    TextFieldProps={{
                      autoComplete: "off",
                      fullWidth: true,
                      helperText: "The list of namespaces you are allowed to access in this cluster.",
                    }}
                  />
                </Box>
                <Box sx={{ pt: (t) => t.typography.pxToRem(FORM_CONTROL_LABEL_HEIGHT) }}>
                  <Tooltip title="Add Namespace">
                    <Button
                      onClick={handleAdd}
                      size="small"
                      disabled={!!allowedNamespacesInputError || !allowedNamespacesInputValue}
                    >
                      add
                    </Button>
                  </Tooltip>
                </Box>
              </Stack>

              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {allowedNamespaces.map((namespace) => (
                  <Chip
                    key={namespace}
                    label={namespace}
                    color="primary"
                    onDelete={() => handleDelete(namespace)}
                    deleteIcon={<X className="size-4" />}
                    size="small"
                  />
                ))}
              </Box>
            </Stack>
          </Stack>
          <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ mt: 2 }}>
            <Button
              size="small"
              color="inherit"
              onClick={() => {
                closeDialog();
                form.reset();
              }}
            >
              Cancel
            </Button>
            <Button
              variant={"contained"}
              color={"primary"}
              size="small"
              onClick={() => {
                clusterStore.setDefaultNamespace(form.getValues(names.DEFAULT_NAMESPACE));
                clusterStore.setAllowedNamespaces(form.getValues(names.ALLOWED_NAMESPACES));
                closeDialog();
              }}
              disabled={!form.formState.isDirty}
            >
              Save
            </Button>
          </Stack>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}

NamespacesDialog.displayName = "NamespacesDialog";
