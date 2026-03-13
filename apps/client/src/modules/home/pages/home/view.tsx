import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  Activity,
  BookOpen,
  FileText,
  GitBranch,
  PlayCircle,
  Rocket,
  Settings,
  Zap,
  FolderGit2,
  Package,
  FileUser,
  User,
  Server,
  Shield,
  BarChart3,
  ArrowRight,
  X,
  RotateCcw,
  Loader2,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { Card } from "@/core/components/ui/card";
import { Button } from "@/core/components/ui/button";
import { PATH_OVERVIEW_FULL } from "@/modules/platform/overview/pages/details/route";
import { PATH_PROJECTS_FULL } from "@/modules/platform/codebases/pages/list/route";
import { PATH_CDPIPELINES_FULL } from "@/modules/platform/cdpipelines/pages/list/route";
import { PATH_PIPELINERUNS_FULL } from "@/modules/platform/tekton/pages/pipelinerun-list/route";
import { PATH_CONFIG_QUICKLINKS_FULL } from "@/modules/platform/configuration/modules/quicklinks/route";
import { PATH_CONFIG_GITSERVERS_FULL } from "@/modules/platform/configuration/modules/gitservers/route";
import { PATH_PIPELINES_FULL } from "@/modules/platform/tekton/pages/pipeline-list/route";
import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import NamespacesDialog from "@/core/components/Namespaces";
import KubeConfigPreviewDialog from "@/core/components/KubeConfigPreview";
import UserDetailsDialog from "@/core/components/UserDetails";
import KubernetesDetailsDialog from "@/core/components/KubernetesDetails";
import { PATH_PROJECT_CREATE_FULL } from "@/modules/platform/codebases/pages/create/route";
import { useAutoTour, getToursForRoute } from "@/modules/tours";
import { usePipelineMetrics } from "@/modules/platform/tekton/hooks/usePipelineMetrics";
import { LOCAL_STORAGE_SERVICE } from "@/core/services/local-storage";
import { LS_KEY_HOME_DISMISSED_SECTIONS } from "@/core/services/local-storage/keys";

type DismissibleSection = "needHelp" | "gettingStarted";

function useDismissibleSections() {
  const [dismissed, setDismissed] = useState<Set<DismissibleSection>>(() => {
    const stored = LOCAL_STORAGE_SERVICE.getItem(LS_KEY_HOME_DISMISSED_SECTIONS);
    return new Set(Array.isArray(stored) ? stored : []);
  });

  // Sync dismissed state to localStorage
  useEffect(() => {
    if (dismissed.size > 0) {
      LOCAL_STORAGE_SERVICE.setItem(LS_KEY_HOME_DISMISSED_SECTIONS, [...dismissed]);
    } else {
      LOCAL_STORAGE_SERVICE.removeItem(LS_KEY_HOME_DISMISSED_SECTIONS);
    }
  }, [dismissed]);

  const dismiss = useCallback((section: DismissibleSection) => {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(section);
      return next;
    });
  }, []);

  const restore = useCallback((section: DismissibleSection) => {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.delete(section);
      return next;
    });
  }, []);

  const restoreAll = useCallback(() => {
    setDismissed(new Set());
  }, []);

  return { dismissed, dismiss, restore, restoreAll };
}

function DashboardPromo({
  clusterParams,
  namespace,
}: {
  clusterParams: { clusterName: string; namespace: string };
  namespace: string;
}) {
  const { data, isLoading } = usePipelineMetrics(namespace);

  const total = data?.summary?.total ?? 0;
  const successRate = data?.successRate;
  const failed = data?.summary?.failed ?? 0;

  return (
    <Link to={PATH_OVERVIEW_FULL} params={clusterParams} className="block">
      <Card className="group cursor-pointer border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 transition-shadow hover:shadow-md dark:border-blue-800 dark:from-blue-900/20 dark:to-indigo-900/20">
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 dark:bg-blue-500">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-slate-900 dark:text-slate-100">Platform Dashboard</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Pipeline metrics, resource usage, security insights, and deployment status.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isLoading ? (
              <div className="flex items-center gap-2 rounded-lg bg-white/60 px-4 py-2 dark:bg-slate-800/60">
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                <span className="text-xs text-slate-500 dark:text-slate-400">Loading metrics...</span>
              </div>
            ) : (
              <>
                <div className="flex flex-col items-center rounded-lg bg-white/60 px-4 py-2 dark:bg-slate-800/60">
                  <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">{total}</span>
                  <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <Activity className="h-3 w-3" />
                    Runs
                  </span>
                </div>
                <div className="flex flex-col items-center rounded-lg bg-white/60 px-4 py-2 dark:bg-slate-800/60">
                  <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                    {successRate != null ? `${successRate}%` : "-"}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <TrendingUp className="h-3 w-3" />
                    Success
                  </span>
                </div>
                <div className="flex flex-col items-center rounded-lg bg-white/60 px-4 py-2 dark:bg-slate-800/60">
                  <span
                    className={`text-lg font-semibold ${failed > 0 ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-slate-100"}`}
                  >
                    {failed}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <XCircle className="h-3 w-3" />
                    Failed
                  </span>
                </div>
              </>
            )}
            <ArrowRight className="ml-2 h-5 w-5 shrink-0 text-blue-600 transition-transform group-hover:translate-x-1 dark:text-blue-400" />
          </div>
        </div>
      </Card>
    </Link>
  );
}

export default function HomePage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const clusterName = useClusterStore(useShallow((state) => state.clusterName));
  const defaultNamespace = useClusterStore(useShallow((state) => state.defaultNamespace));
  const location = useLocation();
  const { dismissed, dismiss, restoreAll } = useDismissibleSections();

  const tours = getToursForRoute(location.pathname);
  const pinnedItemsTour = tours.find((t) => t.id === "pinned_items_intro");
  useAutoTour(pinnedItemsTour || null);

  const openNamespacesDialog = useDialogOpener(NamespacesDialog);
  const openKubeConfigPreviewDialog = useDialogOpener(KubeConfigPreviewDialog);
  const openUserDetailsDialog = useDialogOpener(UserDetailsDialog);
  const openKubernetesDetailsDialog = useDialogOpener(KubernetesDetailsDialog);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const clusterParams = {
    clusterName,
    namespace: defaultNamespace,
  };

  const tenant = clusterName || "default";

  const quickActions = [
    {
      label: "Create Project",
      description: "Start a new codebase",
      icon: GitBranch,
      to: PATH_PROJECT_CREATE_FULL,
      params: clusterParams,
    },
    {
      label: "Browse Projects",
      description: "View all codebases",
      icon: FolderGit2,
      to: PATH_PROJECTS_FULL,
      params: clusterParams,
    },
    {
      label: "Manage Pipelines",
      description: "Configure CI/CD",
      icon: PlayCircle,
      to: PATH_PIPELINES_FULL,
      params: clusterParams,
    },
    {
      label: "Pipeline Runs",
      description: "Monitor executions",
      icon: Activity,
      to: PATH_PIPELINERUNS_FULL,
      params: clusterParams,
    },
    {
      label: "CD Pipelines",
      description: "Deployment workflows",
      icon: Rocket,
      to: PATH_CDPIPELINES_FULL,
      params: clusterParams,
    },
  ];

  const gettingStarted = [
    {
      title: "Import Your First Project",
      description: "Connect to Git and import existing codebases",
      icon: GitBranch,
      to: PATH_PROJECTS_FULL,
      params: clusterParams,
    },
    {
      title: "Configure Pipelines",
      description: "Set up automated CI/CD workflows",
      icon: Settings,
      to: PATH_PIPELINES_FULL,
      params: clusterParams,
    },
    {
      title: "Set Up Integrations",
      description: "Connect to SonarQube, Nexus, and more",
      icon: Package,
      to: PATH_CONFIG_GITSERVERS_FULL,
      params: clusterParams,
    },
    {
      title: "Explore Documentation",
      description: "Learn about platform features and APIs",
      icon: BookOpen,
      to: PATH_OVERVIEW_FULL,
      params: clusterParams,
    },
  ];

  const hasDismissed = dismissed.size > 0;

  return (
    <div className="space-y-6 p-8">
      {/* Hero Section with Logo */}
      <Card className="border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50 p-8 dark:border-slate-800 dark:from-slate-900 dark:to-blue-900/20">
        <div className="flex items-start justify-between">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20">
                <img src="/krci-logo.svg" alt="kuberocket-ci-logo" className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl text-slate-900 dark:text-slate-100">KubeRocketCI</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">EPAM Delivery Platform</p>
              </div>
            </div>

            <div className="mt-2">
              <h2 className="mb-1 text-slate-900 dark:text-slate-100">{getGreeting()}!</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {currentTime.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} • Cluster:{" "}
                <span className="text-slate-900 dark:text-slate-100">{tenant}</span>
              </p>
            </div>
          </div>
          {/* Quick User Actions */}
          <div className="flex flex-col gap-2" data-tour="quick-actions">
            <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">Quick Actions</h3>
            <div className="flex flex-col gap-2">
              <Button variant="outline" size="sm" className="justify-start" onClick={() => openNamespacesDialog({})}>
                <Shield className="mr-2 h-4 w-4" />
                Manage Namespaces
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="justify-start"
                onClick={() => openKubeConfigPreviewDialog({})}
              >
                <FileUser className="mr-2 h-4 w-4" />
                Get Kubeconfig
              </Button>
              <Button variant="outline" size="sm" className="justify-start" onClick={() => openUserDetailsDialog({})}>
                <User className="mr-2 h-4 w-4" />
                User Details
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="justify-start"
                onClick={() => openKubernetesDetailsDialog({})}
              >
                <Server className="mr-2 h-4 w-4" />
                Kubernetes Details
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Dashboard Promo with Live Stats */}
      <DashboardPromo clusterParams={clusterParams} namespace={defaultNamespace} />

      {/* Need Help - Dismissible */}
      {!dismissed.has("needHelp") && (
        <Card className="relative border-blue-200 bg-blue-50 p-5 dark:border-blue-800 dark:bg-blue-900/20">
          <button
            type="button"
            onClick={() => dismiss("needHelp")}
            className="absolute top-3 right-3 rounded-md p-1 text-slate-400 transition-colors hover:bg-blue-100 hover:text-slate-600 dark:hover:bg-blue-800"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="mb-0.5 text-slate-900 dark:text-slate-100">Need Help?</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Explore our documentation and platform features to get the most out of the platform.
                </p>
              </div>
            </div>
            <div className="mr-10 flex items-center gap-2">
              <Link to={EDP_USER_GUIDE.OVERVIEW.url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline">Documentation</Button>
              </Link>
              <Link to={PATH_CONFIG_QUICKLINKS_FULL} params={clusterParams}>
                <Button>Configuration</Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* Getting Started Guide - Dismissible */}
      {!dismissed.has("gettingStarted") && (
        <Card data-tour="getting-started" className="relative p-6">
          <button
            type="button"
            onClick={() => dismiss("gettingStarted")}
            className="absolute top-3 right-3 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
          <h3 className="mb-4 flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Getting Started
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {gettingStarted.map((item, idx) => {
              const Icon = item.icon;
              return (
                <Link key={idx} to={item.to} params={item.params}>
                  <div className="group flex cursor-pointer items-start gap-3 rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 group-hover:bg-blue-100 dark:bg-blue-900/20 dark:group-hover:bg-blue-900/40">
                      <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="mb-1 text-sm text-slate-900 dark:text-slate-100">{item.title}</h4>
                      <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">{item.description}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-slate-900 dark:text-slate-100">
          <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {quickActions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <Link key={idx} to={action.to} params={action.params}>
                <Card className="group cursor-pointer p-4 hover:border-blue-300 hover:shadow-md dark:hover:border-blue-600">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 group-hover:bg-blue-100 dark:bg-blue-900/20 dark:group-hover:bg-blue-900/40">
                      <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h4 className="mb-0.5 text-sm text-slate-900 dark:text-slate-100">{action.label}</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400">{action.description}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Restore dismissed sections */}
      {hasDismissed && (
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={restoreAll}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <RotateCcw className="h-3 w-3" />
            Restore hidden sections
          </button>
        </div>
      )}
    </div>
  );
}
