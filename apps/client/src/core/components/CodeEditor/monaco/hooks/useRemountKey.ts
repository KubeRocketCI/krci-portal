import { useEffect, useState } from "react";

/**
 * Key for a child that disposes resources in effect cleanup and does not rebuild them when its effects reconnect.
 * Changes when this component's effects are cleaned up while it stays mounted (hidden `<Activity>`).
 * Bump in cleanup only. Child effects reconnect before parent effects.
 * The child loses all internal state; pass its content through controlled props.
 */
export function useRemountKey(): number {
  const [key, setKey] = useState(0);

  useEffect(() => () => setKey((prev) => prev + 1), []);

  return key;
}
