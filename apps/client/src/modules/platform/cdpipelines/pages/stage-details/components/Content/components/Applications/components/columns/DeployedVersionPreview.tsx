import {
  CODEBASE_COMMON_BUILD_TOOLS,
  CODEBASE_COMMON_FRAMEWORKS,
  CODEBASE_COMMON_LANGUAGES,
} from "@/k8s/api/groups/KRCI/Codebase/configs/mappings";
import { quickLinkUiNames } from "@/k8s/api/groups/KRCI/QuickLink/constants";
import { LinkCreationService } from "@/k8s/services/link-creation";
import { useQuickLinksUrlListWatch } from "@/modules/platform/cdpipelines/pages/stage-details/hooks";
import { Tooltip } from "@/core/components/ui/tooltip";
import { Application, applicationLabels, Codebase, getDeployedVersion, systemQuickLink } from "@my-project/shared";
import { Link } from "@tanstack/react-router";
import { CircleCheck, Fingerprint, SquareArrowOutUpRight } from "lucide-react";
import React from "react";
import { Button } from "@/core/components/ui/button";

const ImageDigestCopyIcon = ({ value }: { value: string }) => {
  const [copied, setCopied] = React.useState(false);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    []
  );

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(value);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setCopied(true);
    timeoutRef.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Tooltip title={<span className="max-w-sm font-mono text-xs break-all">{value}</span>}>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label="Copy deployed image reference"
        onClick={handleClick}
      >
        {copied ? (
          <CircleCheck size={14} className="text-green-500" />
        ) : (
          <Fingerprint size={14} className="text-muted-foreground" />
        )}
      </Button>
    </Tooltip>
  );
};

export const DeployedVersionPreviewColumn = ({
  appCodebase,
  application,
}: {
  appCodebase: Codebase;
  application: Application;
}) => {
  const { lang, framework, buildTool } = appCodebase.spec;

  const quickLinksUrlListWatch = useQuickLinksUrlListWatch();

  const quickLinkURLs = quickLinksUrlListWatch.data?.quickLinkURLs;

  const isHelm =
    lang === CODEBASE_COMMON_LANGUAGES.HELM &&
    framework === CODEBASE_COMMON_FRAMEWORKS.HELM &&
    buildTool === CODEBASE_COMMON_BUILD_TOOLS.HELM;

  const withValuesOverride = application ? Object.hasOwn(application?.spec, "sources") : false;

  const deployedVersion = getDeployedVersion(withValuesOverride, isHelm, application);

  const deployedImage = (() => {
    const images: string[] = application?.status?.summary?.images || [];
    if (!images.length) return undefined;

    const helmParams = withValuesOverride
      ? application?.spec?.sources?.find((el: { helm?: unknown }) => el.helm)?.helm?.parameters
      : application?.spec?.source?.helm?.parameters;

    const imageRepo = helmParams?.find((el: { name: string }) => el.name === "image.repository")?.value;
    if (imageRepo) {
      return images.find((img: string) => img.startsWith(`${imageRepo}:`) || img.startsWith(`${imageRepo}@`));
    }

    return images[0];
  })();

  const argoCDLink = React.useMemo(() => {
    return LinkCreationService.argocd.createApplicationLink(
      quickLinkURLs?.[systemQuickLink.argocd],
      application?.metadata?.labels?.[applicationLabels.pipeline],
      application?.metadata?.labels?.[applicationLabels.stage],
      application?.metadata?.labels?.[applicationLabels.appName]
    );
  }, [application?.metadata?.labels, quickLinkURLs]);

  return application && deployedVersion !== "NaN" ? (
    <div className="flex items-center gap-1">
      <Tooltip
        title={
          <div className="flex items-center gap-1">
            <div>Open in {quickLinkUiNames[systemQuickLink.argocd]}</div>
            <span> </span>
            <div>
              <SquareArrowOutUpRight size={12} />
            </div>
          </div>
        }
      >
        <div className="my-0.5">
          <Button variant="link" asChild>
            <Link to={argoCDLink} target={"_blank"} className="!p-0">
              {deployedVersion}
            </Link>
          </Button>
        </div>
      </Tooltip>
      {deployedImage && <ImageDigestCopyIcon value={deployedImage} />}
    </div>
  ) : (
    "No deploy"
  );
};
