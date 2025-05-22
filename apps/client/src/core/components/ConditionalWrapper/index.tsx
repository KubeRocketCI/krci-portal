import React from "react";
import { ConditionalWrapperProps } from "./types";
export const ConditionalWrapper = ({ condition, wrapper, children }: ConditionalWrapperProps): React.ReactElement => {
  return <>{condition ? wrapper(children) : children}</>;
};
