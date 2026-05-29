import { createRoute } from "@tanstack/react-router";
import { z } from "zod";
import { routeK8sCRParent } from "../cr-parent/route";
import { PATH_K8S_CR_LIST, PATH_K8S_CR_LIST_FULL } from "@/modules/k8s/constants/paths";

// Derived from the full path constant to avoid drift if the path ever changes.
export const ROUTE_ID_K8S_CR_LIST = `/_layout${PATH_K8S_CR_LIST_FULL}` as const;

// `.passthrough()` is required so the dynamic `pc:${printerColumn.name}` keys
// emitted by FilterProvider's syncWithUrl survive route validation. Without it,
// Zod strips every key the schema doesn't explicitly declare, and the URL never
// actually round-trips the filter values written by the UI.
const searchSchema = z
  .object({
    namespace: z.string().optional(),
    search: z.string().optional(),
  })
  .passthrough();

export const routeK8sCRList = createRoute({
  getParentRoute: () => routeK8sCRParent,
  path: PATH_K8S_CR_LIST,
  validateSearch: (search: Record<string, unknown>) => searchSchema.parse(search),
  head: () => ({ meta: [{ title: "Custom Resources | KRCI" }] }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
