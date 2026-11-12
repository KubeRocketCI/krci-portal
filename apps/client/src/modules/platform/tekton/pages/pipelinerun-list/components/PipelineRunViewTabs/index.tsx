import React from "react";
import { useRouter, useSearch } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-form";
import { ChevronDown, Link, Pencil, Plus, Save, Trash2, Undo2 } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { ConfirmDialog } from "@/core/components/Confirm";
import { showToast } from "@/core/components/Snackbar";
import { Button } from "@/core/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/core/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/core/components/ui/tabs";
import { Tooltip } from "@/core/components/ui/tooltip";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { cn } from "@/core/utils/classname";
import { useClusterStore } from "@/k8s/store";
import { usePipelineRunFilter } from "@/modules/platform/tekton/components/PipelineRunList/components/Filter/hooks/usePipelineRunFilter";
import {
  PIPELINERUN_VIEW_ERROR_MESSAGES,
  PIPELINERUN_VIEW_SEARCH_PARAM,
  PIPELINERUN_VIEWS_MAX_PER_CLUSTER,
} from "../../constants";
import { type PipelineRunViewMutationResult, usePipelineRunViews } from "../../hooks/usePipelineRunViews";
import type { PipelineRunView, PipelineRunViewFilters } from "../../types";
import { arePipelineRunViewFiltersEqual, toPipelineRunViewFilters } from "../../utils/pipelineRunViewFilters";
import { PipelineRunViewNameDialog } from "../PipelineRunViewNameDialog";

const ALL_RUNS_TAB = "all";

const TAB_CLASS_NAME = cn(
  "h-auto flex-none rounded-none border-0 border-b-2 border-transparent bg-transparent px-3 py-2 text-sm",
  "data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none",
  "dark:data-[state=active]:border-primary dark:data-[state=active]:bg-transparent",
  "hover:text-primary"
);

/**
 * Active and inactive view tabs take the same width: the bold name width is reserved and the
 * chevron is always laid out, so switching views does not shift the tabs after it.
 */
const ViewTabLabel = ({ name, isActive, isModified }: { name: string; isActive: boolean; isModified: boolean }) => (
  <>
    <span className="grid min-w-0">
      <span className="invisible col-start-1 row-start-1 truncate font-semibold" aria-hidden="true">
        {name}
      </span>
      <span className={cn("col-start-1 row-start-1 truncate", isActive && "font-semibold")}>{name}</span>
    </span>
    <ChevronDown size={16} aria-hidden="true" className={cn(!isActive && "invisible")} />
    {isModified && (
      <>
        <span
          className="bg-primary absolute top-1.5 right-1 size-1.5 rounded-full"
          title="Filters differ from the saved view"
          aria-hidden="true"
        />
        <span className="sr-only">(modified)</span>
      </>
    )}
  </>
);

const reportFailure = (result: PipelineRunViewMutationResult) => {
  if (!result.ok) {
    showToast(PIPELINERUN_VIEW_ERROR_MESSAGES[result.error], "error");
  }
};

/** Saved views of the PipelineRuns page. Renders inside the page's FilterProvider. */
export function PipelineRunViewTabs() {
  const router = useRouter();
  const clusterName = useClusterStore(useShallow((state) => state.clusterName));
  const { views, create, update, remove, getById } = usePipelineRunViews(clusterName);

  const search = useSearch({ strict: false }) as Record<string, unknown>;
  const rawViewId = search[PIPELINERUN_VIEW_SEARCH_PARAM];
  // Unknown or deleted ids (also deleted in another tab) fall back to "All runs".
  const activeView = getById(rawViewId === undefined || rawViewId === null ? undefined : String(rawViewId));

  // The page hides the Namespaces control with one allowed namespace; a view must not apply it then.
  const includeNamespaces = useClusterStore(useShallow((state) => state.allowedNamespaces.length > 1));
  const filterOptions = React.useMemo(() => ({ includeNamespaces }), [includeNamespaces]);
  const getViewFilters = React.useCallback(
    (view: PipelineRunView) => toPipelineRunViewFilters(view.filters, filterOptions),
    [filterOptions]
  );

  const { form, applyValues } = usePipelineRunFilter();
  const formValues = useStore(form.store, (state) => state.values);
  const currentFilters = React.useMemo(
    () => toPipelineRunViewFilters(formValues, filterOptions),
    [formValues, filterOptions]
  );
  const isModified = !!activeView && !arePipelineRunViewFiltersEqual(currentFilters, getViewFilters(activeView));

  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const activeTabRef = React.useRef<HTMLButtonElement>(null);

  const openNameDialog = useDialogOpener(PipelineRunViewNameDialog);
  const openConfirmDialog = useDialogOpener(ConfirmDialog);

  const selectView = React.useCallback(
    (viewId: string, filters: PipelineRunViewFilters) =>
      applyValues(filters, { search: { [PIPELINERUN_VIEW_SEARCH_PARAM]: viewId }, replace: false }),
    [applyValues]
  );

  const selectAllRuns = React.useCallback(
    () => applyValues({}, { search: { [PIPELINERUN_VIEW_SEARCH_PARAM]: undefined }, replace: false }),
    [applyValues]
  );

  const onTabChange = (value: string) => {
    if (value === ALL_RUNS_TAB) {
      selectAllRuns();
      return;
    }
    const view = getById(value);
    if (view) {
      setIsMenuOpen(false);
      selectView(view.id, getViewFilters(view));
    }
  };

  // Keyboard on the active tab opens its menu. Pointer opens it through the menu trigger inside the
  // tab, which is disabled on inactive tabs so their first click only selects them.
  const onActiveTabKeyDown = (event: React.KeyboardEvent) => {
    // Keys pressed inside the portalled menu bubble here through the React tree.
    if (event.target !== event.currentTarget) {
      return;
    }
    if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
      event.preventDefault();
      setIsMenuOpen(true);
    }
  };

  const onAddView = () =>
    openNameDialog({
      mode: "create",
      views,
      onSubmit: (name) => {
        const result = create(name, currentFilters);
        if (result.ok) {
          selectView(result.view.id, result.view.filters);
        }
        return result;
      },
    });

  const onEdit = (view: PipelineRunView) =>
    openNameDialog({
      mode: "rename",
      views,
      view,
      onSubmit: (name) => update(view.id, { name }),
    });

  const onSaveChanges = (view: PipelineRunView) => {
    // A hidden Namespaces control cannot change the stored namespaces; keep them.
    const filters =
      includeNamespaces || !view.filters.namespaces
        ? currentFilters
        : { ...currentFilters, namespaces: view.filters.namespaces };
    const result = update(view.id, { filters });
    reportFailure(result);
    if (result.ok) {
      showToast(`View "${view.name}" saved`, "success");
    }
  };

  const onCopyLink = async () => {
    const href = `${window.location.origin}${window.location.pathname}${router.options.stringifySearch(currentFilters)}`;
    try {
      await navigator.clipboard.writeText(href);
      showToast("Link copied", "success");
    } catch {
      showToast("Could not copy the link", "error");
    }
  };

  const onDelete = (view: PipelineRunView) =>
    openConfirmDialog({
      text: `Delete view "${view.name}"? Filters on the page stay as they are.`,
      actionCallback: async () => {
        const result = remove(view.id);
        reportFailure(result);
        if (result.ok) {
          void router.navigate({
            search: ((prev: Record<string, unknown>) => ({
              ...prev,
              [PIPELINERUN_VIEW_SEARCH_PARAM]: undefined,
            })) as never,
            replace: true,
          });
        }
      },
    });

  const isAtLimit = views.length >= PIPELINERUN_VIEWS_MAX_PER_CLUSTER;

  return (
    <div className="border-border flex items-end gap-1 overflow-x-auto border-b">
      <Tabs value={activeView?.id ?? ALL_RUNS_TAB} onValueChange={onTabChange} activationMode="manual">
        <TabsList aria-label="Saved views" className="h-auto gap-1 rounded-none bg-transparent p-0">
          {/* No TabsContent: the tabs filter the list below, so `aria-controls` would point nowhere. */}
          <TabsTrigger value={ALL_RUNS_TAB} className={TAB_CLASS_NAME} aria-controls={undefined}>
            All runs
          </TabsTrigger>
          {views.map((view) => {
            const isActive = view.id === activeView?.id;

            return (
              <TabsTrigger
                key={view.id}
                ref={isActive ? activeTabRef : undefined}
                value={view.id}
                className={cn(TAB_CLASS_NAME, "relative max-w-60")}
                aria-controls={undefined}
                aria-haspopup={isActive ? "menu" : undefined}
                aria-expanded={isActive ? isMenuOpen : undefined}
                onKeyDown={isActive ? onActiveTabKeyDown : undefined}
              >
                <DropdownMenu open={isActive && isMenuOpen} onOpenChange={(open) => setIsMenuOpen(isActive && open)}>
                  <DropdownMenuTrigger asChild disabled={!isActive}>
                    <span className="flex min-w-0 items-center gap-1.5">
                      <ViewTabLabel name={view.name} isActive={isActive} isModified={isActive && isModified} />
                    </span>
                  </DropdownMenuTrigger>
                  {isActive && (
                    <DropdownMenuContent
                      align="start"
                      className="min-w-56"
                      onCloseAutoFocus={(event) => {
                        event.preventDefault();
                        activeTabRef.current?.focus();
                      }}
                    >
                      {isModified && (
                        <>
                          <DropdownMenuItem onSelect={() => onSaveChanges(view)}>
                            <Save />
                            Save changes
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => selectView(view.id, getViewFilters(view))}>
                            <Undo2 />
                            Discard changes
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      <DropdownMenuItem onSelect={() => onEdit(view)}>
                        <Pencil />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => void onCopyLink()}>
                        <Link />
                        Copy link to view
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onSelect={() => onDelete(view)}>
                        <Trash2 />
                        Delete view
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  )}
                </DropdownMenu>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      <Tooltip title={isAtLimit ? PIPELINERUN_VIEW_ERROR_MESSAGES.limit : "Save the current filters as a view"}>
        <span className="mb-0.5">
          <Button variant="ghost" size="sm" onClick={onAddView} disabled={isAtLimit}>
            <Plus size={16} />
            Add view
          </Button>
        </span>
      </Tooltip>
    </div>
  );
}
