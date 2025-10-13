import { Link } from "@mui/material";
import { useCurrentDialog } from "../../providers/CurrentDialog/hooks";
import { getMappingByType } from "@/k8s/api/groups/KRCI/Codebase/utils/getMappingByType";
import { CodebaseInterface } from "@/k8s/api/groups/KRCI/Codebase/configs/mappings/types";
import { BorderedSection } from "@/core/components/BorderedSection";
import { InfoColumns } from "@/core/components/InfoColumns";
import { capitalizeFirstLetter } from "@/core/utils/format/capitalizeFirstLetter";
import { getIconByPattern } from "@/k8s/api/groups/KRCI/Codebase/utils/icon-mappings";

export const FormDefaultValues = () => {
  const {
    props: { template },
  } = useCurrentDialog();

  const {
    spec: { type: codebaseType, language, framework: _framework, buildTool: _buildTool, source },
  } = template;

  const codebaseMapping = getMappingByType(codebaseType);
  const lang = language.toLowerCase();
  const framework = _framework.toLowerCase();
  const buildTool = _buildTool.toLowerCase();

  const codebaseMappingByLang = codebaseMapping?.[lang as keyof typeof codebaseMapping] as unknown as CodebaseInterface;

  const infoRows = [
    [
      {
        label: "Language",
        text: codebaseMappingByLang?.language?.name || capitalizeFirstLetter(lang),
        icon: getIconByPattern(language),
      },
      {
        label: "Framework",
        text: framework
          ? codebaseMappingByLang?.frameworks?.[framework]?.name ||
            (_framework && capitalizeFirstLetter(_framework)) ||
            "N/A"
          : "N/A",
        icon: getIconByPattern(_framework),
      },
      {
        label: "Build Tool",
        text: codebaseMappingByLang?.buildTools?.[buildTool]?.name || capitalizeFirstLetter(_buildTool),
        icon: getIconByPattern(_buildTool),
      },
      {
        label: "Source",
        text: (
          <Link href={source} target={"_blank"}>
            {source}
          </Link>
        ),
        columnXs: 6,
      },
    ],
  ];

  return (
    <BorderedSection>
      <div>
        <InfoColumns infoRows={infoRows} />
      </div>
    </BorderedSection>
  );
};
