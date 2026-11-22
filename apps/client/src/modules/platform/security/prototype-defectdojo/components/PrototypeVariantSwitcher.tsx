// PROTOTYPE (EPMDEDP-16072): throwaway. Not for main.
import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface PrototypeVariant<K extends string> {
  key: K;
  name: string;
}

export interface PrototypeVariantSwitcherProps<K extends string> {
  variants: PrototypeVariant<K>[];
  current: K;
  onChange: (key: K) => void;
}

function isTextEntry(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  return target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
}

/**
 * Floating bar that cycles the variants of a UI prototype. Left and Right arrow keys cycle too,
 * except while a text field has focus. Renders nothing in production builds.
 */
export function PrototypeVariantSwitcher<K extends string>({
  variants,
  current,
  onChange,
}: PrototypeVariantSwitcherProps<K>) {
  const currentIndex = Math.max(
    0,
    variants.findIndex((variant) => variant.key === current)
  );

  const cycle = React.useCallback(
    (step: number) => {
      const next = variants[(currentIndex + step + variants.length) % variants.length];
      onChange(next.key);
    },
    [variants, currentIndex, onChange]
  );

  React.useEffect(() => {
    if (import.meta.env.PROD) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isTextEntry(event.target) || event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }
      if (event.key === "ArrowLeft") {
        cycle(-1);
      } else if (event.key === "ArrowRight") {
        cycle(1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cycle]);

  if (import.meta.env.PROD) {
    return null;
  }

  const variant = variants[currentIndex];

  return (
    <div
      role="group"
      aria-label="Prototype variant"
      className="fixed bottom-4 left-1/2 z-[1500] flex -translate-x-1/2 items-center gap-1 rounded-full bg-black px-2 py-1.5 text-sm text-white shadow-2xl ring-2 ring-fuchsia-500"
    >
      <button
        type="button"
        aria-label="Previous variant"
        className="rounded-full p-1 hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
        onClick={() => cycle(-1)}
      >
        <ChevronLeft className="size-4" />
      </button>
      <span className="px-2 font-medium whitespace-nowrap" aria-live="polite">
        <span className="text-fuchsia-300">PROTOTYPE</span> {variant.key} ({variant.name})
      </span>
      <button
        type="button"
        aria-label="Next variant"
        className="rounded-full p-1 hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
        onClick={() => cycle(1)}
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
