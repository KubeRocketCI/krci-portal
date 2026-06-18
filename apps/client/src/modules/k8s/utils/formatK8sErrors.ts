import { getK8sErrorMessage } from "@/k8s/api/utils/getK8sErrorMessage";
import type { RequestError } from "@/core/types/global";

/**
 * Converts per-namespace watch errors into `Error`s for the table's non-blocking
 * banner: when listing across several allowed namespaces, a failure in one (e.g. a
 * `403`) must not hide the resources from the namespaces that are accessible.
 */
export function formatK8sErrors(errors: RequestError[] | null | undefined): Error[] {
  if (!errors || errors.length === 0) {
    return [];
  }
  return errors.map((error) => new Error(getK8sErrorMessage(error)));
}
