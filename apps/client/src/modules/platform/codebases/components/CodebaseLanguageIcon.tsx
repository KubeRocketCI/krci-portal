import { UseSpriteSymbol } from "@/core/components/sprites/K8sRelatedIconsSVGSprite";
import { capitalizeFirstLetter } from "@/core/utils/format/capitalizeFirstLetter";
import { getCodebaseMappingByType } from "@/k8s/api/groups/KRCI/Codebase";
import { CodebaseInterface } from "@/k8s/api/groups/KRCI/Codebase/configs/mappings/types";
import { LANGUAGE_ICON_MAPPING, RESOURCE_ICON_NAMES } from "@/k8s/api/groups/KRCI/Codebase/utils/icon-mappings";
import { Codebase } from "@my-project/shared";

interface CodebaseLanguageIconProps {
  codebase: Codebase;
}

export const CodebaseLanguageIcon = ({ codebase }: CodebaseLanguageIconProps) => {
  const {
    spec: { lang: _lang, type },
  } = codebase;
  const codebaseMapping = getCodebaseMappingByType(type) as Record<string, CodebaseInterface>;
  const lang = _lang.toLowerCase();
  const codebaseMappingByLang = codebaseMapping?.[lang];
  const languageIcon = LANGUAGE_ICON_MAPPING[lang as keyof typeof LANGUAGE_ICON_MAPPING] || RESOURCE_ICON_NAMES.OTHER;

  return (
    <div className="flex items-center gap-1.5">
      <UseSpriteSymbol name={languageIcon} width={20} height={20} className="text-muted-foreground" />
      <span className="text-foreground text-sm">
        {codebaseMappingByLang?.language?.name || capitalizeFirstLetter(_lang)}
      </span>
    </div>
  );
};
