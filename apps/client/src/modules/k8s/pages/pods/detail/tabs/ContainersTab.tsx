import type { Pod } from "@my-project/shared";
import { ContainerInfoCard } from "../components/ContainerInfoCard";

type ContainerStatusLike = NonNullable<NonNullable<Pod["status"]>["containerStatuses"]>[number];

export function ContainersTab({ pod }: { pod: Pod }) {
  const initContainers = pod.spec?.initContainers ?? [];
  const containers = pod.spec?.containers ?? [];
  const initStatuses = pod.status?.initContainerStatuses ?? [];
  const containerStatuses = pod.status?.containerStatuses ?? [];

  const findStatus = (statuses: ContainerStatusLike[], name: string) => statuses.find((s) => s.name === name);

  return (
    <div className="flex flex-col gap-4 p-4">
      {initContainers.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            Init Containers ({initContainers.length})
          </h2>
          {initContainers.map((c) => (
            <ContainerInfoCard
              key={`init::${c.name}`}
              container={c}
              status={findStatus(initStatuses, c.name)}
              variant="init"
            />
          ))}
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          Containers ({containers.length})
        </h2>
        {containers.map((c) => (
          <ContainerInfoCard
            key={`main::${c.name}`}
            container={c}
            status={findStatus(containerStatuses, c.name)}
            variant="main"
          />
        ))}
      </section>
    </div>
  );
}
