import React from "react";

export const TabSection = ({ children, title }: { children: React.ReactNode; title: string | React.ReactNode }) => {
  return (
    <div className="mt-6">
      <div className="flex flex-col gap-6">
        <div>{typeof title === "string" ? <h2 className="text-foreground text-3xl">{title}</h2> : title}</div>
        {children}
      </div>
    </div>
  );
};
