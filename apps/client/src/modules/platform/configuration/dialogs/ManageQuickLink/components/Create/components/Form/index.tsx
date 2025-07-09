import { Grid } from "@mui/material";
import { Icon, Name, URL, Visible } from "../../../fields";

export const Form = () => {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <Name />
          </Grid>
          <Grid item xs={4}>
            <URL />
          </Grid>
          <Grid item xs={4} sx={{ marginTop: "auto" }}>
            <Visible />
          </Grid>
        </Grid>
      </Grid>
      <Grid item xs={12}>
        <Icon />
      </Grid>
    </Grid>
  );
};
