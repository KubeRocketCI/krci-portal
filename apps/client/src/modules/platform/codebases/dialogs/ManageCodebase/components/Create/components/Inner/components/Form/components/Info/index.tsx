import { K8sRelatedIconsSVGSprite } from "@/core/components/sprites/K8sRelatedIconsSVGSprite";
import { useWatchKRCIConfig } from "@/k8s/api/groups/Core/ConfigMap/hooks/useWatchKRCIConfig";
import { codebaseCreationStrategy, codebaseType, gitProvider } from "@my-project/shared";
import { useTypedFormContext } from "../../../../../../../../hooks/useFormContext";
import { CODEBASE_FORM_NAMES } from "../../../../../../../../names";
import { isCloneStrategy } from "../../../../../../../../utils";
import {
  BuildTool,
  CodebaseAuth,
  Description,
  EmptyProject,
  Framework,
  GitServer,
  GitUrlPath,
  Lang,
  Name,
  Private,
  CiTool,
  Owner,
  Repository,
  RepositoryLogin,
  RepositoryPasswordOrApiToken,
  RepositoryUrl,
  TestReportFramework,
} from "../../../../../../../fields";

export const Info = () => {
  const { watch } = useTypedFormContext();

  const langFieldValue = watch(CODEBASE_FORM_NAMES.lang.name);
  const typeFieldValue = watch(CODEBASE_FORM_NAMES.type.name);
  const strategyFieldValue = watch(CODEBASE_FORM_NAMES.strategy.name) as string;
  const gitServerFieldValue = watch(CODEBASE_FORM_NAMES.gitServer.name);
  const hasCodebaseAuthFieldValue = watch(CODEBASE_FORM_NAMES.hasCodebaseAuth.name);

  const krciConfigMapWatch = useWatchKRCIConfig();
  const krciConfigMap = krciConfigMapWatch.data;
  const apiBaseUrl = krciConfigMap?.data?.api_gateway_url;

  return (
    <>
      <K8sRelatedIconsSVGSprite />
      <div className="flex flex-col gap-4">
        {isCloneStrategy(strategyFieldValue) ? (
          <>
            <div>
              <RepositoryUrl />
            </div>
          </>
        ) : null}

        <div>
          <div className="flex items-start gap-1">
            <div className="w-full max-w-[25%]">
              <GitServer />
            </div>
            {gitServerFieldValue.includes(gitProvider.gerrit) || !apiBaseUrl ? (
              <div className="w-full max-w-[75%]">
                <GitUrlPath />
              </div>
            ) : (
              <>
                <div className="w-full max-w-[30%]">
                  <Owner />
                </div>
                <div className="flex w-full max-w-[45%] gap-1">
                  <span className="pt-8">/</span>
                  <div className="shrink-0 grow">
                    <Repository />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div>
          <CiTool />
        </div>

        {isCloneStrategy(strategyFieldValue) ? (
          <>
            <div>
              <CodebaseAuth />
            </div>
            {hasCodebaseAuthFieldValue ? (
              <>
                <div>
                  <RepositoryLogin />
                </div>
                <div>
                  <RepositoryPasswordOrApiToken />
                </div>
              </>
            ) : null}
          </>
        ) : null}
        <div>
          <Name />
        </div>
        <div>
          <Description />
        </div>
        {(strategyFieldValue === codebaseCreationStrategy.create ||
          strategyFieldValue === codebaseCreationStrategy.clone) && (
          <div>
            <Private />
          </div>
        )}
        {strategyFieldValue === codebaseCreationStrategy.create && (
          <div>
            <EmptyProject />
          </div>
        )}
        <div>
          <Lang />
        </div>
        {langFieldValue && (
          <div>
            <Framework />
          </div>
        )}
        {langFieldValue && (
          <div>
            <BuildTool />
          </div>
        )}
        {typeFieldValue === codebaseType.autotest && (
          <div>
            <TestReportFramework />
          </div>
        )}
      </div>
    </>
  );
};
