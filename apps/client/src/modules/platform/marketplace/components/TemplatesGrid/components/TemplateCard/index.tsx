import { Box, Chip, Grid, Stack, Typography, useTheme } from "@mui/material";
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
    <Box className={classes.cardRoot}>
      <Stack spacing={3}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} alignItems={"center"}>
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
          </Stack>
          <Typography variant={"caption"} className={classes.templateDescription}>
            {description}
          </Typography>
        </Stack>
        <Stack spacing={2}>
          <Box>
            <Grid container alignItems={"center"} spacing={1}>
              <Grid item lg={4}>
                <Stack spacing={0.5}>
                  <Typography variant={"caption"}>Language:</Typography>
                  <Stack direction="row" spacing={0.5}>
                    <UseSpriteSymbol name={getIconByPattern(_language)} width={16} height={16} />
                    <Typography variant={"caption"} color={theme.palette.secondary.dark}>
                      {codebaseMappingByLang?.language?.name || capitalizeFirstLetter(_language)}
                    </Typography>
                  </Stack>
                </Stack>
              </Grid>
              <Grid item lg={4}>
                <Stack spacing={0.5}>
                  <Typography variant={"caption"}>Framework:</Typography>
                  <Stack direction="row" spacing={0.5}>
                    <UseSpriteSymbol name={getIconByPattern(_framework)} width={16} height={16} />
                    <Typography variant={"caption"} color={theme.palette.secondary.dark}>
                      {framework
                        ? codebaseMappingByLang?.frameworks?.[framework]?.name ||
                          (_framework && capitalizeFirstLetter(_framework)) ||
                          "N/A"
                        : "N/A"}
                    </Typography>
                  </Stack>
                </Stack>
              </Grid>
              <Grid item lg={4}>
                <Stack spacing={0.5}>
                  <Typography variant={"caption"}>Build Tool:</Typography>
                  <Stack direction="row" spacing={0.5}>
                    <UseSpriteSymbol name={getIconByPattern(_buildTool)} width={16} height={16} />
                    <Typography variant={"caption"} color={theme.palette.secondary.dark}>
                      {codebaseMappingByLang?.buildTools?.[buildTool]?.name || capitalizeFirstLetter(_buildTool)}
                    </Typography>
                  </Stack>
                </Stack>
              </Grid>
            </Grid>
          </Box>
          <Box>
            <Grid container spacing={1} alignItems={"center"}>
              <Grid item lg={4}>
                <Stack spacing={0.5} alignItems="flex-start">
                  <Typography variant={"caption"}>Type:</Typography>
                  <Chip size={"small"} label={type} sx={{ backgroundColor: theme.palette.secondary.main }} />
                </Stack>
              </Grid>
              <Grid item lg={4}>
                <Stack spacing={0.5} alignItems="flex-start">
                  <Typography variant={"caption"}>Category:</Typography>
                  <Chip size={"small"} label={category} sx={{ backgroundColor: theme.palette.secondary.main }} />
                </Stack>
              </Grid>
              <Grid item lg={4}>
                <Stack spacing={0.5} alignItems="flex-start">
                  <Typography variant={"caption"}>Maturity:</Typography>
                  <Chip size={"small"} label={maturity} sx={{ backgroundColor: theme.palette.secondary.main }} />
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </Stack>
        <Stack direction="row" spacing={2} alignItems="flex-end" justifyContent="space-between">
          <Stack spacing={0.5}>
            <Typography variant={"caption"}>Version</Typography>
            <Typography variant={"body1"}>{version}</Typography>
          </Stack>
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
        </Stack>
      </Stack>
    </Box>
  );
};
