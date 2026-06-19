import { Application } from "@my-project/shared";
import { useHTTPRouteURLsByApp } from "../../hooks/useHTTPRouteURLsByApp";
import { IngressColumn } from "./Ingress";

/**
 * Live "URLs" cell: derives this app's HTTPRoute URLs from the cluster and
 * merges them with Argo CD's Ingress-derived externalURLs.
 *
 * The hook is called HERE (inside the cell) rather than in useColumns because
 * the table freezes column render closures (useColumnSync) and would otherwise
 * keep the empty first-render value. As a live component, this re-renders when
 * the Gateway/HTTPRoute watches resolve.
 */
export const IngressColumnLive = ({
  application,
  appName,
}: {
  application: Application | undefined;
  appName: string;
}) => {
  const urlsByApp = useHTTPRouteURLsByApp();
  return <IngressColumn application={application!} extraURLs={urlsByApp.get(appName) ?? []} />;
};
