const RADIX_DIALOG_A11Y_WARNING =
  /Missing `Description` or `aria-describedby=\{undefined\}`|`DialogContent` requires a `DialogTitle`/;

export function findRadixDialogWarnings(calls: readonly unknown[][]): string[] {
  return calls.map((args) => String(args[0])).filter((message) => RADIX_DIALOG_A11Y_WARNING.test(message));
}
