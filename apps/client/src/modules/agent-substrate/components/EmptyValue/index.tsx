import { TextWithTooltip } from "@/core/components/TextWithTooltip";

export function EmptyValue() {
  return <span className="text-muted-foreground">—</span>;
}

export function TextOrEmpty({ text }: { text: string | null | undefined }) {
  return text ? <TextWithTooltip text={text} /> : <EmptyValue />;
}
