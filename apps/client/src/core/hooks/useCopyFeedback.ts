import { useEffect, useRef, useState } from "react";

export const COPY_FEEDBACK_MS = 2000;

/**
 * Copy confirmation flag. `markCopied()` sets `copied`; it clears after `COPY_FEEDBACK_MS`.
 * Effect cleanup (unmount, hidden `<Activity>`) clears the timer and the flag.
 */
export function useCopyFeedback() {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(
    () => () => {
      clearTimeout(timeoutRef.current);
      setCopied(false);
    },
    []
  );

  const markCopied = () => {
    clearTimeout(timeoutRef.current);
    setCopied(true);
    timeoutRef.current = setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
  };

  return { copied, markCopied };
}
