import { CriticalError } from "../../components/CriticalError";

export function RouterErrorComponent({ error }: { error: Error }) {
  return (
    <CriticalError
      title="Navigation Error"
      message="An error occurred while navigating. This might be due to a network issue or a problem with the route."
      error={error}
      showActions={true}
    />
  );
}
