import { Card, IconButton, Link as MuiLink, Stack, useTheme } from "@mui/material";
import React from "react";
import { useStyles } from "./styles";
import { ComponentCardProps } from "./types";
import { useResourceActionListContext } from "@/core/providers/ResourceActionList/hooks";
import { QuickLink } from "@my-project/shared";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { EllipsisVertical } from "lucide-react";

export const ComponentCard = ({ component }: ComponentCardProps) => {
  const theme = useTheme();
  const classes = useStyles();
  const {
    spec: { url, icon },
    metadata: { name },
  } = component;

  const _url = !/^https?:\/\//i.test(url) ? `https://${url}` : url;
  const buttonRef = React.createRef<HTMLButtonElement>();
  const { handleOpenResourceActionListMenu } = useResourceActionListContext<QuickLink>();

  return (
    <Card className={classes.cardRoot}>
      <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
        <MuiLink href={_url} target="_blank" rel="noopener" style={{ minWidth: 0 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <span className={classes.serviceItemIcon}>
              <img src={`data:image/svg+xml;base64,${icon}`} alt="" />
            </span>
            <div style={{ minWidth: 0 }}>
              <TextWithTooltip text={name} />
            </div>
          </Stack>
        </MuiLink>
        <IconButton
          ref={buttonRef}
          aria-label={"Options"}
          onClick={() => handleOpenResourceActionListMenu(buttonRef.current, component)}
          size="medium"
        >
          <EllipsisVertical size={20} color={theme.palette.secondary.dark} />
        </IconButton>
      </Stack>
    </Card>
  );
};
