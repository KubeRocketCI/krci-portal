import { Pod } from "@my-project/shared";

export interface PodExecTerminalProps {
  namespace: string;
  pods: Pod[];
  selectedPod?: string; // Optional pod name to select
  container?: string;
  clusterName: string;
  isAttach?: boolean;
  height?: number;
}

export interface XTerminalConnected {
  xterm: import("@xterm/xterm").Terminal;
  connected: boolean;
  reconnectOnEnter: boolean;
}

export enum Channel {
  StdIn = 0,
  StdOut,
  StdErr,
  ServerError,
  Resize,
}
