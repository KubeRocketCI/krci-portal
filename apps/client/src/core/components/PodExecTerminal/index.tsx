import React, { useState, useRef, useMemo } from "react";
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";

import { Terminal } from "@/core/components/Terminal";
import { TerminalRef } from "@/core/components/Terminal/types";
import { PodExecTerminalProps } from "./types";
import { trpc } from "@/core/clients/trpc";

export const PodExecTerminal: React.FC<PodExecTerminalProps> = ({
  namespace,
  pods,
  selectedPod,
  container,
  clusterName,
  isAttach = false,
  height = 400,
}) => {
  // State management
  const [activePod, setActivePod] = useState(() => {
    if (selectedPod) {
      return pods.find((pod) => pod.metadata?.name === selectedPod) || pods[0];
    }
    return pods[0];
  });

  const [selectedContainer, setSelectedContainer] = useState<string>(container || "");
  const [shells] = useState({
    available: ["bash", "/bin/bash", "sh", "/bin/sh", "powershell.exe", "cmd.exe"],
    currentIdx: 0,
  });

  const [terminalState, setTerminalState] = useState({
    connected: false,
    reconnectOnEnter: false,
  });

  // Terminal ref
  const terminalRef = useRef<TerminalRef>(null);

  const podName = activePod?.metadata?.name || "";

  // Available containers - memoized
  const availableContainers = useMemo(() => {
    if (!activePod) return [];

    const containers: Array<{ name: string; type: string }> = [];

    // Add init containers
    if (activePod.spec?.initContainers) {
      containers.push(
        ...activePod.spec.initContainers.map((container) => ({
          name: container.name,
          type: "init",
        }))
      );
    }

    // Add main containers
    if (activePod.spec?.containers) {
      containers.push(
        ...activePod.spec.containers.map((container) => ({
          name: container.name,
          type: "container",
        }))
      );
    }

    // Add ephemeral containers
    if (activePod.spec?.ephemeralContainers) {
      containers.push(
        ...activePod.spec.ephemeralContainers.map((container) => ({
          name: container.name,
          type: "ephemeral",
        }))
      );
    }

    return containers;
  }, [activePod]);

  // Terminal functions
  const send = (channel: number, data: string) => {
    console.log("Sending data:", { channel, data });
  };

  const getCurrentShellCommand = () => {
    return shells.available[shells.currentIdx];
  };

  const isLastShell = () => {
    return shells.currentIdx === shells.available.length - 1;
  };

  const shellConnectFailed = () => {
    const terminal = terminalRef.current?.getTerminal();
    if (!terminal) return;

    const command = getCurrentShellCommand();

    if (isLastShell()) {
      if (terminalState.connected) {
        terminal.write(`Failed to run "${command}"…` + "\r\n");
      } else {
        terminal.clear();
        terminal.write("Failed to connect…" + "\r\n");
      }

      terminal.write("\r\n" + "Press the enter key to reconnect." + "\r\n");
      setTerminalState((prev) => ({ ...prev, reconnectOnEnter: true }));
    } else {
      terminal.write(`Failed to run "${command}"` + "\r\n");
      // Try next shell - simplified approach
    }
  };

  // Initialize terminal connection
  const initializeConnection = async () => {
    if (!selectedContainer) return;

    const terminal = terminalRef.current?.getTerminal();
    if (!terminal) return;

    try {
      if (isAttach) {
        terminal.writeln(`Trying to attach to the container ${selectedContainer}…` + "\n");
        await trpc.k8s.podAttach.mutate({
          clusterName,
          namespace,
          podName,
          container: selectedContainer,
        });
      } else {
        const command = getCurrentShellCommand();
        terminal.writeln(`Trying to run "${command}"…` + "\n");
        await trpc.k8s.podExec.mutate({
          clusterName,
          namespace,
          podName,
          container: selectedContainer,
          command: [command],
        });
      }

      setTerminalState((prev) => ({ ...prev, connected: true }));
    } catch (error) {
      console.error(isAttach ? "Attach failed:" : "Exec failed:", error);
      shellConnectFailed();
    }
  };

  // Handle terminal data input
  const handleTerminalData = (data: string) => {
    send(0, data);
  };

  // Handle terminal resize
  const handleTerminalResize = (size: { cols: number; rows: number }) => {
    send(4, `{"Width":${size.cols},"Height":${size.rows}}`);
  };

  // Handle terminal key events
  const handleTerminalKeyDown = (arg: KeyboardEvent) => {
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

    if (!isAttach && arg.type === "keydown" && arg.code === "Enter") {
      if (terminalState.reconnectOnEnter) {
        setTerminalState((prev) => ({ ...prev, reconnectOnEnter: false }));
        initializeConnection();
        return false;
      }
    }

    return true;
  };

  // Auto-select container when needed
  React.useEffect(() => {
    if (container) {
      setSelectedContainer(container);
    } else if (activePod?.spec?.containers?.length && !selectedContainer) {
      setSelectedContainer(activePod.spec.containers[0].name);
    }
  }, [container, activePod, selectedContainer]);

  // Update active pod when selectedPod prop changes
  React.useEffect(() => {
    if (selectedPod) {
      const pod = pods.find((p) => p.metadata?.name === selectedPod);
      if (pod) {
        setActivePod(pod);
      }
    }
  }, [selectedPod, pods]);

  // Initialize connection when container is selected
  React.useEffect(() => {
    if (selectedContainer && terminalRef.current?.getTerminal()) {
      initializeConnection();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedContainer]);

  // Event handlers
  const handlePodChange = (event: { target: { value: string } }) => {
    const pod = pods.find((p) => p.metadata?.name === event.target.value);
    if (pod) {
      setActivePod(pod);
      // Reset container selection when pod changes
      if (pod.spec?.containers?.length) {
        setSelectedContainer(pod.spec.containers[0].name);
      }
    }
  };

  const handleContainerChange = (event: { target: { value: string } }) => {
    setSelectedContainer(event.target.value);
  };

  const isWindows = ["Windows", "Win16", "Win32", "WinCE"].indexOf(navigator?.platform) >= 0;

  return (
    <div className="flex flex-col gap-2" style={{ height }}>
      {/* Controls */}
      <div className="flex gap-2 items-center flex-wrap">
        {pods.length > 1 && (
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Pod</InputLabel>
            <Select value={podName} label="Pod" onChange={handlePodChange}>
              {pods.map((pod) => (
                <MenuItem key={pod.metadata?.name} value={pod.metadata?.name || ""}>
                  {pod.metadata?.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel shrink id="container-name-chooser-label">
            Container
          </InputLabel>
          <Select
            labelId="container-name-chooser-label"
            id="container-name-chooser"
            value={selectedContainer}
            onChange={handleContainerChange}
          >
            {availableContainers.map((container) => (
              <MenuItem key={container.name} value={container.name}>
                {container.name} {container.type !== "container" && <em>({container.type})</em>}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <span className="text-xs text-muted-foreground">
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
