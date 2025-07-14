import { Button, ButtonProps, Grid, IconButton, Link as MuiLink, Tooltip, useTheme } from "@mui/material";
import React from "react";
import { ResourceIconLinkProps } from "./types";
import { SquareArrowOutUpRight } from "lucide-react";

const stopPropagation = (e: React.SyntheticEvent) => e.stopPropagation();

const iconSizeByBtnSize = (btnSize: ButtonProps["size"]) => {
  switch (btnSize) {
    case "small":
      return 16;
    case "medium":
      return 20;
  }
};

const DisabledResourceIconLink = ({
  tooltipTitle,
  Icon,
  iconBase64,
  withoutDisabledStyle,
  variant,
  isTextButton,
  name,
  size,
}: ResourceIconLinkProps) => {
  const theme = useTheme();

  const iconSize = iconSizeByBtnSize(size);

  return isTextButton ? (
    <Button
      variant={variant}
      disabled
      sx={!withoutDisabledStyle ? { opacity: 0.5 } : {}}
      endIcon={<SquareArrowOutUpRight color={theme.palette.grey["500"]} size={iconSize} />}
      size={size}
    >
      {name}
    </Button>
  ) : (
    <Tooltip title={<div>{tooltipTitle}</div>}>
      <div>
        <IconButton disabled style={!withoutDisabledStyle ? { opacity: 0.5 } : {}} size={size}>
          {iconBase64 ? (
            <img
              src={`data:image/svg+xml;base64,${iconBase64}`}
              style={{ width: theme.typography.pxToRem(16), height: theme.typography.pxToRem(16) }}
              alt=""
            />
          ) : Icon ? (
            Icon
          ) : null}
        </IconButton>
      </div>
    </Tooltip>
  );
};

const EnabledResourceIconLink = ({
  tooltipTitle,
  Icon,
  iconBase64,
  link,
  variant,
  isTextButton,
  name,
  size,
}: ResourceIconLinkProps) => {
  const theme = useTheme();
  const iconSize = iconSizeByBtnSize(size);

  return isTextButton ? (
    <Button
      variant={variant}
      component={MuiLink}
      href={link}
      target={"_blank"}
      endIcon={<SquareArrowOutUpRight size={iconSize} />}
      size={size}
      sx={{ color: theme.palette.secondary.dark, borderColor: theme.palette.secondary.dark }}
    >
      {name}
    </Button>
  ) : (
    <Tooltip
      title={
        <Grid container alignItems={"center"} spacing={1}>
          <Grid item>{tooltipTitle}</Grid>
          <span> </span>
          <Grid item>
            <SquareArrowOutUpRight size={iconSize} />
          </Grid>
        </Grid>
      }
    >
      <span>
        <IconButton component={MuiLink} href={link} target={"_blank"} size={size}>
          {iconBase64 ? (
            <img
              src={`data:image/svg+xml;base64,${iconBase64}`}
              style={{ width: theme.typography.pxToRem(16), height: theme.typography.pxToRem(16) }}
              alt=""
            />
          ) : Icon ? (
            Icon
          ) : null}
        </IconButton>
      </span>
    </Tooltip>
  );
};

export const ResourceIconLink = ({
  disabled = false,
  tooltipTitle,
  Icon,
  iconBase64,
  link,
  withoutDisabledStyle,
  variant,
  name,
  size,
  isTextButton,
}: ResourceIconLinkProps) => {
  return (
    <div onClick={stopPropagation} onFocus={stopPropagation}>
      {disabled ? (
        <DisabledResourceIconLink
          tooltipTitle={tooltipTitle}
          Icon={Icon}
          iconBase64={iconBase64}
          withoutDisabledStyle={withoutDisabledStyle}
          variant={variant}
          isTextButton={isTextButton}
          name={name}
          size={size}
        />
      ) : (
        <EnabledResourceIconLink
          tooltipTitle={tooltipTitle}
          Icon={Icon}
          iconBase64={iconBase64}
          link={link}
          variant={variant}
          isTextButton={isTextButton}
          name={name}
          size={size}
        />
      )}
    </div>
  );
};
