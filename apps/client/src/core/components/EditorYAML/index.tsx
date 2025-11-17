import React from "react";
import { Button } from "@/core/components/ui/button";
import { Alert } from "@/core/components/ui/alert";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/core/components/ui/dialog";
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
    <Dialog open={state.open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-full max-w-4xl">
        <DialogHeader>
          <DialogTitle>Kubernetes Resource Editor</DialogTitle>
        </DialogHeader>
        <DialogBody>
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
            <Alert variant="destructive" className="mb-2">
              {error}
            </Alert>
          )}
        </DialogBody>
        <DialogFooter>
          <Button onClick={onClose} variant="outline" size="sm">
            Close
          </Button>
          {!readOnly && (
            <Button onClick={handleSave} variant="default" size="sm">
              Save
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

EditorYAML.displayName = "KubeResourceEditor";
