import { Grid } from '@mui/material';
import { Form } from './components/Form';
import { FormActions } from './components/FormActions';
import { useDefaultValues } from './hooks/useDefaultValues';
import { EditProps } from './types';
import { FormContextProvider } from '@/core/providers/Form/provider';

export const Edit = ({ formData }: EditProps) => {
  const baseDefaultValues = useDefaultValues({ formData });

  return (
    <FormContextProvider
      formSettings={{
        mode: 'onBlur',
        defaultValues: baseDefaultValues,
      }}
      formData={formData}
    >
      <Grid container spacing={4}>
        <Grid item xs={12}>
          <Form />
        </Grid>
        <Grid item xs={12}>
          <FormActions />
        </Grid>
      </Grid>
    </FormContextProvider>
  );
};
