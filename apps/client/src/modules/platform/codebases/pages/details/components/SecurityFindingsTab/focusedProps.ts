const FOCUSED_CLASS = "bg-primary/5 ring-primary ring-1 ring-inset";

function scrollIntoViewOnMount(element: HTMLElement | null) {
  element?.scrollIntoView({ block: "nearest" });
}

export function focusedProps(focused: boolean, scrollIntoView = false) {
  if (!focused) {
    return { className: undefined };
  }

  return {
    "data-focused": true,
    "aria-current": true,
    className: FOCUSED_CLASS,
    ref: scrollIntoView ? scrollIntoViewOnMount : undefined,
  } as const;
}
