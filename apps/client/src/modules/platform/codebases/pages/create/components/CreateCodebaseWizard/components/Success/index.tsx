import React from "react";
import { useStore } from "@tanstack/react-form";
import { Button } from "@/core/components/ui/button";
import { PartyPopper, Check, ArrowRight, FolderGit2, FolderOpen, ExternalLink, Sparkles, Globe } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { NAMES } from "../../names";
import { routeComponentList } from "../../../../../list/route";
import { routeComponentDetails } from "../../../../../details/route";
import { routeCDPipelineCreate } from "@/modules/platform/cdpipelines/pages/create/route";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { useWizardStore } from "../../store";
import { gitProvider } from "@my-project/shared";
import { useCreateCodebaseForm } from "../../providers/form/hooks";

export const Success: React.FC = () => {
  const form = useCreateCodebaseForm();
  const { clusterName, defaultNamespace } = useClusterStore(
    useShallow((state) => ({
      clusterName: state.clusterName,
      defaultNamespace: state.defaultNamespace,
    }))
  );

  const name = useStore(form.store, (state) => state.values[NAMES.name]);
  const gitServer = useStore(form.store, (state) => state.values[NAMES.gitServer]);
  const repositoryOwner = useStore(form.store, (state) => state.values[NAMES.ui_repositoryOwner]);
  const repositoryName = useStore(form.store, (state) => state.values[NAMES.ui_repositoryName]);
  const gitUrlPath = useStore(form.store, (state) => state.values[NAMES.gitUrlPath]);

  const repositoryPath = React.useMemo(() => {
    if (repositoryOwner && repositoryName) {
      return `${repositoryOwner}/${repositoryName}`;
    }
    if (gitUrlPath) {
      return gitUrlPath;
    }
    return name || "repository";
  }, [repositoryOwner, repositoryName, gitUrlPath, name]);

  const gitServerHost = React.useMemo(() => {
    if (gitServer === gitProvider.github) return "github.com";
    if (gitServer === gitProvider.gitlab) return "gitlab.com";
    if (gitServer === gitProvider.gerrit) return "gerrit.local";
    if (gitServer === gitProvider.bitbucket) return "bitbucket.org";
    return "git.example.com";
  }, [gitServer]);

  const handleCreateAnother = () => {
    useWizardStore.getState().reset();
    // Reload the page to reset the form
    window.location.href = `/c/${clusterName}/components/create`;
  };

  return (
    <div className="space-y-4">
      <div className="mx-auto flex max-w-2xl flex-col items-center space-y-6 text-center">
        <div className="bg-primary/10 flex h-20 w-20 items-center justify-center rounded-full">
          <PartyPopper className="text-primary h-10 w-10" />
        </div>

        <div>
          <h1 className="text-foreground mb-2 text-xl font-semibold">Project Created Successfully!</h1>
          <p className="text-muted-foreground text-sm">
            Your project <span className="text-foreground font-medium">{name || "project"}</span> has been created and
            is ready to use
          </p>
        </div>

        <div className="border-primary/20 bg-primary/5 w-full rounded-lg border p-4">
          <div className="mb-2 flex items-center justify-center gap-2">
            <FolderGit2 className="text-primary h-5 w-5" />
            <div className="text-foreground text-sm font-medium">Repository created at:</div>
          </div>
          <code className="border-primary/30 bg-card text-foreground inline-block rounded border px-3 py-1.5 text-sm">
            {gitServerHost}/{repositoryPath}
          </code>
        </div>

        <div className="border-border w-full border-t pt-4">
          <h3 className="text-foreground mb-4 text-base font-semibold">What would you like to do next?</h3>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" size="sm" className="flex h-auto flex-col items-center gap-1.5 py-3" asChild>
              <Link to={routeComponentList.fullPath} params={{ clusterName }}>
                <FolderOpen className="text-muted-foreground h-4 w-4" />
                <div className="flex flex-col">
                  <span className="text-xs">View All Projects</span>
                  <span className="text-muted-foreground text-[10px]">Go back to projects list</span>
                </div>
              </Link>
            </Button>

            <Button size="sm" className="flex h-auto flex-col items-center gap-1.5 py-3" asChild>
              <Link
                to={routeComponentDetails.fullPath}
                params={{
                  clusterName,
                  name: name || "",
                  namespace: defaultNamespace || "",
                }}
              >
                <ExternalLink className="h-4 w-4" />
                <div className="flex flex-col">
                  <span className="text-xs">Open Project</span>
                  <span className="text-[10px] opacity-80">View project details</span>
                </div>
              </Link>
            </Button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              size="sm"
              className="flex h-auto flex-col items-center gap-1.5 py-3"
              onClick={handleCreateAnother}
            >
              <Sparkles className="text-muted-foreground h-4 w-4" />
              <div className="flex flex-col">
                <span className="text-xs">Create Another Project</span>
                <span className="text-muted-foreground text-[10px]">Start new project wizard</span>
              </div>
            </Button>

            <Button variant="outline" size="sm" className="flex h-auto flex-col items-center gap-1.5 py-3" asChild>
              <Link to={routeCDPipelineCreate.fullPath} params={{ clusterName }} search={{ application: name || "" }}>
                <Globe className="text-muted-foreground h-4 w-4" />
                <div className="flex flex-col">
                  <span className="text-xs">Create Deployment</span>
                  <span className="text-muted-foreground text-[10px]">Create deployment for this project</span>
                </div>
              </Link>
            </Button>
          </div>
        </div>

        <div className="border-border bg-muted/50 w-full rounded-lg border p-4">
          <div className="text-foreground mb-2 text-sm font-medium">Next Steps:</div>
          <ul className="text-muted-foreground space-y-1.5 text-left text-sm">
            <li className="flex items-start gap-2">
              <Check className="text-primary mt-0.5 h-4 w-4 shrink-0" />
              <span>Repository has been created with initial structure</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="text-primary mt-0.5 h-4 w-4 shrink-0" />
              <span>CI/CD pipeline has been configured</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="text-primary mt-0.5 h-4 w-4 shrink-0" />
              <span>Quality gates and build tools are ready</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="bg-primary mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full">
                <ArrowRight className="text-primary-foreground h-3 w-3" />
              </div>
              <span>Clone the repository and start coding!</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
