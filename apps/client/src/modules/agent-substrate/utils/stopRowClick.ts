import type React from "react";

/** Actor and agent table rows navigate on click; a link in a cell stops that. */
export const stopRowClick = (event: React.MouseEvent) => event.stopPropagation();
