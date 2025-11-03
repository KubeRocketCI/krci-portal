import { ListItemAction } from "@/core/types/global";

export interface ActionsMenuListProps {
  actions: ListItemAction[];
  handleCloseActionsMenu: ((event: MouseEvent | TouchEvent) => void) | undefined;
  anchorEl?: HTMLElement | null;
}
