import React from 'react';
import { ApiUrl, TokenEndpoint } from './fields';

export const CodemieForm = () => {
  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-6">
        <ApiUrl />
      </div>
      <div className="col-span-6">
        <TokenEndpoint />
      </div>
    </div>
  );
};
