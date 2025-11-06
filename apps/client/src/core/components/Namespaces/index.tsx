import { Button } from "@/core/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/core/components/ui/dialog";
import { FormProvider, useForm } from "react-hook-form";
import { BookmarkIcon } from "lucide-react";
import { FormCombobox } from "@/core/providers/Form/components/FormCombobox";
import { FormComboboxMultipleFreeSolo } from "@/core/providers/Form/components/FormComboboxMultipleFreeSolo";
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
  }, [clusterStore.clusterName]);

  const savedDefaultNamespaces = useMemo(
    () => clusterSettings.saved_default_namespaces || [],
    [clusterSettings.saved_default_namespaces]
  );
  const savedAllowedNamespaces = useMemo(
    () => clusterSettings.saved_allowed_namespaces || [],
    [clusterSettings.saved_allowed_namespaces]
  );

  const defaultNamespace = clusterStore.defaultNamespace;

  const savedDefaultNamespacesSet = useMemo(() => new Set(savedDefaultNamespaces), [savedDefaultNamespaces]);

  const savedAllowedNamespacesSet = useMemo(() => new Set(savedAllowedNamespaces), [savedAllowedNamespaces]);

  const allowedNamespaceSet = useMemo(() => {
    const set = new Set<string>(savedAllowedNamespaces);
    if (defaultNamespace && !set.has(defaultNamespace)) {
      set.add(defaultNamespace);
    }
    return set;
  }, [savedAllowedNamespaces, defaultNamespace]);

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

  const form = useForm<FormValues>({
    mode: "onBlur",
    values: {
      defaultNamespace: clusterStore.defaultNamespace,
      allowedNamespaces: clusterStore.allowedNamespaces,
    },
  });

  // Watch form value to update options when default namespace changes
  const currentDefaultNamespace = form.watch(names.DEFAULT_NAMESPACE);

  // Update default namespace options to exclude currently selected value
  const defaultNamespaceOptionsWithExclusion = useMemo(
    () =>
      savedDefaultNamespaces
        .filter((ns: string) => ns !== currentDefaultNamespace) // Exclude currently selected
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
    [savedDefaultNamespaces, currentDefaultNamespace, savedDefaultNamespacesSet]
  );

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
    <FormProvider {...form}>
      <Dialog open={open} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="w-full max-w-2xl">
          <DialogHeader>
            <DialogTitle>Namespaces</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <div className="flex flex-col gap-4">
              <FormCombobox
                name={names.DEFAULT_NAMESPACE}
                control={form.control}
                errors={form.formState.errors}
                label="Default Namespace"
                placeholder="Enter or select a default namespace"
                helperText="The default namespace for e.g. when applying resources (when not specified directly)."
                options={defaultNamespaceOptionsWithExclusion}
                freeSolo
                rules={{
                  required: "Enter a default namespace.",
                  pattern: {
                    value: /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/,
                    message: "Invalid namespace format.",
                  },
                }}
              />
              <FormComboboxMultipleFreeSolo
                name={names.ALLOWED_NAMESPACES}
                control={form.control}
                errors={form.formState.errors}
                label="Allowed namespaces"
                placeholder="Type or select namespaces"
                helperText="The list of namespaces you are allowed to access in this cluster."
                options={allowedNamespaceOptions}
                getChipLabel={(value) => value}
                rules={{
                  validate: (value: string | string[]) => {
                    if (!Array.isArray(value)) return true;
                    const invalidNamespaces = value.filter((ns) => !/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/.test(ns));
                    if (invalidNamespaces.length > 0) {
                      return `Invalid namespace format: ${invalidNamespaces.join(", ")}`;
                    }
                    return true;
                  },
                }}
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button size="sm" variant="ghost" onClick={closeDialog}>
              Cancel
            </Button>
            <Button variant="default" size="sm" onClick={handleSave} disabled={!form.formState.isDirty}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </FormProvider>
  );
}

NamespacesDialog.displayName = "NamespacesDialog";
