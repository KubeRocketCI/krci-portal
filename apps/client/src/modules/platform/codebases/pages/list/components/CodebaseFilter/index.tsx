import { NamespaceAutocomplete, Select, SelectOption, TextField } from "@/core/components/form";
import { Button } from "@/core/components/ui/button";
import { codebaseType } from "@my-project/shared";
import { CODEBASE_LIST_FILTER_NAMES } from "./constants";
import { useCodebaseFilter } from "./hooks/useFilter";
import { useClusterStore } from "@/k8s/store";
import React from "react";
import { useShallow } from "zustand/react/shallow";
import { Label } from "@/core/components/ui/label";
import { Plus, X } from "lucide-react";
import { routeComponentList } from "../../route";
import { useCodebasePermissions } from "@/k8s/api/groups/KRCI/Codebase";
import { useGitServerWatchList } from "@/k8s/api/groups/KRCI/GitServer";
import { ButtonWithPermission } from "@/core/components/ButtonWithPermission";
import { routeCodebaseCreate } from "../../../create/route";
import { Link } from "@tanstack/react-router";

const codebaseTypeOptions: SelectOption[] = [
  { label: "All", value: "all" },
  ...Object.entries(codebaseType).map(([key, value]) => ({
    label: value,
    value: key,
  })),
];

export const CodebaseFilter = () => {
  const { clusterName } = routeComponentList.useParams();

  const { form, reset } = useCodebaseFilter();

  const allowedNamespaces = useClusterStore(useShallow((state) => state.allowedNamespaces));
  const showNamespaceFilter = allowedNamespaces.length > 1;

  const namespaceOptions = React.useMemo(() => allowedNamespaces, [allowedNamespaces]);

  const codebasePermissions = useCodebasePermissions();

  const gitServerListWatch = useGitServerWatchList();

  const noGitServers = gitServerListWatch.isEmpty;

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-4">
        <div className="w-64">
          <form.Field name={CODEBASE_LIST_FILTER_NAMES.SEARCH}>
            {(field) => <TextField field={field} label="Search" placeholder="Search components" />}
          </form.Field>
        </div>

        <div className="w-64">
          <form.Field name={CODEBASE_LIST_FILTER_NAMES.CODEBASE_TYPE}>
            {(field) => (
              <Select field={field} label="Codebase Type" options={codebaseTypeOptions} placeholder="Select type" />
            )}
          </form.Field>
        </div>

        {showNamespaceFilter && (
          <div className="w-[400px]">
            <form.Field name={CODEBASE_LIST_FILTER_NAMES.NAMESPACES}>
              {(field) => (
                <NamespaceAutocomplete
                  field={field}
                  options={namespaceOptions}
                  label="Namespaces"
                  placeholder="Select namespaces"
                />
              )}
            </form.Field>
          </div>
        )}

        {form.state.isDirty && (
          <div className="flex flex-col gap-2">
            <Label> </Label>
            <Button variant="secondary" onClick={reset} size="sm" className="mt-0.5">
              <X size={16} />
              Clear
            </Button>
          </div>
        )}
      </div>
      <ButtonWithPermission
        ButtonProps={{
          variant: "default",
          disabled: noGitServers,
          asChild: true,
          className: "mt-5",
        }}
        allowed={codebasePermissions.data.create.allowed}
        reason={codebasePermissions.data.create.reason}
      >
        <Link to={routeCodebaseCreate.fullPath} params={{ clusterName: clusterName }} className="no-underline">
          <Plus />
          Create Component
        </Link>
      </ButtonWithPermission>
    </div>
  );
};
