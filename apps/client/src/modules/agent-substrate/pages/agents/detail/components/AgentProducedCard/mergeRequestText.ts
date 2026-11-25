import type { MergeRequest } from "@my-project/shared";

export const mergeRequestText = ({ number }: MergeRequest) => `!${number}`;
