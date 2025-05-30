import { ValueOf } from "@/core/types/global";

export const actionMenuType = {
  menu: "menu",
  inline: "inline",
} as const;

export type ActionMenuType = ValueOf<typeof actionMenuType>;
