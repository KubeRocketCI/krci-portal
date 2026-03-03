import type { StepPrerequisite, TourMetadata } from "@/modules/tours/types";
import { TourStepContent } from "@/modules/tours/components/TourStepContent";
import { PATH_PROJECT_DETAILS_FULL, pipelinesTabSchema, routeSearchTabName } from "./pages/details/route";

const overviewTabPrerequisite: StepPrerequisite = {
  to: PATH_PROJECT_DETAILS_FULL,
  search: (prev) => ({ ...prev, tab: routeSearchTabName.overview }),
};

/**
 * Tour configurations specific to the codebases (projects) module.
 * These tours guide users through project list and detail pages.
 */
export const CODEBASES_TOURS = {
  projectsListTour: {
    id: "projects_list_tour",
    title: "Projects List Tour",
    description: "Learn about the Projects list page features",
    type: "tour",
    showOnce: false,
    trigger: "manual",
    steps: [
      {
        target: "[data-tour='projects-table']",
        content: (
          <TourStepContent title="Projects Overview">
            <p>
              This table shows all your projects (codebases) with real-time status updates. You can see applications,
              libraries, autotests, and infrastructure code.
            </p>
          </TourStepContent>
        ),
        placement: "right",
        disableBeacon: true,
      },
      {
        target: "[data-tour='projects-filter']",
        content: (
          <TourStepContent title="Filter Projects">
            <p>
              Use these filters to narrow down projects by type, language, framework, or status. Filters sync with the
              URL so you can bookmark specific views.
            </p>
          </TourStepContent>
        ),
        placement: "bottom",
      },
      {
        target: "[data-tour='create-project-button']",
        content: (
          <TourStepContent title="Create New Project">
            <p>
              Click here to create a new project. You can import existing code or create from a template. The wizard
              will guide you through the configuration.
            </p>
          </TourStepContent>
        ),
        placement: "bottom",
      },
    ],
  },
  projectDetailsTour: {
    id: "project_details_tour",
    title: "Project Details Tour",
    description: "Learn about all the tabs and features in the project details page",
    type: "tour",
    showOnce: false,
    trigger: "manual",
    steps: [
      // Tab navigation overview
      {
        target: "[data-tour='project-tabs']",
        content: (
          <TourStepContent title="Project Tabs Navigation">
            <p>This project has 5 tabs that organize all project information:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong>Overview</strong> - Project details and overview of code quality and security
              </li>
              <li>
                <strong>Branches</strong> - View project branches, their statuses, and build capabilities
              </li>
              <li>
                <strong>Pipelines</strong> - See pipeline runs related to this project
              </li>
              <li>
                <strong>Pull Requests</strong> - Manage pull requests and code reviews
              </li>
              <li>
                <strong>Deployments</strong> - Track which deployments and environments use this project
              </li>
            </ul>
          </TourStepContent>
        ),
        placement: "bottom",
        disableBeacon: true,
        prerequisite: overviewTabPrerequisite,
      },
      // Overview tab
      {
        target: "[data-tour='overview-info']",
        content: (
          <TourStepContent title="Project Information">
            <p>
              View essential project details including language, framework, build tool, versioning strategy, configured
              pipelines, current status, and project type.
            </p>
          </TourStepContent>
        ),
        placement: "right",
        prerequisite: overviewTabPrerequisite,
      },
      {
        target: "[data-tour='code-quality-widget']",
        content: (
          <TourStepContent title="Code Quality Metrics">
            <p>
              This widget displays code quality metrics from your integrated quality gate system, showing a summary of
              code coverage, bugs, vulnerabilities, and code smells.
            </p>
          </TourStepContent>
        ),
        placement: "top",
        prerequisite: overviewTabPrerequisite,
      },
      {
        target: "[data-tour='dependencies-widget']",
        content: (
          <TourStepContent title="Security & Dependencies">
            <p>
              Monitor your project's security posture with dependency scanning results. View detected vulnerabilities,
              outdated packages, and security recommendations at a glance.
            </p>
          </TourStepContent>
        ),
        placement: "top",
        prerequisite: overviewTabPrerequisite,
      },
      // Branches tab
      {
        target: "[data-tour='branches-table']",
        content: (
          <TourStepContent title="Branches Management">
            <p>View and manage all project branches in this comprehensive table. Here you can see:</p>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              <li>Branch names and types</li>
              <li>Build status and resource status</li>
              <li>External URLs for accessing builds</li>
              <li>Current version numbers</li>
              <li>Available actions (configure, delete, or manually trigger builds)</li>
            </ul>
            <p className="text-sm">
              Use the actions menu on each branch to configure settings, trigger builds, or manage the branch (depending
              on your permissions).
            </p>
          </TourStepContent>
        ),
        placement: "top-end",
        prerequisite: {
          to: PATH_PROJECT_DETAILS_FULL,
          search: (prev) => ({ ...prev, tab: routeSearchTabName.branches }),
        },
      },
      // Pipelines tab
      {
        target: "[data-tour='pipelines-table']",
        content: (
          <TourStepContent title="Pipeline Runs (Live)">
            <p>
              View live pipeline runs for this project from Tekton. Filter by branch to see specific build and test
              results, check pipeline statuses, and access detailed logs.
            </p>
          </TourStepContent>
        ),
        placement: "top",
        prerequisite: {
          to: PATH_PROJECT_DETAILS_FULL,
          search: (prev) => ({
            ...prev,
            tab: routeSearchTabName.pipelines,
            pipelinesTab: pipelinesTabSchema.enum.live,
          }),
          waitFor: "[data-tour='pipelines-table']",
          stabilizationDelay: 300,
        },
      },
      {
        target: "[data-tour='pipeline-history']",
        content: (
          <TourStepContent title="Pipeline History">
            <p>
              Access comprehensive pipeline run history from Tekton Results, including execution logs, build artifacts,
              performance metrics, and detailed task information.
            </p>
          </TourStepContent>
        ),
        placement: "top",
        prerequisite: {
          to: PATH_PROJECT_DETAILS_FULL,
          search: (prev) => ({
            ...prev,
            tab: routeSearchTabName.pipelines,
            pipelinesTab: pipelinesTabSchema.enum["tekton-results"],
          }),
          waitFor: "[data-tour='pipeline-history']",
          stabilizationDelay: 300,
        },
      },
      // Pull Requests tab
      {
        target: "[data-tour='pull-requests-table']",
        content: (
          <TourStepContent title="Pull Requests">
            <p>
              View and manage pull requests for this project. See PR status, assigned reviewers, linked pipeline runs,
              and integration with your Git provider.
            </p>
          </TourStepContent>
        ),
        placement: "top",
        prerequisite: {
          to: PATH_PROJECT_DETAILS_FULL,
          search: (prev) => ({ ...prev, tab: routeSearchTabName.code }),
        },
      },
      // Deployments tab
      {
        target: "[data-tour='deployments-table']",
        content: (
          <TourStepContent title="Deployment Status">
            <p>
              Track where this project is deployed across environments. See which CD Pipelines and Stages (Environments)
              use this project, their deployment status, and currently deployed versions.
            </p>
          </TourStepContent>
        ),
        placement: "top",
        prerequisite: {
          to: PATH_PROJECT_DETAILS_FULL,
          search: (prev) => ({ ...prev, tab: routeSearchTabName.deployments }),
        },
      },
    ],
  },
} as const satisfies Record<string, TourMetadata>;
