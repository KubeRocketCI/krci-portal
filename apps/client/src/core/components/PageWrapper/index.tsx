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
    <div className="flex min-h-0 flex-1 flex-col">
      {hasBreadcrumbs ? (
        <div className="flex h-(--breadcrumbs-height) shrink-0 border-b px-4">
          <div className="flex w-full items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-4">
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  {breadcrumbs?.map(({ label, route }, index, array) => {
                    const isLast = index === array.length - 1;
                    const key = `breadcrumb-${label}`;

                    return (
                      <React.Fragment key={key}>
                        {route ? (
                          <Button variant="link" asChild className="p-0">
                            <Link to={route.to} params={route.params} search={route.search}>
                              {label}
                            </Link>
                          </Button>
                        ) : (
                          <span className={isLast ? "text-foreground" : ""}>{label}</span>
                        )}
                        {!isLast && <span>/</span>}
                      </React.Fragment>
                    );
                  })}
                </div>
                <div className="ml-auto">{breadcrumbsExtraContent}</div>
              </div>
            </div>
            <div>{headerSlot}</div>
          </div>
        </div>
      ) : null}
      <div className="flex min-h-0 flex-1 flex-col px-6 py-(--content-offset-y)">{children}</div>
    </div>
  );
};
