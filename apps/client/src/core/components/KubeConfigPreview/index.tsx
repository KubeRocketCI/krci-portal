import { trpc } from "@/core/clients/trpc";
import { DialogProps } from "@/core/providers/Dialog/types";
import CodeEditor, { CodeEditorHandle } from "@/core/components/CodeEditor";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Alert } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { humanize } from "@/core/utils/date-humanize";

import React from "react";
import { useClusterStore } from "@/k8s/store";

type KubeConfigPreviewDialogProps = DialogProps<object>;

export default function KubeConfigPreviewDialog({ state }: KubeConfigPreviewDialogProps) {
  const { open, closeDialog } = state;

  const { clusterName, defaultNamespace } = useClusterStore();
  const editorRef = React.useRef<CodeEditorHandle>(null);
  const [timeRemaining, setTimeRemaining] = React.useState<string>("");

  const { data } = useQuery({
    queryKey: ["k8s.kubeconfig", clusterName],
    queryFn: () => trpc.k8s.kubeconfig.query({ namespace: defaultNamespace }),
    enabled: Boolean(clusterName),
  });

  React.useEffect(() => {
    if (!data?.tokenExpiresAt) {
      setTimeRemaining("");
      return;
    }

    const expiresAt = data.tokenExpiresAt;

    const updateTimeRemaining = () => {
      const now = Date.now();
      const diff = expiresAt - now;

      if (diff <= 0) {
        setTimeRemaining("Token has expired");
        return;
      }

      const formattedTime = humanize(diff, {
        largest: 3,
        round: true,
        conjunction: " and ",
        serialComma: false,
      });

      setTimeRemaining(`The token expires in ${formattedTime}`);
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [data?.tokenExpiresAt]);

  const copyToClipboard = () => {
    const text = editorRef.current?.getValue();
    if (text) {
      navigator.clipboard.writeText(text).then(() => {
        alert("YAML copied to clipboard!");
      });
    }
  };

  const downloadKubeConfig = () => {
    const text = editorRef.current?.getValue();
    if (text) {
      const blob = new Blob([text], { type: "text/yaml" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "kubeconfig.yaml";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <Dialog open={open} onClose={closeDialog} maxWidth="md" fullWidth>
      <DialogTitle>Kubeconfig Preview</DialogTitle>
      <DialogContent>
        {timeRemaining && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {timeRemaining}
          </Alert>
        )}
        <CodeEditor
          ref={editorRef}
          content={data?.config || {}}
          height="400px"
          language="yaml"
          readOnly
          onChange={() => {}}
          theme="vs-light"
        />
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" size="small" onClick={closeDialog}>
          Close
        </Button>
        <Button variant="contained" size="small" onClick={downloadKubeConfig}>
          Download
        </Button>
        <Button variant="contained" size="small" onClick={copyToClipboard}>
          Copy YAML
        </Button>
      </DialogActions>
    </Dialog>
  );
}

KubeConfigPreviewDialog.displayName = "KubeConfigPreviewDialog";
