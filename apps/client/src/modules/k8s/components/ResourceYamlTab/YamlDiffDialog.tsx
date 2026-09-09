import { MonacoDiffEditor } from "@/core/components/CodeEditor/monaco";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/core/components/ui/dialog";
import { removeStatusField } from "./removeStatusField";

interface Props {
  open: boolean;
  onClose: () => void;
  current: string;
  draft: string;
}

export function YamlDiffDialog({ open, onClose, current, draft }: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Preview changes</DialogTitle>
        </DialogHeader>
        <div className="h-[60vh]">
          <MonacoDiffEditor
            language="yaml"
            original={removeStatusField(current)}
            modified={removeStatusField(draft)}
            options={{ renderSideBySide: true, readOnly: true }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
