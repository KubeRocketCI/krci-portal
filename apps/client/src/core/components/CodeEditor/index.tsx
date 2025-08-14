import React from "react";
import MonacoEditor from "@monaco-editor/react";
import * as yaml from "js-yaml";
import { LoadingSpinner } from "../ui/LoadingSpinner";

export type CodeEditorChangeHandler = (text: string, json: object | null, error?: Error) => void;

export type CodeEditorProps = {
  content: object;
  onChange?: CodeEditorChangeHandler;
  language?: string;
  height?: string | number;
  readOnly?: boolean;
  theme?: string;
  options?: Record<string, unknown>;
  serialize?: (input: unknown) => string;
  parse?: (text: string) => object;
  fitParent?: boolean; // New prop to enable responsive behavior
};

export type CodeEditorHandle = {
  getValue: () => string;
  getParsed: () => object | null;
  getError: () => Error | null;
};

const CodeEditor = React.forwardRef<CodeEditorHandle, CodeEditorProps>(
  (
    {
      content,
      onChange,
      language = "yaml",
      height = "500px",
      readOnly = !onChange,
      theme = "vs-light",
      options,
      serialize = (input: unknown) => yaml.dump(input),
      parse = (text: string) => yaml.load(text) as object,
      fitParent = true,
    },
    ref
  ) => {
    const [text, setText] = React.useState<string>("");
    const [error, setError] = React.useState<Error | null>(null);
    const [calculatedHeight, setCalculatedHeight] = React.useState<number>(500);
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Effect to handle parent container size changes
    React.useEffect(() => {
      if (!fitParent || !containerRef.current) return;

      let isUpdating = false; // Flag to prevent recursive updates

      const updateHeight = () => {
        if (isUpdating || !containerRef.current) return;

        isUpdating = true;

        // Get the parent element's size instead of our own
        const parentElement = containerRef.current.parentElement;
        if (parentElement) {
          const rect = parentElement.getBoundingClientRect();
          const newHeight = rect.height || 500;

          setCalculatedHeight((prevHeight) => {
            const adjustedHeight = newHeight - 50; // Reduce by 50px for horizontal scrollbar
            const heightDiff = Math.abs(adjustedHeight - prevHeight);
            if (heightDiff > 2) {
              // Increased threshold to avoid micro-adjustments
              return Math.max(adjustedHeight, 100); // Minimum height to avoid zero/negative values
            }
            return prevHeight;
          });
        }

        // Reset flag after a brief delay
        setTimeout(() => {
          isUpdating = false;
        }, 50);
      };

      // Initial height calculation with delay
      const initialTimeoutId = setTimeout(updateHeight, 100);

      // Observe the parent element, not our wrapper
      let resizeObserver: ResizeObserver | null = null;
      const parentElement = containerRef.current.parentElement;

      if (parentElement) {
        resizeObserver = new ResizeObserver(() => {
          if (!isUpdating) {
            updateHeight();
          }
        });
        resizeObserver.observe(parentElement);
      }

      return () => {
        clearTimeout(initialTimeoutId);
        if (resizeObserver) {
          resizeObserver.disconnect();
        }
      };
    }, [fitParent]);

    React.useEffect(() => {
      try {
        setText(serialize(content));
        setError(null);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_e) {
        setError(new Error("Invalid input content."));
      }
      // We intentionally only re-serialize when content reference changes
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [content]);

    const handleChange = (value: string | undefined) => {
      if (value == null) return;
      setText(value);
      try {
        const parsed = parse(value);
        setError(null);
        onChange?.(value, parsed as object, undefined);
      } catch (err) {
        const e = err as Error;
        setError(e);
        onChange?.(value, null, e);
      }
    };

    React.useImperativeHandle(
      ref,
      (): CodeEditorHandle => ({
        getValue: () => text,
        getParsed: () => {
          try {
            return parse(text) as object;
          } catch (_err) {
            throw _err as Error;
          }
        },
        getError: () => error,
      }),
      [text, error, parse]
    );

    // Determine the height to use - if fitParent is true, use calculated pixel height
    const editorHeight = fitParent ? calculatedHeight : height;

    if (fitParent) {
      return (
        <div
          ref={containerRef}
          style={{
            height: "100%",
            width: "100%",
            overflow: "hidden", // Prevent any scrollbars that might affect measurement
          }}
        >
          <MonacoEditor
            height={editorHeight}
            language={language}
            value={text}
            onChange={handleChange}
            theme={theme}
            options={{
              readOnly,
              minimap: { enabled: false },
              automaticLayout: true, // Enables automatic layout resizing
              ...(options ?? {}),
            }}
            loading={<LoadingSpinner />}
          />
        </div>
      );
    }

    return (
      <MonacoEditor
        height={editorHeight}
        language={language}
        value={text}
        onChange={handleChange}
        theme={theme}
        options={{
          readOnly,
          minimap: { enabled: false },
          automaticLayout: true, // Enables automatic layout resizing
          ...(options ?? {}),
        }}
        loading={<LoadingSpinner />}
      />
    );
  }
);

CodeEditor.displayName = "CodeEditor";

export default CodeEditor;
