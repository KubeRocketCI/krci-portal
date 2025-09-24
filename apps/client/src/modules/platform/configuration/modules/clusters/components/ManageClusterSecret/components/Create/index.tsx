import { Grid } from '@mui/material';
import React from 'react';
import { Form } from './components/Form';
import { FormActions } from './components/FormActions';
import { CreateProps } from './types';
import { clusterType, ClusterType } from '@my-project/shared';
import { FormContextProvider } from '@/core/providers/Form/provider';

export const Create = ({ formData }: CreateProps) => {
  const [activeClusterType, setActiveClusterType] = React.useState<ClusterType>(clusterType.bearer);

  return (
    <FormContextProvider
      formSettings={{
        mode: 'onBlur',
      }}
      formData={formData}
    >
      <Grid container spacing={4}>
        <Grid item xs={12}>
          <Form activeClusterType={activeClusterType} setActiveClusterType={setActiveClusterType} />
        </Grid>
        <Grid item xs={12}>
          <FormActions activeClusterType={activeClusterType} />
        </Grid>
      </Grid>
    </FormContextProvider>
  );
};
