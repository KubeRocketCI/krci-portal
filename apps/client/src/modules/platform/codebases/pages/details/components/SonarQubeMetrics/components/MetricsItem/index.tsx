import React from "react";

export const MetricsItem = ({
  leftSlot,
  rightSlot,
  title,
  titleIcon,
  link,
}: {
  leftSlot: React.ReactNode;
  rightSlot: React.ReactNode;
  title: string;
  titleIcon?: React.ReactNode;
  link: string | undefined;
}) => {
  return (
    <a href={link} target={"_blank"} rel="noopener noreferrer" className="text-inherit no-underline">
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-1">
          <div>{leftSlot}</div>
          <div>{rightSlot}</div>
        </div>
        <span className="text-muted-foreground flex items-center gap-1 text-xs">
          {titleIcon} {title}
        </span>
      </div>
    </a>
  );
};
