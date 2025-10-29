import { Alert } from '@mui/material';
import React from 'react';
import { useDataContext } from '../../providers/Data/hooks';
import { ExternalURL } from './fields/ExternalURL';

export const QuickLinkForm = () => {
  const { quickLink } = useDataContext();

  return (
    <div className="flex flex-col gap-2">
      {!quickLink && (
        <div>
          <Alert severity="info" variant="outlined">
            Nexus QuickLink has not been found. Please, create it first in order to manage the
            integration.
          </Alert>
        </div>
      )}
      <ExternalURL />
    </div>
  );
};
