import { Tooltip } from "@mui/material";
import clsx from "clsx";
import React from "react";
import { ConditionalWrapper } from "../ConditionalWrapper";
import { useStyles } from "./styles";
import { StatusIconProps } from "./types";

const stopPropagation = (e: React.SyntheticEvent) => e.stopPropagation();

export const StatusIcon = ({ Title, Icon, color, isSpinning = false, width = 20 }: StatusIconProps) => {
  const classes = useStyles();

  return (
    <div onClick={stopPropagation}>
      <ConditionalWrapper condition={!!Title} wrapper={(children) => <Tooltip title={Title}>{children}</Tooltip>}>
        <Icon
          color={color}
          width={width}
          className={clsx(classes.icon, {
            [classes.rotateIcon]: isSpinning,
          })}
        />
      </ConditionalWrapper>
    </div>
  );
};
