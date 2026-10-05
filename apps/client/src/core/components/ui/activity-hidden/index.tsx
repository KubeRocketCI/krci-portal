import type * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { useActivityHiddenStyle } from "@/core/hooks/useActivityHiddenStyle";

/**
 * Adds `display: none` to its only child while a hidden `<Activity>` has disconnected its effects.
 * Activity does not hide portals. Place directly inside a Radix `Portal`; the Portal mounts it only while open.
 * Do not use `open={false}` instead: closed content stays mounted until its exit animation ends, and that
 * listener is disconnected too.
 */
function ActivityHidden({ style, ...props }: React.ComponentProps<typeof Slot>) {
  return <Slot {...props} style={useActivityHiddenStyle(style)} />;
}

export { ActivityHidden };
