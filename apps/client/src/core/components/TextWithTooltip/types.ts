export interface TextWithTooltipProps {
  /** `null`, `undefined` and `""` render `fallback`. Numbers are stringified. */
  text: string | number | null | undefined;
  /** Lines before the ellipsis. Default 1. A literal union: Tailwind needs literal class names. */
  maxLineAmount?: 1 | 2 | 3;
  /** Default "—". Pass "" to render nothing for an empty value. */
  fallback?: string;
  className?: string;
}
