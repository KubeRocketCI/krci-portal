export function Legend() {
  return (
    <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-xs">
      <span className="font-medium">Status:</span>
      <span>
        <span className="font-mono text-green-600">●</span> green = True (current gen)
      </span>
      <span>
        <span className="font-mono text-amber-600">○</span> amber = Unknown, stale, or AddressNotAssigned
      </span>
      <span>
        <span className="text-destructive font-mono">✗</span> red = False
      </span>
      <span className="text-muted-foreground/60">Sequence: [Accepted] [Programmed] [ResolvedRefs]</span>
    </div>
  );
}
