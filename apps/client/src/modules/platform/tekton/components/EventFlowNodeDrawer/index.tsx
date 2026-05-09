import React from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/core/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/core/components/ui/tabs";
import { Button } from "@/core/components/ui/button";
import { Badge } from "@/core/components/ui/badge";
import { Link } from "@tanstack/react-router";
import { useShallow } from "zustand/react/shallow";
import { ExternalLink } from "lucide-react";
import { useClusterStore } from "@/k8s/store";
import CodeEditor from "@/core/components/CodeEditor";
import { routeTriggerDetails } from "@/modules/platform/tekton/pages/trigger-details/route";
import { routeTriggerBindingDetails } from "@/modules/platform/tekton/pages/trigger-binding-details/route";
import { routeTriggerTemplateDetails } from "@/modules/platform/tekton/pages/trigger-template-details/route";
import { routeInterceptorDetails } from "@/modules/platform/tekton/pages/interceptor-details/route";
import { routeClusterInterceptorDetails } from "@/modules/platform/tekton/pages/cluster-interceptor-details/route";
import { PATH_CONFIG_GITSERVERS_FULL } from "@/modules/platform/configuration/modules/gitservers/route";
import { ResolutionStatusBadge } from "../EventFlowDiagram/components/ResolutionStatusBadge";
import { DrawerSelection } from "./types";

export interface EventFlowNodeDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selection: DrawerSelection | null;
}

const titleFor = (s: DrawerSelection): string => {
  switch (s.kind) {
    case "gitSource":
      return s.gitServer?.metadata.name ?? "Webhook source";
    case "eventListener":
      return s.eventListener.metadata.name;
    case "trigger":
      return s.triggerRef;
    case "interceptor":
      return s.interceptor.ref.name;
    case "triggerBinding":
      return s.binding.ref;
    case "triggerTemplate":
      return s.template.ref || "(no template)";
    case "pipeline":
      if (s.pipelineRef.kind === "literal") return s.pipelineRef.pipelineName;
      if (s.pipelineRef.kind === "templated") return "Pipeline (dynamic)";
      return "Pipeline (unknown)";
  }
};

const yamlFor = (s: DrawerSelection): object | null => {
  switch (s.kind) {
    case "gitSource":
      return s.gitServer;
    case "eventListener":
      return s.eventListener;
    case "trigger":
      return s.resolved;
    case "interceptor":
      return s.interceptor.resolved ?? { ref: s.interceptor.ref, params: s.interceptor.params };
    case "triggerBinding":
      return s.binding.resolved ?? { ref: s.binding.ref, kind: s.binding.kind };
    case "triggerTemplate":
      return s.template.resolved;
    case "pipeline":
      return s.latestPipelineRun;
  }
};

export const EventFlowNodeDrawer: React.FC<EventFlowNodeDrawerProps> = ({ open, onOpenChange, selection }) => {
  const { clusterName } = useClusterStore(useShallow((s) => ({ clusterName: s.clusterName })));

  if (!selection) return null;

  const renderDetailsTab = () => {
    switch (selection.kind) {
      case "gitSource":
        return (
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Provider:</span> {selection.gitServer?.spec?.gitProvider ?? "—"}
            </div>
            <div>
              <span className="text-muted-foreground">Host:</span>{" "}
              <code>{selection.gitServer?.spec?.gitHost ?? "—"}</code>
            </div>
            {selection.gitServer && (
              <Button variant="link" asChild className="p-0">
                <Link to={PATH_CONFIG_GITSERVERS_FULL} params={{ clusterName }}>
                  View Git servers <ExternalLink size={14} className="ml-1" />
                </Link>
              </Button>
            )}
          </div>
        );
      case "eventListener":
        return (
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Address:</span>{" "}
              <code>{selection.eventListener.status?.address?.url ?? "—"}</code>
            </div>
            <div>
              <span className="text-muted-foreground">Triggers:</span>{" "}
              {(selection.eventListener.spec?.triggers ?? []).length}
            </div>
          </div>
        );
      case "trigger":
        return (
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Ref:</span> {selection.triggerRef}
            </div>
            {selection.resolved ? (
              <Button variant="link" asChild className="p-0">
                <Link
                  to={routeTriggerDetails.fullPath}
                  params={{ clusterName, namespace: selection.namespace, name: selection.triggerRef }}
                >
                  Open Trigger detail <ExternalLink size={14} className="ml-1" />
                </Link>
              </Button>
            ) : (
              <ResolutionStatusBadge
                status={selection.status}
                resourceLabel="Trigger"
                className="px-2 py-0.5 text-xs"
              />
            )}
          </div>
        );
      case "interceptor": {
        const isCluster = selection.interceptor.ref.kind === "ClusterInterceptor";
        return (
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-muted-foreground">Kind:</span>{" "}
              {isCluster ? "ClusterInterceptor" : "NamespacedInterceptor"}
            </div>
            {selection.interceptor.resolved ? (
              <Button variant="link" asChild className="p-0">
                <Link
                  to={isCluster ? routeClusterInterceptorDetails.fullPath : routeInterceptorDetails.fullPath}
                  params={
                    isCluster
                      ? { clusterName, name: selection.interceptor.ref.name }
                      : { clusterName, namespace: selection.namespace, name: selection.interceptor.ref.name }
                  }
                >
                  Open detail <ExternalLink size={14} className="ml-1" />
                </Link>
              </Button>
            ) : (
              <ResolutionStatusBadge
                status={selection.interceptor.status}
                resourceLabel={isCluster ? "ClusterInterceptor" : "Interceptor"}
                className="px-2 py-0.5 text-xs"
              />
            )}
            <div>
              <h4 className="text-muted-foreground mb-1 text-xs uppercase">Params</h4>
              <pre className="bg-muted rounded p-2 text-xs break-words whitespace-pre-wrap">
                {JSON.stringify(selection.interceptor.params, null, 2)}
              </pre>
            </div>
          </div>
        );
      }
      case "triggerBinding":
        return (
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Kind:</span> {selection.binding.kind}
            </div>
            {selection.binding.kind === "TriggerBinding" && selection.binding.resolved ? (
              <Button variant="link" asChild className="p-0">
                <Link
                  to={routeTriggerBindingDetails.fullPath}
                  params={{ clusterName, namespace: selection.namespace, name: selection.binding.ref }}
                >
                  Open binding detail <ExternalLink size={14} className="ml-1" />
                </Link>
              </Button>
            ) : selection.binding.kind === "ClusterTriggerBinding" ? (
              <Badge variant="secondary">ClusterTriggerBinding (unresolved in MVP)</Badge>
            ) : (
              <ResolutionStatusBadge
                status={selection.binding.status}
                resourceLabel="TriggerBinding"
                className="px-2 py-0.5 text-xs"
              />
            )}
          </div>
        );
      case "triggerTemplate":
        return (
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Ref:</span> {selection.template.ref || "—"}
            </div>
            <div>
              <span className="text-muted-foreground">Pipeline:</span>{" "}
              {selection.template.pipelineRef.kind === "literal" ? (
                selection.template.pipelineRef.pipelineName
              ) : selection.template.pipelineRef.kind === "templated" ? (
                <code>{selection.template.pipelineRef.raw}</code>
              ) : (
                "(unknown)"
              )}
            </div>
            {selection.template.resolved ? (
              <Button variant="link" asChild className="p-0">
                <Link
                  to={routeTriggerTemplateDetails.fullPath}
                  params={{ clusterName, namespace: selection.namespace, name: selection.template.ref }}
                >
                  Open template detail <ExternalLink size={14} className="ml-1" />
                </Link>
              </Button>
            ) : selection.template.ref ? (
              <ResolutionStatusBadge
                status={selection.template.status}
                resourceLabel="TriggerTemplate"
                className="px-2 py-0.5 text-xs"
              />
            ) : null}
          </div>
        );
      case "pipeline":
        return (
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Ref kind:</span> {selection.pipelineRef.kind}
            </div>
            {selection.latestPipelineRun && (
              <div>
                <span className="text-muted-foreground">Latest run:</span> {selection.latestPipelineRun.metadata.name}
              </div>
            )}
          </div>
        );
    }
  };

  const yaml = yamlFor(selection);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[480px] sm:max-w-[480px]">
        <SheetHeader>
          <SheetTitle>{titleFor(selection)}</SheetTitle>
          <SheetDescription className="sr-only">{titleFor(selection)} details</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-hidden p-4 pt-0">
          <Tabs key={`${selection.kind}:${titleFor(selection)}`} defaultValue="details" className="h-full">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="yaml" disabled={!yaml}>
                YAML
              </TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="mt-3">
              {renderDetailsTab()}
            </TabsContent>
            <TabsContent value="yaml" className="mt-3 h-[calc(100vh-160px)] overflow-hidden">
              {yaml && <CodeEditor language="yaml" content={yaml} />}
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
};
