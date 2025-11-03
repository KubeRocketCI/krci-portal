export const LegendListItem = ({ color, number, label }: { color: string; number: number; label: string }) => {
  return (
    <div className="flex flex-row items-center gap-2">
      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-foreground text-base font-medium">{number}</span>
      <span className="text-muted-foreground text-base">{label}</span>
    </div>
  );
};
