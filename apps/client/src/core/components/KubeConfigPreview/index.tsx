import { trpc } from "@/core/clients/trpc";
import { DialogProps } from "@/core/providers/Dialog/types";
import MonacoEditor from "@monaco-editor/react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import * as yaml from "js-yaml";
import React from "react";

type KubeConfigPreviewDialogProps = DialogProps<object>;

export default function KubeConfigPreviewDialog({ state }: KubeConfigPreviewDialogProps) {
  const { open, closeDialog } = state;

  const [yamlContent, setYamlContent] = React.useState<string>("");

  const { data } = useQuery({
    queryKey: ["k8s.kubeconfig"],
    queryFn: () => trpc.k8s.kubeconfig.query(),
  });

  React.useEffect(() => {
    if (data) {
      setYamlContent(yaml.dump(data));
    }
  }, [data]);

  const handleEditorChange = (value: string | undefined) => {
    // Handle changes in the Monaco Editor (user edits YAML)
    if (value) {
      setYamlContent(value);
    }
  };

  const copyToClipboard = () => {
    if (yamlContent) {
      navigator.clipboard.writeText(yamlContent).then(() => {
        alert("YAML copied to clipboard!");
      });
    }
  };

  return (
    <Dialog open={open} onClose={closeDialog} maxWidth="md" fullWidth>
      <DialogTitle>Kubeconfig Preview</DialogTitle>
      <DialogContent>
        <MonacoEditor
          height="400px"
          language="yaml"
          value={yamlContent}
          onChange={handleEditorChange}
          theme="vs-light"
        />
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" size="small" onClick={closeDialog}>
          Close
        </Button>
        <Button variant="contained" size="small" onClick={copyToClipboard}>
          Copy YAML
        </Button>
      </DialogActions>
    </Dialog>
  );
}

KubeConfigPreviewDialog.displayName = "KubeConfigPreviewDialog";
