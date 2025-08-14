import React from "react";
import MonacoEditor from "@monaco-editor/react";
import * as yaml from "js-yaml";

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
    },
    ref
  ) => {
    const [text, setText] = React.useState<string>("");
    const [error, setError] = React.useState<Error | null>(null);

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

    return (
      <MonacoEditor
        height={height}
        language={language}
        value={text}
        onChange={handleChange}
        theme={theme}
        options={{
          readOnly,
          minimap: { enabled: false },
          ...(options ?? {}),
        }}
      />
    );
  }
);

CodeEditor.displayName = "CodeEditor";

export default CodeEditor;
