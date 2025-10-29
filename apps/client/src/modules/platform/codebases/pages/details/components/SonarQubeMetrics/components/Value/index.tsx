import React from 'react';

export const Value = (props: { value?: string }) => {
  return (
    <span className="text-base text-foreground font-medium">
      {props.value}
    </span>
  );
};
