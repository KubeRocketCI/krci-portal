import { Button } from "@/core/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/core/components/ui/dialog";
import { useMemo, useState } from "react";
import { BookmarkIcon } from "lucide-react";
import { ComboboxWithInput } from "@/core/components/ui/combobox-with-input";
import { ComboboxMultipleWithInput } from "@/core/components/ui/combobox-multiple-with-input";
import { FormField } from "@/core/components/ui/form-field";
import { useShallow } from "zustand/react/shallow";
import { DialogProps } from "../../providers/Dialog/types";
import { useClusterStore } from "../../../k8s/store";
import { LOCAL_STORAGE_SERVICE } from "../../services/local-storage";

type NamespacesDialogProps = DialogProps<object>;

const LOCAL_STORAGE_KEY = "cluster_settings";

const NAMESPACE_PATTERN = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/;

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

  // Local state for form values
  const [defaultNamespaceValue, setDefaultNamespaceValue] = useState(clusterStore.defaultNamespace);
  const [allowedNamespacesValue, setAllowedNamespacesValue] = useState(clusterStore.allowedNamespaces);

  // Validation errors
  const [defaultNamespaceError, setDefaultNamespaceError] = useState<string | undefined>();
  const [allowedNamespacesError, setAllowedNamespacesError] = useState<string | undefined>();

  const clusterSettings = useMemo(() => {
    const settings = LOCAL_STORAGE_SERVICE.getItem(LOCAL_STORAGE_KEY) || {};
    return settings[clusterStore.clusterName] || {};
  }, [clusterStore.clusterName]);

  const savedDefaultNamespaces = useMemo(
    () => clusterSettings.saved_default_namespaces || [],
    [clusterSettings.saved_default_namespaces]
  );
  const savedAllowedNamespaces = useMemo(
    () => clusterSettings.saved_allowed_namespaces || [],
    [clusterSettings.saved_allowed_namespaces]
  );

  const savedDefaultNamespacesSet = useMemo(() => new Set(savedDefaultNamespaces), [savedDefaultNamespaces]);
  const savedAllowedNamespacesSet = useMemo(() => new Set(savedAllowedNamespaces), [savedAllowedNamespaces]);

  const allowedNamespaceSet = useMemo(() => {
    const set = new Set<string>(savedAllowedNamespaces);
    if (clusterStore.defaultNamespace && !set.has(clusterStore.defaultNamespace)) {
      set.add(clusterStore.defaultNamespace);
    }
    return set;
  }, [savedAllowedNamespaces, clusterStore.defaultNamespace]);

  const allowedNamespaceOptions = useMemo(
    () =>
      Array.from(allowedNamespaceSet).map((ns) => {
        const isSaved = savedAllowedNamespacesSet.has(ns);
        return {
          value: ns,
          label: isSaved ? (
            <>
              <BookmarkIcon size={14} className="text-muted-foreground mr-2 shrink-0" />
              <span className="truncate">{ns}</span>
            </>
          ) : (
            ns
          ),
        };
      }),
    [allowedNamespaceSet, savedAllowedNamespacesSet]
  );

  // Update default namespace options to exclude currently selected value
  const defaultNamespaceOptions = useMemo(
    () =>
      savedDefaultNamespaces
        .filter((ns: string) => ns !== defaultNamespaceValue)
        .map((ns: string) => {
          const isSaved = savedDefaultNamespacesSet.has(ns);
          return {
            value: ns,
            label: isSaved ? (
              <>
                <BookmarkIcon size={14} className="text-muted-foreground mr-2 shrink-0" />
                <span className="truncate">{ns}</span>
              </>
            ) : (
              ns
            ),
          };
        }),
    [savedDefaultNamespaces, defaultNamespaceValue, savedDefaultNamespacesSet]
  );

  const validateDefaultNamespace = (value: string): string | undefined => {
    if (!value) {
      return "Enter a default namespace.";
    }
    if (!NAMESPACE_PATTERN.test(value)) {
      return "Invalid namespace format.";
    }
    return undefined;
  };

  const validateAllowedNamespaces = (values: string[]): string | undefined => {
    const invalidNamespaces = values.filter((ns) => !NAMESPACE_PATTERN.test(ns));
    if (invalidNamespaces.length > 0) {
      return `Invalid namespace format: ${invalidNamespaces.join(", ")}`;
    }
    return undefined;
  };

  const handleDefaultNamespaceChange = (value: string) => {
    setDefaultNamespaceValue(value);
    setDefaultNamespaceError(validateDefaultNamespace(value));
  };

  const handleAllowedNamespacesChange = (values: string[]) => {
    setAllowedNamespacesValue(values);
    setAllowedNamespacesError(validateAllowedNamespaces(values));
  };

  const isDirty =
    defaultNamespaceValue !== clusterStore.defaultNamespace ||
    JSON.stringify(allowedNamespacesValue) !== JSON.stringify(clusterStore.allowedNamespaces);

  const hasErrors = !!defaultNamespaceError || !!allowedNamespacesError;

  const handleSave = () => {
    // Validate before save
    const defaultNsError = validateDefaultNamespace(defaultNamespaceValue);
    const allowedNsError = validateAllowedNamespaces(allowedNamespacesValue);

    setDefaultNamespaceError(defaultNsError);
    setAllowedNamespacesError(allowedNsError);

    if (defaultNsError || allowedNsError) {
      return;
    }

    clusterStore.setDefaultNamespace(defaultNamespaceValue);
    clusterStore.setAllowedNamespaces(allowedNamespacesValue);

    const settings = LOCAL_STORAGE_SERVICE.getItem(LOCAL_STORAGE_KEY) || {};

    const allDefaultNamespaces = new Set(
      [...savedDefaultNamespaces, clusterStore.defaultNamespace, defaultNamespaceValue].filter(Boolean)
    );
    const updatedSavedDefaultNamespaces = Array.from(allDefaultNamespaces);

    const allAllowedNamespaces = new Set([...savedAllowedNamespaces, ...allowedNamespacesValue].filter(Boolean));
    const updatedSavedAllowedNamespaces = Array.from(allAllowedNamespaces);

    settings[clusterStore.clusterName] = {
      ...(settings[clusterStore.clusterName] || {}),
      default_namespace: defaultNamespaceValue,
      allowed_namespaces: allowedNamespacesValue,
      saved_default_namespaces: updatedSavedDefaultNamespaces,
      saved_allowed_namespaces: updatedSavedAllowedNamespaces,
    };

    LOCAL_STORAGE_SERVICE.setItem(LOCAL_STORAGE_KEY, settings);

    closeDialog();
  };

  const handleClose = () => {
    // Reset to original values on close
    setDefaultNamespaceValue(clusterStore.defaultNamespace);
    setAllowedNamespacesValue(clusterStore.allowedNamespaces);
    setDefaultNamespaceError(undefined);
    setAllowedNamespacesError(undefined);
    closeDialog();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="w-full max-w-2xl">
        <DialogHeader>
          <DialogTitle>Namespaces</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="flex flex-col gap-4">
            <FormField
              label="Default Namespace"
              helperText="The default namespace for e.g. when applying resources (when not specified directly)."
              error={defaultNamespaceError}
            >
              <ComboboxWithInput
                value={defaultNamespaceValue}
                onValueChange={handleDefaultNamespaceChange}
                options={defaultNamespaceOptions}
                placeholder="Enter or select a default namespace"
                invalid={!!defaultNamespaceError}
              />
            </FormField>
            <FormField
              label="Allowed namespaces"
              helperText="The list of namespaces you are allowed to access in this cluster."
              error={allowedNamespacesError}
            >
              <ComboboxMultipleWithInput
                value={allowedNamespacesValue}
                onValueChange={handleAllowedNamespacesChange}
                options={allowedNamespaceOptions}
                placeholder="Type or select namespaces"
                invalid={!!allowedNamespacesError}
                getChipLabel={(value) => value}
              />
            </FormField>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button size="sm" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="default" size="sm" onClick={handleSave} disabled={!isDirty || hasErrors}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

NamespacesDialog.displayName = "NamespacesDialog";
