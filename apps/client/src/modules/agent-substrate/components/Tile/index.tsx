import type React from "react";
import { Card, CardContent } from "@/core/components/ui/card";
import { cn } from "@/core/utils/classname";

interface TileProps {
  title: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tone?: "bad";
}

export function Tile({ title, value, sub, tone }: TileProps) {
  return (
    <Card className={cn(tone === "bad" && "border-destructive/60")}>
      <CardContent className="space-y-1 p-4">
        <div className="text-muted-foreground text-xs">{title}</div>
        <div className="text-2xl font-semibold">{value}</div>
        {sub && <div className="text-muted-foreground text-xs">{sub}</div>}
      </CardContent>
    </Card>
  );
}
