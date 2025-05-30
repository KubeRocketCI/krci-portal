import { QuickLink } from "@my-project/shared";

export const getQuickLinkURLsFromList = (quickLinks: QuickLink[]): Record<string, string> => {
  return quickLinks.reduce(
    (acc, link) => {
      acc[link.metadata.name] = link.spec.url;
      return acc;
    },
    {} as Record<string, string>
  );
};
