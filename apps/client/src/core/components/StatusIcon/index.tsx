import { Tooltip } from "@/core/components/ui/tooltip";
import { cn } from "@/core/utils/classname";
import React from "react";
import { ConditionalWrapper } from "../ConditionalWrapper";
import { iconClasses, rotateIconClasses } from "./styles";
import { StatusIconProps } from "./types";

const stopPropagation = (e: React.SyntheticEvent) => e.stopPropagation();

export const StatusIcon = ({ Title, Icon, color, isSpinning = false, width = 20 }: StatusIconProps) => {
  return (
    <div onClick={stopPropagation}>
      <ConditionalWrapper condition={!!Title} wrapper={(children) => <Tooltip title={Title}>{children}</Tooltip>}>
        <Icon color={color} width={width} className={cn(iconClasses, isSpinning && rotateIconClasses)} />
      </ConditionalWrapper>
    </div>
  );
};
