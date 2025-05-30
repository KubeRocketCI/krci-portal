import { ResourcesSVGSprite } from "@/core/k8s/icons/sprites/Resources";
import { Box, Grid, Stack, Typography, useTheme } from "@mui/material";
import { codebaseCreationStrategy, codebaseType } from "@my-project/shared";
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
  RepositoryLogin,
  RepositoryPasswordOrApiToken,
  RepositoryUrl,
  TestReportFramework,
} from "../../../../../../../fields";

export const Info = () => {
  const theme = useTheme();
  const { watch } = useTypedFormContext();

  const langFieldValue = watch(CODEBASE_FORM_NAMES.lang.name);
  const typeFieldValue = watch(CODEBASE_FORM_NAMES.type.name);
  const strategyFieldValue = watch(CODEBASE_FORM_NAMES.strategy.name) as string;
  const hasCodebaseAuthFieldValue = watch(CODEBASE_FORM_NAMES.hasCodebaseAuth.name);

  return (
    <>
      <ResourcesSVGSprite />
      <Grid container spacing={2}>
        <>
          {isCloneStrategy(strategyFieldValue) ? (
            <Grid item xs={12}>
              <RepositoryUrl />
            </Grid>
          ) : null}
          <Grid item xs={12}>
            <Stack direction="row" spacing={2}>
              <Box flexGrow={1} flexShrink={0}>
                <GitServer />
              </Box>
              <Typography sx={{ pt: theme.typography.pxToRem(18) }}>/</Typography>
              <Box flexGrow={1} flexShrink={0}>
                <GitUrlPath />
              </Box>
            </Stack>
          </Grid>
          {isCloneStrategy(strategyFieldValue) ? (
            <>
              <Grid item xs={12}>
                <CodebaseAuth />
              </Grid>
              {hasCodebaseAuthFieldValue ? (
                <>
                  <Grid item xs={12}>
                    <RepositoryLogin />
                  </Grid>
                  <Grid item xs={12}>
                    <RepositoryPasswordOrApiToken />
                  </Grid>
                </>
              ) : null}
            </>
          ) : null}
          <Grid item xs={12}>
            <Name />
          </Grid>
          <Grid item xs={12}>
            <Description />
          </Grid>
          {(strategyFieldValue === codebaseCreationStrategy.create ||
            strategyFieldValue === codebaseCreationStrategy.clone) && (
            <Grid item xs={12}>
              <Private />
            </Grid>
          )}
          {strategyFieldValue === codebaseCreationStrategy.create && (
            <Grid item xs={12}>
              <EmptyProject />
            </Grid>
          )}
          <Grid item xs={12}>
            <Lang />
          </Grid>
          {langFieldValue && (
            <Grid item xs={12}>
              <Framework />
            </Grid>
          )}
          {langFieldValue && (
            <Grid item xs={12}>
              <BuildTool />
            </Grid>
          )}
          {typeFieldValue === codebaseType.autotest && (
            <Grid item xs={12}>
              <TestReportFramework />
            </Grid>
          )}
        </>
      </Grid>
    </>
  );
};
