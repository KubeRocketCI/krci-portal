import { Link } from "@tanstack/react-router";
import { PanelsTopLeft, Layers, Rows2, Bot, ShoppingCart, Settings, ArrowRight, Zap, GitBranch } from "lucide-react";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { PATH_OVERVIEW_FULL } from "@/modules/platform/overview/pages/details/route";
import { PATH_COMPONENTS_FULL } from "@/modules/platform/codebases/pages/list/route";
import { PATH_CDPIPELINES_FULL } from "@/modules/platform/cdpipelines/pages/list/route";
import { PATH_PIPELINERUNS_FULL } from "@/modules/platform/pipelineruns/pages/list/route";
import { PATH_MARKETPLACE_FULL } from "@/modules/platform/marketplace/route";
import { PATH_CONFIG_QUICKLINKS_FULL } from "@/modules/platform/configuration/modules/quicklinks/route";

interface QuickLinkCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  to: string;
  params: Record<string, string>;
  iconColor?: string;
}

function QuickLinkCard({
  title,
  description,
  icon: Icon,
  to,
  params,
  iconColor = "text-blue-500",
}: QuickLinkCardProps) {
  return (
    <Link
      to={to}
      params={params}
      className="group relative flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-blue-400 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-500"
    >
      <div className="flex items-start justify-between">
        <div className={`rounded-lg bg-gray-50 p-2 dark:bg-gray-700 ${iconColor}`}>
          <Icon className="h-5 w-5" />
        </div>
        <ArrowRight className="h-4 w-4 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <div className="flex flex-col gap-0.5">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        <p className="text-xs text-gray-600 dark:text-gray-400">{description}</p>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const clusterName = useClusterStore(useShallow((state) => state.clusterName));
  const defaultNamespace = useClusterStore(useShallow((state) => state.defaultNamespace));

  const clusterParams = {
    clusterName,
    namespace: defaultNamespace,
  };

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-8 py-16">
        <div className="flex h-32 w-32 items-center justify-center">
          <img src="/krci-logo.svg" alt="kuberocket-ci-logo" className="h-full w-full" />
        </div>

        <div className="flex flex-col items-center gap-3 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">Welcome to KRCI Portal</h1>
          <p className="max-w-2xl text-lg text-gray-600 dark:text-gray-400">
            Your comprehensive platform for managing CI/CD pipelines, components, and deployments
          </p>
        </div>
      </div>

      <div className="border-t border-gray-200 bg-gray-50 px-8 py-12 dark:border-gray-700 dark:bg-gray-900/50">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Quick Start</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <QuickLinkCard
                title="Overview"
                description="View system overview and application versions"
                icon={PanelsTopLeft}
                to={PATH_OVERVIEW_FULL}
                params={clusterParams}
                iconColor="text-purple-500"
              />
              <QuickLinkCard
                title="Components"
                description="Manage your application codebases and repositories"
                icon={Layers}
                to={PATH_COMPONENTS_FULL}
                params={clusterParams}
                iconColor="text-blue-500"
              />
              <QuickLinkCard
                title="Deployment Flows"
                description="Configure and monitor CD pipelines across environments"
                icon={Rows2}
                to={PATH_CDPIPELINES_FULL}
                params={clusterParams}
                iconColor="text-green-500"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-blue-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">CI/CD & Development</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <QuickLinkCard
                title="CI/CD Pipelines"
                description="View and manage pipeline runs, pipelines, and tasks"
                icon={Bot}
                to={PATH_PIPELINERUNS_FULL}
                params={clusterParams}
                iconColor="text-orange-500"
              />
              <QuickLinkCard
                title="Marketplace"
                description="Discover and install new components and integrations"
                icon={ShoppingCart}
                to={PATH_MARKETPLACE_FULL}
                params={clusterParams}
                iconColor="text-pink-500"
              />
              <QuickLinkCard
                title="Configuration"
                description="Configure integrations, clusters, and platform settings"
                icon={Settings}
                to={PATH_CONFIG_QUICKLINKS_FULL}
                params={clusterParams}
                iconColor="text-gray-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
