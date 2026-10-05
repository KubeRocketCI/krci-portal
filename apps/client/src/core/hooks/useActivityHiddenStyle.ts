import type { CSSProperties } from "react";
import { useEffect, useState } from "react";

/** Returns `style` plus `display: none` while the caller's effects are disconnected (hidden `<Activity>`). */
export function useActivityHiddenStyle(style?: CSSProperties): CSSProperties | undefined {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    setIsConnected(true);
    return () => setIsConnected(false);
  }, []);

  return isConnected ? style : { ...style, display: "none" };
}
