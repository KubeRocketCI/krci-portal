import React, { useState, useRef, useMemo, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import { Label } from "@/core/components/ui/label";
import { Terminal as XTerminal } from "@xterm/xterm";

import { Terminal } from "@/core/components/Terminal";
import { TerminalRef } from "@/core/components/Terminal/types";
import { PodExecTerminalProps } from "./types";
import { useTRPCClient } from "@/core/providers/trpc";

// Event types from server subscriptions
type ExecEvent =
  | { type: "sessionId"; sessionId: string }
  | { type: "data"; channel: number; data: string }
  | { type: "exit"; exitCode: number }
  | { type: "error"; message: string };

export const PodExecTerminal: React.FC<PodExecTerminalProps> = ({
  namespace,
  pods,
  selectedPod,
  container,
  clusterName,
  isAttach = false,
  height = 400,
}) => {
  const trpc = useTRPCClient();

  // State management
  const [activePod, setActivePod] = useState(() => {
    if (selectedPod) {
      return pods.find((pod) => pod.metadata?.name === selectedPod) || pods[0];
    }
    return pods[0];
  });

  const [selectedContainer, setSelectedContainer] = useState<string>(container || "");
  const [shellAttempts, setShellAttempts] = useState(0);

  // Terminal ref and session state
  const terminalRef = useRef<TerminalRef>(null);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const isConnectedRef = useRef<boolean>(false);
  const hasReceivedDataRef = useRef<boolean>(false);

  const shells = ["bash", "/bin/bash", "sh", "/bin/sh", "powershell.exe", "cmd.exe"];

  const podName = activePod?.metadata?.name || "";

  // Available containers - memoized
  const availableContainers = useMemo(() => {
    if (!activePod) return [];

    const containers: Array<{ name: string; type: string }> = [];

    // Add init containers
    if (activePod.spec?.initContainers) {
      containers.push(
        ...activePod.spec.initContainers.map((container: { name: string }) => ({
          name: container.name,
          type: "init",
        }))
      );
    }

    // Add main containers
    if (activePod.spec?.containers) {
      containers.push(
        ...activePod.spec.containers.map((container: { name: string }) => ({
          name: container.name,
          type: "container",
        }))
      );
    }

    // Add ephemeral containers
    if (activePod.spec?.ephemeralContainers) {
      containers.push(
        ...activePod.spec.ephemeralContainers.map((container: { name: string }) => ({
          name: container.name,
          type: "ephemeral",
        }))
      );
    }

    return containers;
  }, [activePod]);

  const getCurrentShellCommand = () => {
    return shells[shellAttempts % shells.length];
  };

  // Create event handler for subscription
  const createEventHandler = (terminal: XTerminal) => ({
    onData: (event: ExecEvent) => {
      if (event.type === "sessionId") {
        sessionIdRef.current = event.sessionId;
      } else if (event.type === "data") {
        terminal.write(event.data);
        isConnectedRef.current = true;
        hasReceivedDataRef.current = true;
      } else if (event.type === "exit") {
        // Check if shell doesn't exist and try next one
        if (!hasReceivedDataRef.current && shellAttempts < shells.length - 1) {
          terminal.writeln(`Shell not found. Trying next shell...\r\n`);
          setShellAttempts((prev) => prev + 1);
        } else {
          terminal.writeln(`\r\nProcess exited with code ${event.exitCode}\r\n`);
        }
        isConnectedRef.current = false;
      }
    },
    onError: (error: Error) => {
      terminal.writeln(`\r\nConnection failed: ${error.message}\r\n`);

      if (shellAttempts < shells.length - 1) {
        terminal.writeln(`Trying next shell...\r\n`);
        setShellAttempts((prev) => prev + 1);
      } else {
        terminal.writeln(`All shells failed. Press Ctrl+C to close.\r\n`);
      }
    },
  });

  // Initialize terminal connection
  const connectToExec = () => {
    if (!selectedContainer || !podName) return;

    const terminal = terminalRef.current?.getTerminal();
    if (!terminal) return;

    // Cleanup previous subscription
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }

    terminal.clear();
    sessionIdRef.current = null;
    isConnectedRef.current = false;
    hasReceivedDataRef.current = false;

    const command = getCurrentShellCommand();

    if (isAttach) {
      terminal.writeln(`Attaching to container ${selectedContainer}...\r\n`);
    } else {
      terminal.writeln(`Trying to run "${command}"...\r\n`);
    }

    try {
      const eventHandler = createEventHandler(terminal);
      const subscription = isAttach
        ? trpc.k8s.watchPodAttach.subscribe(
            {
              clusterName,
              namespace,
              podName,
              container: selectedContainer,
              tty: true,
            },
            eventHandler
          )
        : trpc.k8s.watchPodExec.subscribe(
            {
              clusterName,
              namespace,
              podName,
              container: selectedContainer,
              command: [command],
              tty: true,
            },
            eventHandler
          );

      subscriptionRef.current = subscription;
    } catch (error) {
      console.error("[PodExecTerminal] Failed to start exec session:", error);
      terminal.writeln(`\r\nFailed to start session\r\n`);
    }
  };

  // Handle terminal data input
  const handleTerminalData = async (data: string) => {
    const currentSessionId = sessionIdRef.current;
    const currentIsConnected = isConnectedRef.current;

    if (!currentSessionId || !currentIsConnected) {
      return;
    }

    try {
      await trpc.k8s.podExecSendInput.mutate({
        sessionId: currentSessionId,
        data,
      });
    } catch (error) {
      console.error("Failed to send terminal input:", error);
    }
  };

  // Handle terminal resize
  const handleTerminalResize = async (size: { cols: number; rows: number }) => {
    const currentSessionId = sessionIdRef.current;
    if (!currentSessionId) return;

    try {
      await trpc.k8s.podExecResize.mutate({
        sessionId: currentSessionId,
        cols: size.cols,
        rows: size.rows,
      });
    } catch (error) {
      console.error("Failed to resize terminal:", error);
    }
  };

  // Handle terminal key events
  const handleTerminalKeyDown = (arg: KeyboardEvent) => {
    // Allow copy/paste
    if (arg.ctrlKey && arg.type === "keydown") {
      if (arg.code === "KeyC") {
        const terminal = terminalRef.current?.getTerminal();
        const selection = terminal?.getSelection();
        if (selection) {
          return false;
        }
      }
      if (arg.code === "KeyV") {
        return false;
      }
    }

    return true;
  };

  // Auto-select container when needed
  useEffect(() => {
    if (container) {
      setSelectedContainer(container);
    } else if (activePod?.spec?.containers?.length && !selectedContainer) {
      setSelectedContainer(activePod.spec.containers[0].name);
    }
  }, [container, activePod, selectedContainer]);

  // Update active pod when selectedPod prop changes
  useEffect(() => {
    if (selectedPod) {
      const pod = pods.find((p) => p.metadata?.name === selectedPod);
      if (pod) {
        setActivePod(pod);
      }
    }
  }, [selectedPod, pods]);

  // Connect when container is selected or shell attempt changes
  useEffect(() => {
    if (selectedContainer && terminalRef.current?.getTerminal()) {
      connectToExec();
    }

    // Cleanup on unmount
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedContainer, shellAttempts]);

  // Event handlers
  const handlePodChange = (value: string) => {
    const pod = pods.find((p) => p.metadata?.name === value);
    if (pod) {
      setActivePod(pod);
      setShellAttempts(0);
      // Reset container selection when pod changes
      if (pod.spec?.containers?.length) {
        setSelectedContainer(pod.spec.containers[0].name);
      }
    }
  };

  const handleContainerChange = (value: string) => {
    setShellAttempts(0);
    setSelectedContainer(value);
  };

  const isWindows = ["Windows", "Win16", "Win32", "WinCE"].indexOf(navigator?.platform) >= 0;

  return (
    <div className="flex flex-col gap-2" style={{ height }}>
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {pods.length > 1 && (
          <div className="flex min-w-[180px] flex-col gap-1.5">
            <Label htmlFor="pod-select">Pod</Label>
            <Select value={podName} onValueChange={handlePodChange}>
              <SelectTrigger id="pod-select" className="h-9">
                <SelectValue placeholder="Select pod" />
              </SelectTrigger>
              <SelectContent>
                {pods.map((pod) => (
                  <SelectItem key={pod.metadata?.name} value={pod.metadata?.name || ""}>
                    {pod.metadata?.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex min-w-[200px] flex-col gap-1.5">
          <Label htmlFor="container-name-chooser">Container</Label>
          <Select value={selectedContainer} onValueChange={handleContainerChange}>
            <SelectTrigger id="container-name-chooser" className="h-9">
              <SelectValue placeholder="Select container" />
            </SelectTrigger>
            <SelectContent>
              {availableContainers.map((container) => (
                <SelectItem key={container.name} value={container.name}>
                  {container.name} {container.type !== "container" && <em>({container.type})</em>}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <span className="text-muted-foreground mt-5 text-xs">
          {isAttach ? `Attach: ${podName}` : `Terminal: ${podName}`}
        </span>
      </div>

      {/* Terminal Display */}
      <Terminal
        ref={terminalRef}
        height={height - 60} // Account for controls height
        enableWebLinks={true}
        readonly={false}
        onData={handleTerminalData}
        onResize={handleTerminalResize}
        onKeyDown={handleTerminalKeyDown}
        options={{
          cursorBlink: true,
          cursorStyle: "underline",
          windowOptions: {
            fullscreenWin: isWindows,
          },
        }}
      />
    </div>
  );
};
