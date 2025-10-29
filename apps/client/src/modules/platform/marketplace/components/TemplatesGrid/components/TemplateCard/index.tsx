import { Chip, useTheme } from "@mui/material";
import { UseSpriteSymbol } from "@/core/components/sprites/K8sRelatedIconsSVGSprite";
import { useStyles } from "./styles";
import { Template } from "@my-project/shared";
import { getCodebaseMappingByType } from "@/k8s/api/groups/KRCI/Codebase";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { ButtonWithPermission } from "@/core/components/ButtonWithPermission";
import { capitalizeFirstLetter } from "@/core/utils/format/capitalizeFirstLetter";
import { useTemplatePermissions } from "@/k8s/api/groups/KRCI/Template";
import { getIconByPattern } from "@/k8s/api/groups/KRCI/Codebase/utils/icon-mappings";
import { CodebaseInterface } from "@/k8s/api/groups/KRCI/Codebase/configs/mappings/types";

interface TemplateCardProps {
  template: Template;
  handleTemplateClick(template: Template): void;
}

export const TemplateCard = ({ template, handleTemplateClick }: TemplateCardProps) => {
  const theme = useTheme();
  const {
    spec: {
      displayName,
      icon,
      description,
      language: _language,
      framework: _framework,
      buildTool: _buildTool,
      type,
      category,
      maturity,
      version,
    },
  } = template;
  const classes = useStyles();

  const templatePermissions = useTemplatePermissions();

  const codebaseMapping = getCodebaseMappingByType(type);
  const lang = _language.toLowerCase();
  const framework = _framework ? _framework.toLowerCase() : "N/A";
  const buildTool = _buildTool.toLowerCase();
  const codebaseMappingByLang = codebaseMapping?.[lang as keyof typeof codebaseMapping] as unknown as CodebaseInterface;

  return (
    <div className={classes.cardRoot}>
      <div className="flex flex-col gap-6 h-full">
        <div className="flex flex-col gap-4 mb-auto">
          <div className="flex flex-row gap-2 items-center">
            {icon && (
              <img
                className={classes.templateIcon}
                src={`data:${icon[0].mediatype};base64,${icon[0].base64data}`}
                alt=""
              />
            )}
            <TextWithTooltip
              text={displayName}
              textSX={{
                fontWeight: 500,
                fontSize: (t) => t.typography.pxToRem(18),
              }}
            />
          </div>
          <span className={`text-xs ${classes.templateDescription}`}>
            {description}
          </span>
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <div className="grid grid-cols-3 gap-2 items-center">
              <div className="col-span-1">
                <div className="flex flex-col gap-1">
                  <span className="text-xs">Language:</span>
                  <div className="flex flex-row gap-1">
                    <UseSpriteSymbol name={getIconByPattern(_language)} width={16} height={16} />
                    <span className="text-xs text-muted-foreground">
                      {codebaseMappingByLang?.language?.name || capitalizeFirstLetter(_language)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="col-span-1">
                <div className="flex flex-col gap-1">
                  <span className="text-xs">Framework:</span>
                  <div className="flex flex-row gap-1">
                    <UseSpriteSymbol name={getIconByPattern(_framework)} width={16} height={16} />
                    <span className="text-xs text-muted-foreground">
                      {framework
                        ? codebaseMappingByLang?.frameworks?.[framework]?.name ||
                          (_framework && capitalizeFirstLetter(_framework)) ||
                          "N/A"
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="col-span-1">
                <div className="flex flex-col gap-1">
                  <span className="text-xs">Build Tool:</span>
                  <div className="flex flex-row gap-1">
                    <UseSpriteSymbol name={getIconByPattern(_buildTool)} width={16} height={16} />
                    <span className="text-xs text-muted-foreground">
                      {codebaseMappingByLang?.buildTools?.[buildTool]?.name || capitalizeFirstLetter(_buildTool)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div>
            <div className="grid grid-cols-3 gap-2 items-center">
              <div className="col-span-1">
                <div className="flex flex-col gap-1 items-start">
                  <span className="text-xs">Type:</span>
                  <Chip size={"small"} label={type} sx={{ backgroundColor: theme.palette.secondary.main }} />
                </div>
              </div>
              <div className="col-span-1">
                <div className="flex flex-col gap-1 items-start">
                  <span className="text-xs">Category:</span>
                  <Chip size={"small"} label={category} sx={{ backgroundColor: theme.palette.secondary.main }} />
                </div>
              </div>
              <div className="col-span-1">
                <div className="flex flex-col gap-1 items-start">
                  <span className="text-xs">Maturity:</span>
                  <Chip size={"small"} label={maturity} sx={{ backgroundColor: theme.palette.secondary.main }} />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-row gap-4 items-end justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs">Version</span>
            <p className="text-base">{version}</p>
          </div>
          <ButtonWithPermission
            allowed={templatePermissions.data.create.allowed}
            reason={templatePermissions.data.create.reason}
            ButtonProps={{
              variant: "outlined",
              color: "primary",
              size: "medium",
              onClick: () => handleTemplateClick(template),
            }}
          >
            use template
          </ButtonWithPermission>
        </div>
      </div>
    </div>
  );
};
