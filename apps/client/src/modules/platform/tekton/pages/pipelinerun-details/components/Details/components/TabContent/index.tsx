import React from "react";

export const TabContent = ({ children }: { children: React.ReactNode }) => {
  return <div className="pt-6 h-full overflow-hidden">{children}</div>;
};
