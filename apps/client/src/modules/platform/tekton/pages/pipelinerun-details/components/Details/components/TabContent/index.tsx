import React from "react";

export const TabContent = ({ children }: { children: React.ReactNode }) => {
  return <div className="h-full overflow-hidden pt-6">{children}</div>;
};
