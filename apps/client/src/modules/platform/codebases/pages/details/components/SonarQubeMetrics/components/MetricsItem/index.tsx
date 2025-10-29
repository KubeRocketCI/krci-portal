import { Link } from '@mui/material';
import React from 'react';

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
    <Link href={link} target={'_blank'} color="inherit" underline="none">
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-1">
          <div>{leftSlot}</div>
          <div>{rightSlot}</div>
        </div>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          {titleIcon} {title}
        </span>
      </div>
    </Link>
  );
};
