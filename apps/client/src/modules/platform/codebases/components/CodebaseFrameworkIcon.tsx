import { UseSpriteSymbol } from "@/core/components/sprites/K8sRelatedIconsSVGSprite";
import { capitalizeFirstLetter } from "@/core/utils/format/capitalizeFirstLetter";
import { getCodebaseMappingByType } from "@/k8s/api/groups/KRCI/Codebase";
import { CodebaseInterface } from "@/k8s/api/groups/KRCI/Codebase/configs/mappings/types";
import { FRAMEWORK_ICON_MAPPING } from "@/k8s/api/groups/KRCI/Codebase/utils/icon-mappings";
import { Codebase } from "@my-project/shared";

interface CodebaseFrameworkIconProps {
  codebase: Codebase;
}

export const CodebaseFrameworkIcon = ({ codebase }: CodebaseFrameworkIconProps) => {
  const {
    spec: { lang: _lang, framework: _framework, type },
  } = codebase;
  const codebaseMapping = getCodebaseMappingByType(type) as Record<string, CodebaseInterface>;
  const lang = _lang.toLowerCase();
  const framework = _framework ? _framework.toLowerCase() : null;
  const codebaseMappingByLang = codebaseMapping?.[lang];
  const frameworkIcon = framework
    ? (FRAMEWORK_ICON_MAPPING[framework as keyof typeof FRAMEWORK_ICON_MAPPING] ?? null)
    : null;
  const frameworkText = framework
    ? codebaseMappingByLang?.frameworks?.[framework]?.name || capitalizeFirstLetter(_framework) || "N/A"
    : "N/A";

  return (
    <div className="flex items-center gap-1.5">
      {frameworkIcon && (
        <UseSpriteSymbol name={frameworkIcon} width={20} height={20} className="text-muted-foreground" />
      )}
      <span className="text-foreground text-sm">{frameworkText}</span>
    </div>
  );
};
