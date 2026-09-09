import { lazy, Suspense, type ComponentType, type ReactNode } from "react";
import type { DiffEditorProps, EditorProps } from "@monaco-editor/react";
import { LoadingSpinner } from "@/core/components/ui/LoadingSpinner";

// Monaco loads on first editor mount; the app shell never imports it.
const LazyEditor = lazy(() => import("./MonacoEditorImpl").then((m) => ({ default: m.MonacoEditorImpl })));
const LazyDiffEditor = lazy(() => import("./MonacoEditorImpl").then((m) => ({ default: m.MonacoDiffEditorImpl })));

export type MonacoEditorProps = EditorProps;
export type MonacoDiffEditorProps = DiffEditorProps;

function Fallback({ width = "100%", height = "100%", loading }: Pick<EditorProps, "width" | "height" | "loading">) {
  const content: ReactNode = loading ?? <LoadingSpinner />;
  return (
    <div style={{ width, height }} className="flex items-center justify-center">
      {content}
    </div>
  );
}

function withFallback<P extends Pick<EditorProps, "width" | "height" | "loading">>(Lazy: ComponentType<P>) {
  return function MonacoBoundary(props: P) {
    return (
      <Suspense fallback={<Fallback width={props.width} height={props.height} loading={props.loading} />}>
        <Lazy {...props} />
      </Suspense>
    );
  };
}

export const MonacoEditor = withFallback<MonacoEditorProps>(LazyEditor);
export const MonacoDiffEditor = withFallback<MonacoDiffEditorProps>(LazyDiffEditor);
