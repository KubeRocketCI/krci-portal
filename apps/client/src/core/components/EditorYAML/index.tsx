import React from "react";
import MonacoEditor from "@monaco-editor/react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Alert } from "@mui/material";
import * as yaml from "js-yaml";
import { KubeResourceEditorProps } from "./types";

export default function EditorYAML({ props, state }: KubeResourceEditorProps) {
  const { content, onChange, onSave, onClose, readOnly = false, height = "500px" } = props;

  const [yamlContent, setYamlContent] = React.useState<string>("");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    try {
      setYamlContent(yaml.dump(content));
      setError(null);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_e) {
      setError("Invalid input content.");
    }
  }, [content]);

  const handleChange = (value: string | undefined) => {
    if (value == null) return;
    setYamlContent(value);
    try {
      const parsed = yaml.load(value);
      setError(null);
      onChange?.(value, parsed as object, undefined);
    } catch (err) {
      setError((err as Error).message);
      onChange?.(value, null, err as Error);
    }
  };

  const handleSave = () => {
    try {
      const parsed = yaml.load(yamlContent);
      onSave?.(yamlContent, parsed as object);
    } catch (err) {
      setError((err as Error).message);
    }
    state.closeDialog();
  };

  return (
    <Dialog open={state.open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Kubernetes Resource Editor</DialogTitle>
      <DialogContent>
        <MonacoEditor
          height={height}
          language="yaml"
          value={yamlContent}
          onChange={handleChange}
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
