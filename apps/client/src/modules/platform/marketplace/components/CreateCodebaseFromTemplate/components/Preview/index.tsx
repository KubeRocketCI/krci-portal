import { UseSpriteSymbol } from "@/core/components/sprites/K8sRelatedIconsSVGSprite";
import { capitalizeFirstLetter } from "@/core/utils/format/capitalizeFirstLetter";
import { CodebaseInterface } from "@/k8s/api/groups/KRCI/Codebase/configs/mappings/types";
import { getMappingByType } from "@/k8s/api/groups/KRCI/Codebase/utils/getMappingByType";
import { getIconByPattern } from "@/k8s/api/groups/KRCI/Codebase/utils/icon-mappings";
import { Box, Grid, Link, Tooltip, Typography } from "@mui/material";
import makeStyles from "@mui/styles/makeStyles";
import React from "react";
import { useCurrentDialog } from "../../providers/CurrentDialog/hooks";

// eslint-disable-next-line react-refresh/only-export-components
export const useStyles = makeStyles((theme) => ({
  drawerPaper: {
    top: "64px",
    bottom: 0,
    padding: `${theme.typography.pxToRem(20)}`,
    maxWidth: theme.typography.pxToRem(500),
  },
  templateName: {
    display: "-webkit-box",
    "-webkit-line-clamp": 4,
    "-webkit-box-orient": "vertical",
    overflow: "hidden",
  },
}));

export const Preview = () => {
  const {
    props: { template },
  } = useCurrentDialog();
  const classes = useStyles();
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
      <Box sx={{ mt: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Grid container spacing={2} alignItems={"center"} justifyContent={"space-between"} wrap={"nowrap"}>
              <Grid item xs={10}>
                <Grid container spacing={2} alignItems={"center"} wrap={"nowrap"}>
                  <Grid item>
                    <img
                      style={{ width: "40px" }}
                      src={`data:${template?.spec?.icon?.[0]?.mediatype};base64,${template?.spec?.icon?.[0]?.base64data}`}
                      alt=""
                    />
                  </Grid>
                  <Grid item>
                    <Tooltip title={template?.spec.displayName}>
                      <Typography variant={"h5"} className={classes.templateName}>
                        {template?.spec.displayName}
                      </Typography>
                    </Tooltip>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12}>
            <Typography variant={"body2"}>{template?.spec.description}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Grid container alignItems={"flex-start"} spacing={2}>
              <Grid item xs={4}>
                <Typography variant={"body1"} gutterBottom>
                  Language
                </Typography>
                <Grid container spacing={1} alignItems={"center"}>
                  <Grid item>
                    <UseSpriteSymbol name={getIconByPattern(language)} width={20} height={20} />
                  </Grid>
                  <Grid item>{codebaseMappingByLang?.language?.name || capitalizeFirstLetter(lang)}</Grid>
                </Grid>
              </Grid>
              <Grid item xs={4}>
                <Typography variant={"body1"} gutterBottom>
                  Framework
                </Typography>
                <Grid container spacing={1} alignItems={"center"}>
                  <Grid item>
                    <UseSpriteSymbol name={getIconByPattern(_framework)} width={20} height={20} />
                  </Grid>
                  <Grid item>
                    {framework
                      ? codebaseMappingByLang?.frameworks?.[framework]?.name ||
                        (_framework && capitalizeFirstLetter(_framework)) ||
                        "N/A"
                      : "N/A"}
                  </Grid>
                </Grid>
              </Grid>
              <Grid item xs={4}>
                <Typography variant={"body1"} gutterBottom>
                  Build Tool
                </Typography>
                <Grid container spacing={1} alignItems={"center"}>
                  <Grid item>
                    <UseSpriteSymbol name={getIconByPattern(_buildTool)} width={20} height={20} />
                  </Grid>
                  <Grid item>
                    {codebaseMappingByLang?.buildTools?.[buildTool]?.name || capitalizeFirstLetter(_buildTool)}
                  </Grid>
                </Grid>
              </Grid>
              <Grid item xs={4}>
                <Typography variant={"body1"} gutterBottom>
                  Type
                </Typography>
                <Typography variant={"body2"}>{template?.spec.type}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant={"body1"} gutterBottom>
                  Category
                </Typography>
                <Typography variant={"body2"}>{template?.spec.category}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant={"body1"} gutterBottom>
                  Maturity
                </Typography>
                <Typography variant={"body2"}>{template?.spec.maturity}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant={"body1"} gutterBottom>
                  Version
                </Typography>
                <Typography variant={"body2"}>{template?.spec.version}</Typography>
              </Grid>
              <Grid item xs={8}>
                <Typography variant={"body1"} gutterBottom>
                  Source
                </Typography>
                <Link href={template?.spec.source} target={"_blank"}>
                  {template?.spec.source}
                </Link>
              </Grid>
              <Grid item xs={12}>
                <Typography variant={"body1"} gutterBottom>
                  Maintainers
                </Typography>
                {(template?.spec.maintainers || []).map((maintainer) => {
                  return (
                    <Typography gutterBottom key={maintainer.name}>
                      <div>
                        <Typography variant={"body2"} component={"span"}>
                          Name:{" "}
                        </Typography>
                        <Typography variant={"caption"} component={"span"}>
                          {maintainer.name}
                        </Typography>
                      </div>
                      <div>
                        <Typography variant={"body2"} component={"span"}>
                          Email:{" "}
                        </Typography>
                        <Typography variant={"caption"} component={"span"}>
                          {maintainer.email}
                        </Typography>
                      </div>
                    </Typography>
                  );
                })}
              </Grid>
              {template?.spec.keywords && (
                <Grid item xs={12}>
                  <Typography variant={"body1"} gutterBottom>
                    Keywords
                  </Typography>
                  {(template?.spec.keywords || []).map((el, idx) => {
                    const propertyId = `${el}:${idx}`;

                    return (
                      <React.Fragment key={propertyId}>
                        <>
                          {idx !== 0 && <Typography component="span">, </Typography>}
                          <Typography component="span" variant={"caption"}>
                            {el}
                          </Typography>
                        </>
                      </React.Fragment>
                    );
                  })}
                </Grid>
              )}
            </Grid>
          </Grid>
        </Grid>
      </Box>
    )
  );
};
