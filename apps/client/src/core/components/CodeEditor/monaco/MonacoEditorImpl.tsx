import "./setup";
import { useMemo } from "react";
import { DiffEditor, Editor, type DiffEditorProps, type EditorProps } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { useMonacoTheme } from "@/core/hooks/useTheme";
import { LoadingSpinner } from "@/core/components/ui/LoadingSpinner";
import { useRemountKey } from "@/core/hooks/useRemountKey";

// Floor for every editor in the portal; caller options win.
const MONACO_EDITOR_DEFAULTS: editor.IEditorOptions = {
  minimap: { enabled: false },
};

function useSharedProps<O extends editor.IEditorOptions>(theme: string | undefined, options: O | undefined) {
  const monacoTheme = useMonacoTheme();
  const merged = useMemo(() => ({ ...MONACO_EDITOR_DEFAULTS, ...options }), [options]);
  return { theme: theme ?? monacoTheme, options: merged };
}

// @monaco-editor/react disposes the editor in effect cleanup and does not recreate it when effects reconnect.
// Remount key required for editors in hidden <Activity> tabs.
export function MonacoEditorImpl({ theme, options, loading = <LoadingSpinner />, ...props }: EditorProps) {
  const remountKey = useRemountKey();
  return <Editor key={remountKey} {...useSharedProps(theme, options)} loading={loading} {...props} />;
}

export function MonacoDiffEditorImpl({ theme, options, loading = <LoadingSpinner />, ...props }: DiffEditorProps) {
  const remountKey = useRemountKey();
  return <DiffEditor key={remountKey} {...useSharedProps(theme, options)} loading={loading} {...props} />;
}
