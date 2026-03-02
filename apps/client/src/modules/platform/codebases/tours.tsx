import type { TourMetadata } from "@/modules/tours/types";
import { PATH_PROJECT_DETAILS_FULL, routeSearchTabName } from "./pages/details/route";

/**
 * Tour configurations specific to the codebases (projects) module.
 * These tours guide users through project list and detail pages.
 */
export const CODEBASES_TOURS: Record<string, TourMetadata> = {
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
          <div className="space-y-2">
            <h3 className="font-semibold">Projects Overview</h3>
            <p>
              This table shows all your projects (codebases) with real-time status updates. You can see applications,
              libraries, autotests, and infrastructure code.
            </p>
          </div>
        ),
        placement: "right",
        disableBeacon: true,
      },
      {
        target: "[data-tour='projects-filter']",
        content: (
          <div className="space-y-2">
            <h3 className="font-semibold">Filter Projects</h3>
            <p>
              Use these filters to narrow down projects by type, language, framework, or status. Filters sync with the
              URL so you can bookmark specific views.
            </p>
          </div>
        ),
        placement: "bottom",
      },
      {
        target: "[data-tour='create-project-button']",
        content: (
          <div className="space-y-2">
            <h3 className="font-semibold">Create New Project</h3>
            <p>
              Click here to create a new project. You can import existing code or create from a template. The wizard
              will guide you through the configuration.
            </p>
          </div>
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
          <div className="space-y-2">
            <h3 className="font-semibold">Project Tabs Navigation</h3>
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
          </div>
        ),
        placement: "bottom",
        disableBeacon: true,
        prerequisite: {
          to: PATH_PROJECT_DETAILS_FULL,
          search: (prev) => ({ ...prev, tab: routeSearchTabName.overview }),
        },
      },
      // Overview tab
      {
        target: "[data-tour='overview-info']",
        content: (
          <div className="space-y-2">
            <h3 className="font-semibold">Project Information</h3>
            <p>
              View essential project details including language, framework, build tool, versioning strategy, configured
              pipelines, current status, and project type.
            </p>
          </div>
        ),
        placement: "right",
        prerequisite: {
          to: PATH_PROJECT_DETAILS_FULL,
          search: (prev) => ({ ...prev, tab: routeSearchTabName.overview }),
        },
      },
      {
        target: "[data-tour='code-quality-widget']",
        content: (
          <div className="space-y-2">
            <h3 className="font-semibold">Code Quality Metrics</h3>
            <p>
              This widget displays code quality metrics from your integrated quality gate system, showing a summary of
              code coverage, bugs, vulnerabilities, and code smells.
            </p>
          </div>
        ),
        placement: "top",
        prerequisite: {
          to: PATH_PROJECT_DETAILS_FULL,
          search: (prev) => ({ ...prev, tab: routeSearchTabName.overview }),
        },
      },
      {
        target: "[data-tour='dependencies-widget']",
        content: (
          <div className="space-y-2">
            <h3 className="font-semibold">Security & Dependencies</h3>
            <p>
              Monitor your project's security posture with dependency scanning results. View detected vulnerabilities,
              outdated packages, and security recommendations at a glance.
            </p>
          </div>
        ),
        placement: "top",
        prerequisite: {
          to: PATH_PROJECT_DETAILS_FULL,
          search: (prev) => ({ ...prev, tab: routeSearchTabName.overview }),
        },
      },
      // Branches tab
      {
        target: "[data-tour='branches-table']",
        content: (
          <div className="space-y-2">
            <h3 className="font-semibold">Branches Management</h3>
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
          </div>
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
          <div className="space-y-2">
            <h3 className="font-semibold">Pipeline Runs (Live)</h3>
            <p>
              View live pipeline runs for this project from Tekton. Filter by branch to see specific build and test
              results, check pipeline statuses, and access detailed logs.
            </p>
          </div>
        ),
        placement: "top",
        prerequisite: {
          to: PATH_PROJECT_DETAILS_FULL,
          search: (prev) => ({ ...prev, tab: routeSearchTabName.pipelines, pipelinesTab: "live" }),
          waitFor: "[data-tour='pipelines-table']",
          stabilizationDelay: 300,
        },
      },
      {
        target: "[data-tour='pipeline-history']",
        content: (
          <div className="space-y-2">
            <h3 className="font-semibold">Pipeline History</h3>
            <p>
              Access comprehensive pipeline run history from Tekton Results, including execution logs, build artifacts,
              performance metrics, and detailed task information.
            </p>
          </div>
        ),
        placement: "top",
        prerequisite: {
          to: PATH_PROJECT_DETAILS_FULL,
          search: (prev) => ({ ...prev, tab: routeSearchTabName.pipelines, pipelinesTab: "tekton-results" }),
          waitFor: "[data-tour='pipeline-history']",
          stabilizationDelay: 300,
        },
      },
      // Pull Requests tab
      {
        target: "[data-tour='pull-requests-table']",
        content: (
          <div className="space-y-2">
            <h3 className="font-semibold">Pull Requests</h3>
            <p>
              View and manage pull requests for this project. See PR status, assigned reviewers, linked pipeline runs,
              and integration with your Git provider.
            </p>
          </div>
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
          <div className="space-y-2">
            <h3 className="font-semibold">Deployment Status</h3>
            <p>
              Track where this project is deployed across environments. See which CD Pipelines and Stages (Environments)
              use this project, their deployment status, and currently deployed versions.
            </p>
          </div>
        ),
        placement: "top",
        prerequisite: {
          to: PATH_PROJECT_DETAILS_FULL,
          search: (prev) => ({ ...prev, tab: routeSearchTabName.deployments }),
        },
      },
    ],
  },
} as const;
