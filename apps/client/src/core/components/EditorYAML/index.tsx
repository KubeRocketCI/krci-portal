import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Alert } from "@mui/material";
import CodeEditor, { CodeEditorHandle } from "../CodeEditor";
import { KubeResourceEditorProps } from "./types";

export default function EditorYAML({ props, state }: KubeResourceEditorProps) {
  const { content, onChange, onSave, onClose: onEditorClose, readOnly = false, height = "500px" } = props;

  const editorRef = React.useRef<CodeEditorHandle>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleSave = () => {
    const text = editorRef.current?.getValue() ?? "";
    try {
      const parsed = editorRef.current?.getParsed() ?? null;
      onSave?.(text, parsed);
    } catch (err) {
      setError((err as Error).message);
    }

    state.closeDialog();
  };

  const onClose = () => {
    onEditorClose?.();
    state.closeDialog();
  };

  return (
    <Dialog open={state.open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Kubernetes Resource Editor</DialogTitle>
      <DialogContent>
        <CodeEditor
          ref={editorRef}
          content={content}
          height={height}
          language="yaml"
          onChange={(text, json, err) => {
            if (err) setError(err.message);
            else setError(null);
            onChange?.(text, json, err);
          }}
          theme="vs-light"
          options={{
            readOnly,
            minimap: { enabled: false },
          }}
        />
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined" size="small">
          Close
        </Button>
        {!readOnly && (
          <Button onClick={handleSave} variant="contained" size="small">
            Save
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

EditorYAML.displayName = "KubeResourceEditor";
