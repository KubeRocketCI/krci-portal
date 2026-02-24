import { baseCommonFields } from "./schema";
import z from "zod";
import { ValueOf } from "@/core/types/global";
import type { FormGuideFieldDescription, FormGuideStep } from "@/core/providers/FormGuide/types";

function createNamesObject<T extends Record<string, unknown>>(obj: T): { [K in keyof T]: K } {
  const result = {} as { [K in keyof T]: K };
  for (const key in obj) {
    result[key] = key;
  }
  return result;
}

const baseSchemaForNames = z.object(baseCommonFields);
export const NAMES = createNamesObject(baseSchemaForNames.shape);

export const FORM_PARTS = {
  METHOD: "method",
  GIT_SETUP: "gitSetup",
  BUILD_CONFIG: "buildConfig",
} as const;

export type CreationMethod = "template" | "custom";
export type FormPart = ValueOf<typeof FORM_PARTS>;

export const CREATE_FORM_PARTS = {
  [FORM_PARTS.METHOD]: [NAMES.ui_creationMethod, NAMES.ui_creationTemplate, NAMES.type, NAMES.strategy],
  [FORM_PARTS.GIT_SETUP]: [
    NAMES.repositoryUrl,
    NAMES.gitServer,
    NAMES.gitUrlPath,
    NAMES.ui_repositoryOwner,
    NAMES.ui_repositoryName,
    NAMES.defaultBranch,
    NAMES.name,
    NAMES.description,
    NAMES.private,
    NAMES.ui_hasCodebaseAuth,
    NAMES.ui_repositoryLogin,
    NAMES.ui_repositoryPasswordOrApiToken,
  ],
  [FORM_PARTS.BUILD_CONFIG]: [
    NAMES.lang,
    NAMES.framework,
    NAMES.buildTool,
    NAMES.testReportFramework,
    NAMES.deploymentScript,
    NAMES.versioningType,
    NAMES.versioningStartFrom,
    NAMES.ui_versioningStartFromVersion,
    NAMES.ui_versioningStartFromSnapshot,
    NAMES.ciTool,
    NAMES.ui_gitlabCiTemplate,
    NAMES.commitMessagePattern,
    NAMES.ui_hasJiraServerIntegration,
    NAMES.jiraServer,
    NAMES.ticketNamePattern,
    NAMES.ui_advancedMappingFieldName,
    NAMES.ui_advancedMappingJiraPattern,
    NAMES.ui_advancedMappingRows,
    NAMES.jiraIssueMetadataPayload,
    NAMES.emptyProject,
  ],
} as const;

export const WIZARD_GUIDE_STEPS: FormGuideStep[] = [
  { id: 1, label: "Initial Setup", sublabel: "Choose creation method" },
  { id: 2, label: "Git & Project Info", sublabel: "Configure repository and project" },
  { id: 3, label: "Build Config", sublabel: "Configure build settings" },
  { id: 4, label: "Review", sublabel: "Review and create" },
];

export const HELP_CONFIG: Record<number, FormGuideFieldDescription[]> = {
  1: [
    {
      fieldName: "ui_creationMethod",
      label: "Creation Method",
      description:
        "Pick a ready-made Template to get started quickly, or go with Custom to configure everything yourself.",
      notes: ["A Template pre-fills the language, framework, build tool, and source repository for you."],
    },
    {
      fieldName: "type",
      label: "Codebase Type",
      description:
        "What kind of project are you building? An Application you can deploy, a Library to share across projects, an Autotest suite, or Infrastructure-as-Code.",
    },
    {
      fieldName: "strategy",
      label: "Creation Strategy",
      description: "How should the repository be set up?",
      notes: [
        "Create — start from scratch with a new empty repository.",
        "Clone — copy code from an existing repository URL.",
        "Import — connect to an existing repository without copying it.",
      ],
    },
  ],
  2: [
    {
      fieldName: "repositoryUrl",
      label: "Repository URL",
      description: "Paste the URL of the repository you want to clone.",
      visibilityHint: "Shown for Clone strategy",
      notes: ["If you picked a Template, the URL is already filled in."],
    },
    {
      fieldName: "gitServer",
      label: "Git Server",
      description: "Where should the repository live? Pick one of the available Git servers.",
      notes: [
        "GitHub, GitLab, Bitbucket — you'll choose an Owner and Repository Name separately.",
        "Gerrit — you'll enter the Git URL Path directly.",
      ],
    },
    {
      fieldName: "ui_repositoryOwner",
      label: "Owner",
      description:
        "The organization or user account on the Git server. Pick from the list or type your own if the integration is unavailable.",
      visibilityHint: "Shown for GitHub / GitLab / Bitbucket git providers",
    },
    {
      fieldName: "ui_repositoryName",
      label: "Repository Name",
      description: "Name for your repository. Together with the Owner it forms the full repository path.",
      visibilityHint: "Shown for GitHub / GitLab / Bitbucket git providers",
    },
    {
      fieldName: "gitUrlPath",
      label: "Git URL Path",
      description: "The full path segment in the Git URL. Replaces Owner and Repository Name.",
      visibilityHint: "Shown for Gerrit git provider",
    },
    {
      fieldName: "defaultBranch",
      label: "Default Branch",
      description: "The main branch of the repository (e.g. main or master).",
    },
    {
      fieldName: "name",
      label: "Project Name",
      description:
        "A unique name for your project. It will be used in pipeline names, URLs, and Kubernetes resources, so keep it short and descriptive.",
    },
    {
      fieldName: "description",
      label: "Description",
      description: "Optional summary shown in the project list to help your team understand what this project is for.",
    },
    {
      fieldName: "ui_hasCodebaseAuth",
      label: "Repository Credentials",
      description: "Turn this on if the source repository requires a username and password or access token to clone.",
      visibilityHint: "Shown for Clone strategy",
    },
    {
      fieldName: "private",
      label: "Private",
      description: "Make the repository private so only authorized users can see it.",
    },
    {
      fieldName: "emptyProject",
      label: "Empty Project",
      description: "Create the project without any starter code or build config. You can push your own code later.",
      visibilityHint: "Shown for Create strategy",
    },
  ],
  3: [
    {
      fieldName: "lang",
      label: "Code Language",
      description:
        "The main programming language of your project. This determines which frameworks and build tools are available.",
      notes: ["Pre-filled when you use a Template."],
    },
    {
      fieldName: "framework",
      label: "Language Version / Framework",
      description:
        "The language version or framework your project uses. This affects how the CI pipeline is generated.",
      notes: ["Pre-filled when you use a Template."],
    },
    {
      fieldName: "buildTool",
      label: "Build Tool",
      description:
        "How your project is built and packaged (e.g. Maven, Gradle, npm). This drives the build stage in your CI pipeline.",
      notes: ["Pre-filled when you use a Template."],
    },
    {
      fieldName: "testReportFramework",
      label: "Autotest Report Framework",
      description: "The framework used to generate test reports.",
      visibilityHint: "Shown for Autotest codebase type",
    },
    {
      fieldName: "versioningType",
      label: "Codebase Versioning Type",
      description: "How versions are assigned to your builds and artifacts — Default, SemVer, or EDP scheme.",
    },
    {
      fieldName: "ui_versioningStartFromVersion",
      label: "Start Version From",
      description: "The first version number for your project (e.g. 0.1.0).",
    },
    {
      fieldName: "ui_versioningStartFromSnapshot",
      label: "Suffix",
      description: "An optional tag appended to the version, like SNAPSHOT or unstable, to indicate build maturity.",
    },
    {
      fieldName: "deploymentScript",
      label: "Deployment Options",
      description: "How the application is packaged for deployment.",
      visibilityHint: "Shown for Application codebase type",
      notes: ["Helm — deploy to Kubernetes using Helm charts.", "RPM — package as a traditional RPM."],
    },
    {
      fieldName: "ciTool",
      label: "CI Pipelines",
      description: "The CI tool that will build and test your project.",
    },
    {
      fieldName: "ui_gitlabCiTemplate",
      label: "GitLab CI Template",
      description: "A ready-made pipeline template.",
      visibilityHint: "Shown when GitLab CI is selected",
    },
    {
      fieldName: "commitMessagePattern",
      label: "Commit Message Pattern",
      description:
        "A regex pattern that every commit message must match. Helps keep commit history clean and consistent.",
    },
    {
      fieldName: "ui_hasJiraServerIntegration",
      label: "Integrate with Jira Server",
      description: "Connect this project to Jira so commits and builds can be linked to issues.",
    },
    {
      fieldName: "jiraServer",
      label: "Jira Server",
      description: "Pick the Jira server instance to link with this project.",
    },
    {
      fieldName: "ticketNamePattern",
      label: "Ticket Name Pattern",
      description: "A regex pattern to automatically find Jira ticket IDs in your commit messages.",
    },
    {
      fieldName: "ui_advancedMappingFieldName",
      label: "Mapping Field Name",
      description: "Choose which Jira field receives metadata from the platform when a build completes.",
      notes: ["Available variables: QUICK_LINK, EDP_VERSION, EDP_SEM_VERSION, EDP_GITTAG."],
    },
  ],
};
