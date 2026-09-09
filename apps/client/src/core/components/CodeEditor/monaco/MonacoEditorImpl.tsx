import "./setup";
import { useMemo } from "react";
import { DiffEditor, Editor, type DiffEditorProps, type EditorProps } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { useMonacoTheme } from "@/core/hooks/useTheme";
import { LoadingSpinner } from "@/core/components/ui/LoadingSpinner";

// Floor for every editor in the portal; caller options win.
const MONACO_EDITOR_DEFAULTS: editor.IEditorOptions = {
  minimap: { enabled: false },
};

function useSharedProps<O extends editor.IEditorOptions>(theme: string | undefined, options: O | undefined) {
  const monacoTheme = useMonacoTheme();
  const merged = useMemo(() => ({ ...MONACO_EDITOR_DEFAULTS, ...options }), [options]);
  return { theme: theme ?? monacoTheme, options: merged };
}

export function MonacoEditorImpl({ theme, options, loading = <LoadingSpinner />, ...props }: EditorProps) {
  return <Editor {...useSharedProps(theme, options)} loading={loading} {...props} />;
}

export function MonacoDiffEditorImpl({ theme, options, loading = <LoadingSpinner />, ...props }: DiffEditorProps) {
  return <DiffEditor {...useSharedProps(theme, options)} loading={loading} {...props} />;
}
