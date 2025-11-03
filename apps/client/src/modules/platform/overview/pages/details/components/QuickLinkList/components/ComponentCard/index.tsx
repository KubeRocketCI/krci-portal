import { Card, IconButton, Link as MuiLink, useTheme } from "@mui/material";
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
      <div className="flex flex-row items-center justify-between gap-4">
        <MuiLink href={_url} target="_blank" rel="noopener" style={{ minWidth: 0 }}>
          <div className="flex flex-row items-center gap-4">
            <span className={classes.serviceItemIcon}>
              <img src={`data:image/svg+xml;base64,${icon}`} alt="" />
            </span>
            <div style={{ minWidth: 0 }}>
              <TextWithTooltip text={name} />
            </div>
          </div>
        </MuiLink>
        <IconButton
          ref={buttonRef}
          aria-label={"Options"}
          onClick={() => handleOpenResourceActionListMenu(buttonRef.current, component)}
          size="medium"
        >
          <EllipsisVertical size={20} color={theme.palette.secondary.dark} />
        </IconButton>
      </div>
    </Card>
  );
};
