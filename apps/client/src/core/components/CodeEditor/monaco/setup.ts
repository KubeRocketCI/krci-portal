import * as monaco from "monaco-editor";
import EditorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import { loader } from "@monaco-editor/react";

// Bundled Monaco only. No CDN fetch; required for air-gapped clusters.
globalThis.MonacoEnvironment = {
  getWorker: () => new EditorWorker(),
};

loader.config({ monaco });
