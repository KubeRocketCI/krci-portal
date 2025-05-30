import { Box, Tooltip, Typography } from "@mui/material";
import { Info } from "lucide-react";
import { useStyles } from "./styles";
import { FormControlLabelWithTooltipProps } from "./types";

export const FormControlLabelWithTooltip = ({ label, title, disabled }: FormControlLabelWithTooltipProps) => {
  const classes = useStyles(disabled);

  return (
    <span className={classes.labelWrap}>
      <Typography component={"span"} className={classes.label}>
        {label}
      </Typography>
      {title ? (
        <Tooltip title={title}>
          <Info size={16} />
        </Tooltip>
      ) : (
        <Box sx={{ height: (t) => t.typography.pxToRem(20) }} />
      )}
    </span>
  );
};
