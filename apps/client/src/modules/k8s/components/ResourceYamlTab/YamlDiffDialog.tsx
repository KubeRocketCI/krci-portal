import { DiffEditor } from "@monaco-editor/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/core/components/ui/dialog";
import { useMonacoTheme } from "@/core/hooks/useTheme";
import { removeStatusField } from "./removeStatusField";

interface Props {
  open: boolean;
  onClose: () => void;
  current: string;
  draft: string;
}

export function YamlDiffDialog({ open, onClose, current, draft }: Props) {
  const monacoTheme = useMonacoTheme();

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Preview changes</DialogTitle>
        </DialogHeader>
        <div className="h-[60vh]">
          <DiffEditor
            language="yaml"
            theme={monacoTheme}
            original={removeStatusField(current)}
            modified={removeStatusField(draft)}
            options={{ renderSideBySide: true, readOnly: true, minimap: { enabled: false } }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
