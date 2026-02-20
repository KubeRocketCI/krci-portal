import { UseSpriteSymbol } from "@/core/components/sprites/K8sRelatedIconsSVGSprite";
import { capitalizeFirstLetter } from "@/core/utils/format/capitalizeFirstLetter";
import { getCodebaseMappingByType } from "@/k8s/api/groups/KRCI/Codebase";
import { CodebaseInterface } from "@/k8s/api/groups/KRCI/Codebase/configs/mappings/types";
import { BUILD_TOOL_ICON_MAPPING, RESOURCE_ICON_NAMES } from "@/k8s/api/groups/KRCI/Codebase/utils/icon-mappings";
import { Codebase } from "@my-project/shared";

interface CodebaseBuildToolIconProps {
  codebase: Codebase;
}

export const CodebaseBuildToolIcon = ({ codebase }: CodebaseBuildToolIconProps) => {
  const {
    spec: { lang: _lang, buildTool: _buildTool, type },
  } = codebase;
  const codebaseMapping = getCodebaseMappingByType(type) as Record<string, CodebaseInterface>;
  const lang = _lang.toLowerCase();
  const buildTool = _buildTool.toLowerCase();
  const codebaseMappingByLang = codebaseMapping?.[lang];
  const buildToolIcon =
    BUILD_TOOL_ICON_MAPPING[buildTool as keyof typeof BUILD_TOOL_ICON_MAPPING] || RESOURCE_ICON_NAMES.OTHER;

  return (
    <div className="flex items-center gap-1.5">
      <UseSpriteSymbol name={buildToolIcon} width={20} height={20} className="text-muted-foreground" />
      <span className="text-foreground text-sm">
        {codebaseMappingByLang?.buildTools?.[buildTool]?.name || capitalizeFirstLetter(_buildTool)}
      </span>
    </div>
  );
};
