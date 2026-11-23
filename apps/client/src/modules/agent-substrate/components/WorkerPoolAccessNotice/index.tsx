import { k8sWorkerPoolConfig, type WorkerPoolAccess } from "@my-project/shared";
import { Alert } from "@/core/components/ui/alert";

const WORKER_POOL_RESOURCE = `${k8sWorkerPoolConfig.pluralName}.${k8sWorkerPoolConfig.group}`;

/** Capacity and room come from Agent Substrate and stay shown without access. */
export function WorkerPoolAccessNotice({ access }: { access: WorkerPoolAccess }) {
  switch (access) {
    case "ok":
      return null;
    case "denied":
      return (
        <Alert title="No access to worker pools">
          <p>
            You may not list <code>{WORKER_POOL_RESOURCE}</code> in a worker namespace, so replicas, sandbox class and
            resolution are not shown. Ask your cluster administrator to grant <code>list</code> on{" "}
            <code>{WORKER_POOL_RESOURCE}</code>.
          </p>
        </Alert>
      );
    case "error":
      return (
        <Alert title="Worker pools cannot be read">
          <p>Replicas, sandbox class and resolution are not shown. See the portal server logs for the error.</p>
        </Alert>
      );
  }
}
