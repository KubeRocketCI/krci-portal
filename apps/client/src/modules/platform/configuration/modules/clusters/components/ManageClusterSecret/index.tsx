import { Grid } from "@mui/material";
import { Create } from "./components/Create";
import { Edit } from "./components/Edit";
import { ManageClusterSecretProps } from "./types";
import { FORM_MODES } from "@/core/types/forms";

export const ManageClusterSecret = ({ formData }: ManageClusterSecretProps) => {
  const { mode } = formData;

  return (
    <Grid container spacing={2} data-testid="form">
      <Grid item xs={12}>
        {mode === FORM_MODES.CREATE ? <Create formData={formData} /> : <Edit formData={formData} />}
      </Grid>
    </Grid>
  );
};
