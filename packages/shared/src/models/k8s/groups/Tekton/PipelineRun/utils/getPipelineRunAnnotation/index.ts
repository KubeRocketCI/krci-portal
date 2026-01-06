import { PipelineRun } from "../../types.js";

/**
 * Extract annotation from PipelineRun's resultAnnotations JSON.
 *
 * Annotations are stored in a JSON string at `results.tekton.dev/resultAnnotations`
 * which needs to be parsed to access individual values.
 *
 * Handles two cases:
 * 1. resultAnnotations exists with JSON (keys might be present but values could be empty)
 * 2. resultAnnotations doesn't exist at all (returns undefined)
 *
 * @param pipelineRun - The PipelineRun object
 * @param key - The annotation key to extract
 * @returns The annotation value or undefined if not found or empty
 *
 * @example
 * ```ts
 * const author = getPipelineRunAnnotation(pipelineRun, "app.edp.epam.com/git-author");
 * const branch = getPipelineRunAnnotation(pipelineRun, "app.edp.epam.com/git-branch");
 * ```
 */
export const getPipelineRunAnnotation = (pipelineRun: PipelineRun, key: string): string | undefined => {
  const resultAnnotations = pipelineRun.metadata.annotations?.["results.tekton.dev/resultAnnotations"];

  if (!resultAnnotations) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(resultAnnotations);
    const value = parsed[key];

    // Return undefined for null, empty string, or undefined values
    if (value === null || value === undefined || value === "") {
      return undefined;
    }

    return String(value);
  } catch {
    // Invalid JSON, silently ignore and return undefined
    return undefined;
  }
};
