import { DialogProps } from "@/core/providers/Dialog/types";

export type KubeResourceEditorProps = DialogProps<{
  content: object;
  onChange?: (yaml: string, json: object | null, error?: Error) => void;
  onSave?: (yaml: string, json: object | null) => void;
  onClose?: () => void;
  readOnly?: boolean;
  height?: string;
}>;
