import { TooltipWithLinkList } from "@/core/components/TooltipWithLinkList";
import { Application } from "@my-project/shared";

export const IngressColumn = ({ application }: { application: Application }) => {
  const externalURLs = application?.status?.summary?.externalURLs;

  if (!externalURLs) {
    return null;
  }

  return <TooltipWithLinkList urls={externalURLs} />;
};
