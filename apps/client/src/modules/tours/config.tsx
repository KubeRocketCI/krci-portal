import { useAuth } from "@/core/auth/provider";
import type { TourMetadata } from "./types";

function WelcomeStepContent() {
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0] || "";

  return (
    <div className="space-y-3 text-center">
      <img src="/krci-logo.svg" alt="KubeRocketCI" className="mx-auto h-10 w-10" />
      <h3 className="text-base font-semibold">Welcome{firstName ? `, ${firstName}` : ""}!</h3>
      <p>
        Let us show you around the KubeRocketCI platform. This quick tour will walk you through the key areas of the
        interface.
      </p>
    </div>
  );
}

/**
 * Tour configuration for all available tours in the application.
 * Each tour demonstrates a specific feature or workflow.
 */
export const TOURS_CONFIG: Record<string, TourMetadata> = {
  welcome: {
    id: "welcome_tour",
    title: "Welcome Tour",
    description: "Get familiar with the KubeRocketCI platform interface and key areas",
    showOnce: true,
    trigger: "onMount",
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
          <div className="space-y-2 text-left">
            <h3 className="font-semibold">User Menu</h3>
            <p>
              Access your profile, group memberships, documentation, and sign out from here. You can also find links to
              community discussions and support.
            </p>
          </div>
        ),
        placement: "top",
      },
      {
        target: "[data-tour='cluster-nav']",
        content: (
          <div className="space-y-2 text-left">
            <h3 className="font-semibold">Cluster Navigation</h3>
            <p>
              Manage your cluster settings from here. You can switch namespaces and download your kubeconfig for CLI
              access.
            </p>
          </div>
        ),
        placement: "right",
      },
      {
        target: "[data-tour='quick-actions']",
        content: (
          <div className="space-y-2 text-left">
            <h3 className="font-semibold">Quick Actions</h3>
            <p>
              Use the quick action buttons to manage namespaces, download kubeconfig, view user details, or check
              Kubernetes cluster information.
            </p>
          </div>
        ),
        placement: "bottom",
      },
      {
        target: "[data-tour='getting-started']",
        content: (
          <div className="space-y-2 text-left">
            <h3 className="font-semibold">Getting Started</h3>
            <p>
              Start here to import your first project, explore the documentation, and get up to speed with the platform.
            </p>
          </div>
        ),
        placement: "top",
      },
    ],
  },
  pinnedItems: {
    id: "pinned_items_intro",
    title: "Pinned Items",
    description: "Learn about pinning your favorite pages for quick access",
    showOnce: true,
    trigger: "onMount",
    steps: [
      {
        target: "[data-tour='pinned-section']",
        content: (
          <div className="space-y-2">
            <h3 className="font-semibold">Quick Access with Pinned Items</h3>
            <p>
              Pin your frequently used projects, deployments, and stages here for quick access. Look for the pin icon on
              detail pages to add items to this section.
            </p>
          </div>
        ),
        placement: "right",
        disableBeacon: true,
      },
    ],
  },
  formGuide: {
    id: "form_guide_intro",
    title: "Form Guide",
    description: "Learn about the Form Guide that helps you fill out forms",
    showOnce: true,
    trigger: "feature",
    featureId: "form-guide",
    steps: [
      {
        target: "[data-tour='form-guide-toggle']",
        content: (
          <div className="space-y-2">
            <h3 className="font-semibold">Form Guide</h3>
            <p>
              Click this button to open the Form Guide panel. It provides helpful descriptions and tips for each field
              in the form.
            </p>
          </div>
        ),
        placement: "bottom",
        disableBeacon: true,
      },
    ],
  },
} as const;
