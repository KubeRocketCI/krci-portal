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
      <div className="flex flex-col gap-6">
        <div>
          <Form activeClusterType={activeClusterType} setActiveClusterType={setActiveClusterType} />
        </div>
        <div>
          <FormActions activeClusterType={activeClusterType} />
        </div>
      </div>
    </FormContextProvider>
  );
};
