import React from "react";
import * as yaml from "js-yaml";
import { CircleCheck, CircleX } from "lucide-react";
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
import { showToast } from "../Snackbar";
import { useApplyYaml } from "./hooks/useApplyYaml";
import { ApplyResult, CreateResourceDialogProps } from "./types";

// Validates all YAML documents via loadAll; returns first doc for CodeEditor's internal state.
function parseMultiDoc(text: string): object {
  const docs: unknown[] = [];
  yaml.loadAll(text, (doc) => docs.push(doc));
  return (docs[0] as object) ?? {};
}

export default function CreateResourceDialog({ state }: CreateResourceDialogProps) {
  const editorRef = React.useRef<CodeEditorHandle>(null);
  const [parseError, setParseError] = React.useState<string | null>(null);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [results, setResults] = React.useState<ApplyResult[]>([]);

  const { mutate: applyYaml, isPending } = useApplyYaml();

  const handleApply = () => {
    setParseError(null);
    setServerError(null);
    setResults([]);

    const text = editorRef.current?.getValue() ?? "";
    const resources: Record<string, unknown>[] = [];

    try {
      yaml.loadAll(text, (doc) => {
        if (doc && typeof doc === "object") {
          resources.push(doc as Record<string, unknown>);
        }
      });
    } catch (err) {
      setParseError((err as Error).message);
      return;
    }

    if (resources.length === 0) {
      setParseError("No valid YAML documents found.");
      return;
    }

    applyYaml(resources, {
      onSuccess: (applyResults) => {
        setResults(applyResults);
        const failed = applyResults.filter((r) => !r.success);
        const succeeded = applyResults.filter((r) => r.success);

        if (failed.length === 0) {
          showToast(
            `${succeeded.length} resource${succeeded.length !== 1 ? "s" : ""} applied successfully.`,
            "success"
          );
          state.closeDialog();
        } else {
          showToast(`${succeeded.length} succeeded, ${failed.length} failed.`, "warning");
        }
      },
      onError: (err) => {
        setServerError(err.message);
      },
    });
  };

  const handleClose = () => {
    setParseError(null);
    setServerError(null);
    setResults([]);
    state.closeDialog();
  };

  return (
    <Dialog open={state.open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="w-full max-w-4xl">
        <DialogHeader>
          <DialogTitle>Create Resource</DialogTitle>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-3">
          <CodeEditor
            ref={editorRef}
            content={{}}
            serialize={() => ""}
            height="500px"
            language="yaml"
            parse={parseMultiDoc}
            onChange={(_, __, err) => {
              if (err) setParseError(err.message);
              else setParseError(null);
            }}
            theme="vs-light"
            options={{ minimap: { enabled: false } }}
          />
          {parseError && <Alert variant="destructive">{parseError}</Alert>}
          {serverError && <Alert variant="destructive">{serverError}</Alert>}
          {results.length > 0 && (
            <ul className="flex flex-col gap-1 text-sm">
              {results.map((r, i) => (
                <li key={i} className="flex items-center gap-2">
                  {r.success ? (
                    <CircleCheck className="size-4 shrink-0 text-green-600" />
                  ) : (
                    <CircleX className="text-destructive size-4 shrink-0" />
                  )}
                  <span className="font-medium">
                    {r.kind}/{r.name ?? "unknown"}
                  </span>
                  {r.error && <span className="text-muted-foreground">— {r.error}</span>}
                </li>
              ))}
            </ul>
          )}
        </DialogBody>
        <DialogFooter>
          <Button onClick={handleClose} variant="outline" size="sm">
            Cancel
          </Button>
          <Button onClick={handleApply} variant="default" size="sm" disabled={isPending || !!parseError}>
            {isPending ? "Applying…" : "Apply"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

CreateResourceDialog.displayName = "CreateResourceDialog";
