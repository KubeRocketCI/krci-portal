import type { StepPrerequisite, TourMetadata } from "@/modules/tours/types";
import { TourStepContent } from "@/modules/tours/components/TourStepContent";
import { PATH_CDPIPELINE_DETAILS_FULL, routeSearchTabName } from "./pages/details/route";

const environmentsTabPrerequisite: StepPrerequisite = {
  to: PATH_CDPIPELINE_DETAILS_FULL,
  search: (prev) => ({ ...prev, tab: routeSearchTabName.environments }),
};

export const CDPIPELINE_TOURS = {
  deploymentsListTour: {
    id: "deployments_list_tour",
    title: "Deployments List Tour",
    description: "Learn about the Deployments list page features",
    type: "tour",
    showOnce: false,
    trigger: "manual",
    steps: [
      {
        target: "[data-tour='deployments-table']",
        content: (
          <TourStepContent title="Deployments Overview">
            <p>
              This table lists all your deployment pipelines with real-time status updates. Each row represents a CD
              pipeline that orchestrates application delivery across environments.
            </p>
          </TourStepContent>
        ),
        placement: "right",
        disableBeacon: true,
      },
      {
        target: "[data-tour='deployments-table'] tbody tr:first-child",
        content: (
          <TourStepContent title="Deployment Row">
            <p>Each deployment row shows key information at a glance:</p>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              <li>
                <strong>Name</strong> — click to open deployment details and manage environments
              </li>
              <li>
                <strong>Status</strong> — real-time health indicator of the pipeline
              </li>
              <li>
                <strong>Description</strong> — purpose or context for this deployment
              </li>
              <li>
                <strong>Applications</strong> — linked projects deployed through this pipeline
              </li>
              <li>
                <strong>Actions</strong> — configure or delete the deployment
              </li>
            </ul>
          </TourStepContent>
        ),
        placement: "bottom",
      },
      {
        target: "[data-tour='create-deployment-button']",
        content: (
          <TourStepContent title="Create Deployment">
            <p>
              Click here to create a new deployment pipeline. You'll configure a name, select applications, and set up
              environments (stages) for your delivery workflow.
            </p>
          </TourStepContent>
        ),
        placement: "bottom",
      },
    ],
  },
  deploymentDetailsTour: {
    id: "deployment_details_tour",
    title: "Deployment Details Tour",
    description: "Learn about deployment environments, applications, and management features",
    type: "tour",
    showOnce: false,
    trigger: "manual",
    steps: [
      {
        target: "[data-tour='deployment-tabs']",
        content: (
          <TourStepContent title="Two Ways to View Deployment Data">
            <p>This deployment has two perspectives for viewing data:</p>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              <li>
                <strong>Environments</strong> — view each environment (stage) with its deployed applications and
                versions
              </li>
              <li>
                <strong>Applications</strong> — see how each application is deployed across all environments with its
                versions
              </li>
            </ul>
          </TourStepContent>
        ),
        placement: "bottom",
        disableBeacon: true,
        prerequisite: environmentsTabPrerequisite,
      },
      {
        target: "[data-tour='deployment-env-flow']",
        content: (
          <TourStepContent title="Environment Cards">
            <p>
              Each card represents an environment (stage) in your delivery pipeline. Click a card to switch the details
              panel below and see that environment's deployed applications, infrastructure, and status.
            </p>
          </TourStepContent>
        ),
        placement: "bottom",
        prerequisite: environmentsTabPrerequisite,
      },
      {
        target: "[data-tour='deployment-detail-panel']",
        content: (
          <TourStepContent title="Environment Details">
            <p>This panel shows details for the selected environment, including:</p>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              <li>
                <strong>Infrastructure</strong> — cluster, namespace, deploy/clean pipelines, quality gates
              </li>
              <li>
                <strong>Deployed Applications</strong> — app versions, health and sync status, ingresses, logs, and
                terminal access
              </li>
              <li>
                <strong>External Services</strong> — links to ArgoCD, monitoring, and logging
              </li>
            </ul>
          </TourStepContent>
        ),
        placement: "top",
        prerequisite: {
          ...environmentsTabPrerequisite,
          waitFor: "[data-tour='deployment-detail-panel']",
          stabilizationDelay: 300,
        },
      },
      {
        target: "[data-tour='deployment-applications-section']",
        content: (
          <TourStepContent title="Deployed Applications">
            <p>
              Each row shows an application with its deployed version, health status, sync status, and quick actions.
              Access ArgoCD, ingress URLs, pod logs, and terminal directly from here.
            </p>
          </TourStepContent>
        ),
        placement: "top",
        prerequisite: {
          ...environmentsTabPrerequisite,
          waitFor: "[data-tour='deployment-applications-section']",
        },
      },
      {
        target: "[data-tour='deployment-applications-tab']",
        content: (
          <TourStepContent title="Applications View">
            <p>
              This table shows all applications in the pipeline. Expand a row to see how that application is deployed
              across all environments — with version, status, namespace, and quick actions for each stage.
            </p>
          </TourStepContent>
        ),
        placement: "top",
        prerequisite: {
          to: PATH_CDPIPELINE_DETAILS_FULL,
          search: (prev) => ({ ...prev, tab: routeSearchTabName.applications }),
          waitFor: "[data-tour='deployment-applications-tab']",
          stabilizationDelay: 300,
        },
      },
      {
        target: "[data-tour='create-environment-button']",
        content: (
          <TourStepContent title="Create Environment">
            <p>
              Add a new environment (stage) to your deployment pipeline. Each environment represents a step in your
              delivery workflow — from development through to production.
            </p>
          </TourStepContent>
        ),
        placement: "bottom",
        prerequisite: environmentsTabPrerequisite,
      },
      {
        target: "[data-tour='deployment-actions-menu']",
        content: (
          <TourStepContent title="Deployment Actions">
            <p>
              Use this menu to configure or delete the deployment pipeline. You can edit the pipeline settings or remove
              it entirely.
            </p>
          </TourStepContent>
        ),
        placement: "bottom",
        prerequisite: environmentsTabPrerequisite,
      },
    ],
  },
} as const satisfies Record<string, TourMetadata>;
