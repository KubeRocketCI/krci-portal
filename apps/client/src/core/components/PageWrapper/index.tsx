import { Breadcrumbs } from "@mui/material";
import React from "react";
import { PageWrapperProps } from "./types";
import { Link } from "@tanstack/react-router";
import { Button } from "../ui/button";

export const PageWrapper: React.FC<PageWrapperProps> = ({
  children,
  breadcrumbs,
  headerSlot,
  breadcrumbsExtraContent,
}) => {
  const hasBreadcrumbs = !!breadcrumbs && !!breadcrumbs.length;

  return (
    <div className="flex flex-col grow pb-30">
      {hasBreadcrumbs ? (
        <div className="my-2 flex h-12 border-b px-4">
          <div className="flex gap-2 items-center justify-between w-full">
            <div>
              <div className="flex gap-4 items-center">
                <div>
                  <Breadcrumbs>
                    {breadcrumbs?.map(({ label, route }) => {
                      const key = `breadcrumb-${label}`;

                      return route ? (
                        <Button variant="link" asChild key={key} className="p-0">
                          <Link to={route.to} params={route.params}>
                            {label}
                          </Link>
                        </Button>
                      ) : (
                        <span
                          key={key}
                          className="mb-1 text-sm text-foreground"
                        >
                          {label}
                        </span>
                      );
                    })}
                  </Breadcrumbs>
                </div>
                <div>{breadcrumbsExtraContent}</div>
              </div>
            </div>
            <div>{headerSlot}</div>
          </div>
        </div>
      ) : null}
      <div className="grow px-6 py-4">{children}</div>
    </div>
  );
};
