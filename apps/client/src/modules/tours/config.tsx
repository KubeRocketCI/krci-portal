import { useAuth } from "@/core/auth/provider";
import type { TourMetadata } from "./types";
import { TourStepContent } from "./components/TourStepContent";
import { CDPIPELINE_TOURS } from "@/modules/platform/cdpipelines/tours";
import { CODEBASES_TOURS } from "@/modules/platform/codebases/tours";

function WelcomeStepContent() {
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0] || "";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <img src="/krci-logo.svg" alt="KubeRocketCI" className="h-10 w-10" />
        <h3 className="text-base font-semibold">Welcome{firstName ? `, ${firstName}` : ""}!</h3>
      </div>
      <p>
        Let us show you around the KubeRocketCI platform. This quick tour will walk you through the key areas of the
        interface.
      </p>
    </div>
  );
}

/**
 * Global tour configurations that apply across the entire application.
 * Module-specific tours are imported from their respective modules.
 */
const GLOBAL_TOURS = {
  welcome: {
    id: "welcome_tour",
    title: "Welcome Tour",
    description: "Get familiar with the KubeRocketCI platform interface and key areas",
    type: "tour",
    showOnce: true,
    trigger: "onMount",
    prerequisite: {
      routePattern: "/home",
    },
    steps: [
      {
        target: "body",
        content: <WelcomeStepContent />,
        placement: "center",
        disableBeacon: true,
      },
      {
        target: "[data-tour='user-nav']",
        content: (
          <TourStepContent title="User Menu">
            <p>
              Access your profile, group memberships, documentation, and sign out from here. You can also find links to
              community discussions and support.
            </p>
          </TourStepContent>
        ),
        placement: "top",
      },
      {
        target: "[data-tour='cluster-nav']",
        content: (
          <TourStepContent title="Cluster Navigation">
            <p>
              Manage your cluster settings from here. You can switch namespaces and download your kubeconfig for CLI
              access.
            </p>
          </TourStepContent>
        ),
        placement: "right",
      },
      {
        target: "[data-tour='quick-actions']",
        content: (
          <TourStepContent title="Quick Actions">
            <p>
              Use the quick action buttons to manage namespaces, download kubeconfig, view user details, or check
              Kubernetes cluster information.
            </p>
          </TourStepContent>
        ),
        placement: "bottom",
      },
      {
        target: "[data-tour='getting-started']",
        content: (
          <TourStepContent title="Getting Started">
            <p>
              Start here to import your first project, explore the documentation, and get up to speed with the platform.
            </p>
          </TourStepContent>
        ),
        placement: "top",
      },
    ],
  },
  pinnedItems: {
    id: "pinned_items_intro",
    title: "Pinned Items",
    description: "Learn about pinning your favorite pages for quick access",
    type: "popup",
    showOnce: true,
    trigger: "onMount",
    steps: [
      {
        target: "[data-tour='pinned-section']",
        content: (
          <TourStepContent title="Quick Access with Pinned Items">
            <p>
              Pin your frequently used projects, deployments, and stages here for quick access. Look for the pin icon on
              detail pages to add items to this section.
            </p>
          </TourStepContent>
        ),
        disableBeacon: true,
      },
    ],
  },
  formGuide: {
    id: "form_guide_intro",
    title: "Form Guide",
    description: "Learn about the Form Guide that helps you fill out forms",
    type: "popup",
    showOnce: true,
    trigger: "feature",
    featureId: "form-guide",
    steps: [
      {
        target: "[data-tour='form-guide-toggle']",
        content: (
          <TourStepContent title="Form Guide">
            <p>
              Click this button to open the Form Guide panel. It provides helpful descriptions and tips for each field
              in the form.
            </p>
          </TourStepContent>
        ),
        placement: "bottom",
        disableBeacon: true,
      },
    ],
  },
  pageGuideIntro: {
    id: "page_guide_intro",
    title: "Page Guide",
    description: "Learn about the Page Guide feature",
    type: "popup",
    showOnce: true,
    trigger: "feature",
    featureId: "page-guide",
    steps: [
      {
        target: "[data-tour='page-guide-button']",
        content: (
          <TourStepContent title="Discover Page Tours">
            <p>
              Click the Page Guide button to start an interactive tour of the current page. Each page tour will walk you
              through its key features and capabilities.
            </p>
          </TourStepContent>
        ),
        placement: "bottom",
        disableBeacon: true,
      },
    ],
  },
} as const satisfies Record<string, TourMetadata>;

/**
 * Combined tour configuration with global and module-specific tours.
 * This is the main export that should be used throughout the application.
 */
export const TOURS_CONFIG: Record<string, TourMetadata> = {
  ...GLOBAL_TOURS,
  ...CDPIPELINE_TOURS,
  ...CODEBASES_TOURS,
};
