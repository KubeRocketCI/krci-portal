import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
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
  ShoppingBag,
  Package,
  Shield,
  ChevronRight,
  FileUser,
  User,
  Server,
} from "lucide-react";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { Card } from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";
import { Button } from "@/core/components/ui/button";
import { PATH_OVERVIEW_FULL } from "@/modules/platform/overview/pages/details/route";
import { PATH_COMPONENTS_FULL } from "@/modules/platform/codebases/pages/list/route";
import { PATH_CDPIPELINES_FULL } from "@/modules/platform/cdpipelines/pages/list/route";
import { PATH_PIPELINERUNS_FULL } from "@/modules/platform/tekton/pages/pipelinerun-list/route";
import { PATH_MARKETPLACE_FULL } from "@/modules/platform/marketplace/route";
import { PATH_CONFIG_QUICKLINKS_FULL } from "@/modules/platform/configuration/modules/quicklinks/route";
import { PATH_CONFIG_GITSERVERS_FULL } from "@/modules/platform/configuration/modules/gitservers/route";
import { PATH_PIPELINES_FULL } from "@/modules/platform/tekton/pages/pipeline-list/route";
import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import NamespacesDialog from "@/core/components/Namespaces";
import KubeConfigPreviewDialog from "@/core/components/KubeConfigPreview";
import UserDetailsDialog from "@/core/components/UserDetails";
import KubernetesDetailsDialog from "@/core/components/KubernetesDetails";
import { PATH_CODEBASE_CREATE_FULL } from "@/modules/platform/codebases/pages/create/route";

export default function HomePage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const clusterName = useClusterStore(useShallow((state) => state.clusterName));
  const defaultNamespace = useClusterStore(useShallow((state) => state.defaultNamespace));

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
      to: PATH_CODEBASE_CREATE_FULL,
      params: clusterParams,
    },
    {
      label: "Browse Projects",
      description: "View all codebases",
      icon: FolderGit2,
      to: PATH_COMPONENTS_FULL,
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
    {
      label: "Marketplace",
      description: "Templates & integrations",
      icon: ShoppingBag,
      to: PATH_MARKETPLACE_FULL,
      params: clusterParams,
    },
  ];

  const gettingStarted = [
    {
      title: "Import Your First Project",
      description: "Connect to Git and import existing codebases",
      icon: GitBranch,
      to: PATH_COMPONENTS_FULL,
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

  const systemStatus: Array<{ label: string; status: string; color: string }> = [];

  const recentActivity: Array<{ title: string; time: string; icon: React.ElementType; status: string }> = [];

  const statusColors: Record<string, string> = {
    green:
      "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
    amber:
      "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
    red: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
  };

  const activityStatusColors: Record<string, string> = {
    success: "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400",
    running: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
    failed: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400",
  };

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
          <div className="flex flex-col gap-2">
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

      {/* Resources Banner */}
      <Card className="border-blue-200 bg-blue-50 p-5 dark:border-blue-800 dark:bg-blue-900/20">
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
          <div className="flex items-center gap-2">
            <Link to={EDP_USER_GUIDE.OVERVIEW.url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline">Documentation</Button>
            </Link>
            <Link to={PATH_CONFIG_QUICKLINKS_FULL} params={clusterParams}>
              <Button>Configuration</Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Getting Started Guide */}
      <Card className="p-6">
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

      {/* Quick Actions - Compact Grid */}
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Recent Activity
            </h3>
            <Link to={PATH_PIPELINERUNS_FULL} params={clusterParams}>
              <Button variant="ghost" size="sm">
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="space-y-2">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, idx) => {
                const Icon = activity.icon;
                return (
                  <div
                    key={idx}
                    className="flex cursor-pointer items-start gap-3 rounded-lg bg-slate-50 p-3 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700"
                  >
                    <div
                      className={`h-8 w-8 ${activityStatusColors[activity.status]} flex shrink-0 items-center justify-center rounded-lg`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="mb-0.5 truncate text-sm text-slate-900 dark:text-slate-100">{activity.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{activity.time}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="py-4 text-center text-sm text-slate-500 dark:text-slate-400">No recent activity</p>
            )}
          </div>
        </Card>

        {/* System Status */}
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              System Status
            </h3>
            <Link to={PATH_OVERVIEW_FULL} params={clusterParams}>
              <Button variant="ghost" size="sm">
                Details
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {systemStatus.length > 0 ? (
              systemStatus.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg bg-slate-50 p-3 dark:bg-slate-800"
                >
                  <span className="text-sm text-slate-900 dark:text-slate-100">{item.label}</span>
                  <Badge variant="outline" className={statusColors[item.color]}>
                    <div className="mr-1.5 h-1.5 w-1.5 rounded-full bg-green-500"></div>
                    {item.status}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="py-4 text-center text-sm text-slate-500 dark:text-slate-400">No system status available</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
