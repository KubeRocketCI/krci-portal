import { DefaultTheme } from "@mui/styles/defaultTheme";
import makeStyles from "@mui/styles/makeStyles";

export const useStyles = makeStyles((theme: DefaultTheme) => ({
  radioGroup: {
    gap: theme.typography.pxToRem(10),
  },
  radioControlButton: {
    borderRadius: theme.typography.pxToRem(5),
    border: "1px solid transparent",
    backgroundColor: "transparent",
    transition: "background-color 300ms ease, border 300ms ease",
    boxShadow: "0px 1px 10px 0px #0024461F",

    "&:hover": {
      backgroundColor: `${theme.palette.primary.main}20`,
    },

    "& .MuiTouchRipple-child": {
      backgroundColor: theme.palette.primary.main,
    },
  },
  radioControlButtonActive: {
    backgroundColor: `${theme.palette.primary.main}10`,
    border: `1px solid ${theme.palette.primary.main}80`,
  },
  radioControlLabel: {
    margin: 0,
    gap: theme.typography.pxToRem(10),
    padding: `${theme.typography.pxToRem(5)} ${theme.typography.pxToRem(8)}`,

    "& .MuiButtonBase-root": {
      color: "#000",
    },

    "& .MuiRadio-root": {
      padding: 0,
      position: "static",

      "&:hover": {
        backgroundColor: "transparent",
      },
    },
  },
  radioControlLabelDisabled: {
    "& .MuiFormControlLabel-label": {
      color: theme.palette.text.disabled,
    },
  },
}));
