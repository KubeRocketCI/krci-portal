import { UseSpriteSymbol } from "@/core/components/sprites/K8sRelatedIconsSVGSprite";
import { capitalizeFirstLetter } from "@/core/utils/format/capitalizeFirstLetter";
import { CodebaseInterface } from "@/k8s/api/groups/KRCI/Codebase/configs/mappings/types";
import { getMappingByType } from "@/k8s/api/groups/KRCI/Codebase/utils/getMappingByType";
import { getIconByPattern } from "@/k8s/api/groups/KRCI/Codebase/utils/icon-mappings";
import { Tooltip } from "@/core/components/ui/tooltip";
import { cn } from "@/core/utils/classname";
import React from "react";
import { useCurrentDialog } from "../../providers/CurrentDialog/hooks";

export const drawerPaperClasses = "top-16 bottom-0 p-5 max-w-[500px]";

export const templateNameClasses = "line-clamp-4";

export const Preview = () => {
  const {
    props: { template },
  } = useCurrentDialog();
  const {
    spec: { type: codebaseType, language, framework: _framework, buildTool: _buildTool },
  } = template;

  const codebaseMapping = getMappingByType(codebaseType);
  const lang = language.toLowerCase();
  const framework = _framework.toLowerCase();
  const buildTool = _buildTool.toLowerCase();

  const codebaseMappingByLang = codebaseMapping?.[lang as keyof typeof codebaseMapping] as unknown as CodebaseInterface;

  return (
    template && (
      <div className="mt-3">
        <div className="flex flex-col gap-4">
          <div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div>
                  <img
                    className="w-10"
                    src={`data:${template?.spec?.icon?.[0]?.mediatype};base64,${template?.spec?.icon?.[0]?.base64data}`}
                    alt=""
                  />
                </div>
                <div>
                  <Tooltip title={template?.spec.displayName}>
                    <h5 className={cn("text-2xl font-medium", templateNameClasses)}>{template?.spec.displayName}</h5>
                  </Tooltip>
                </div>
              </div>
            </div>
          </div>
          <div>
            <p className="text-sm">{template?.spec.description}</p>
          </div>
          <div>
            <div className="grid grid-cols-3 items-start gap-4">
              <div>
                <p className="mb-2 text-base font-medium">Language</p>
                <div className="flex items-center gap-2">
                  <div>
                    <UseSpriteSymbol name={getIconByPattern(language)} width={20} height={20} />
                  </div>
                  <div>{codebaseMappingByLang?.language?.name || capitalizeFirstLetter(lang)}</div>
                </div>
              </div>
              <div>
                <p className="mb-2 text-base font-medium">Framework</p>
                <div className="flex items-center gap-2">
                  <div>
                    <UseSpriteSymbol name={getIconByPattern(_framework)} width={20} height={20} />
                  </div>
                  <div>
                    {framework
                      ? codebaseMappingByLang?.frameworks?.[framework]?.name ||
                        (_framework && capitalizeFirstLetter(_framework)) ||
                        "N/A"
                      : "N/A"}
                  </div>
                </div>
              </div>
              <div>
                <p className="mb-2 text-base font-medium">Build Tool</p>
                <div className="flex items-center gap-2">
                  <div>
                    <UseSpriteSymbol name={getIconByPattern(_buildTool)} width={20} height={20} />
                  </div>
                  <div>{codebaseMappingByLang?.buildTools?.[buildTool]?.name || capitalizeFirstLetter(_buildTool)}</div>
                </div>
              </div>
              <div>
                <p className="mb-2 text-base font-medium">Type</p>
                <p className="text-sm">{template?.spec.type}</p>
              </div>
              <div>
                <p className="mb-2 text-base font-medium">Category</p>
                <p className="text-sm">{template?.spec.category}</p>
              </div>
              <div>
                <p className="mb-2 text-base font-medium">Maturity</p>
                <p className="text-sm">{template?.spec.maturity}</p>
              </div>
              <div>
                <p className="mb-2 text-base font-medium">Version</p>
                <p className="text-sm">{template?.spec.version}</p>
              </div>
              <div className="col-span-2">
                <p className="mb-2 text-base font-medium">Source</p>
                <a
                  href={template?.spec.source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:no-underline"
                >
                  {template?.spec.source}
                </a>
              </div>
              <div className="col-span-3">
                <p className="mb-2 text-base font-medium">Maintainers</p>
                {(template?.spec.maintainers || []).map((maintainer) => {
                  return (
                    <p className="mb-2" key={maintainer.name}>
                      <div>
                        <span className="text-sm">Name: </span>
                        <span className="text-xs">{maintainer.name}</span>
                      </div>
                      <div>
                        <span className="text-sm">Email: </span>
                        <span className="text-xs">{maintainer.email}</span>
                      </div>
                    </p>
                  );
                })}
              </div>
              {template?.spec.keywords && (
                <div className="col-span-3">
                  <p className="mb-2 text-base font-medium">Keywords</p>
                  {(template?.spec.keywords || []).map((el, idx) => {
                    const propertyId = `${el}:${idx}`;

                    return (
                      <React.Fragment key={propertyId}>
                        <>
                          {idx !== 0 && <span>, </span>}
                          <span className="text-xs">{el}</span>
                        </>
                      </React.Fragment>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  );
};
