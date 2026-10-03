import { useMutation, useQueryClient } from "@tanstack/react-query";
import { dismissToast, showToast } from "@/core/components/Snackbar";
import type { Severity } from "@/core/utils/severity";

export interface UseK8sActionMutationOptions<TInput, TOutput> {
  mutationKey: string;
  mutationFn: (input: TInput) => Promise<TOutput>;
  messages: {
    loading: (input: TInput) => string;
    success: (input: TInput, output: TOutput) => string;
    error: (input: TInput, err: Error) => string;
  };
  /** Severity of the toast for a resolved `mutationFn`. Defaults to `success`. */
  successSeverity?: (input: TInput, output: TOutput) => Severity;
  /**
   * How a resolved `mutationFn` is reported. Defaults to `toast`.
   *
   * - `toast`: the loading toast becomes the success toast.
   * - `none`: the loading toast is dismissed; the caller reports the outcome.
   *
   * Loading and error toasts are always shown.
   */
  report?: "toast" | "none";
  /**
   * Query-key prefixes to invalidate on success. Each entry is matched as a TanStack
   * Query prefix: queries whose key starts with the array are invalidated. An empty
   * array invalidates nothing.
   */
  invalidationKeys: (input: TInput, output: TOutput) => Array<readonly unknown[]>;
}

export function useK8sActionMutation<TInput, TOutput>(options: UseK8sActionMutationOptions<TInput, TOutput>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [options.mutationKey],
    mutationFn: async (input: TInput) => {
      const loadingId = showToast(options.messages.loading(input), "loading");

      let output: TOutput;
      try {
        output = await options.mutationFn(input);
        if (options.report === "none") {
          dismissToast(loadingId);
        } else {
          showToast(options.messages.success(input, output), options.successSeverity?.(input, output) ?? "success", {
            id: loadingId,
          });
        }
      } catch (rawErr) {
        const err = rawErr instanceof Error ? rawErr : new Error(String(rawErr));
        showToast(options.messages.error(input, err), "error", {
          id: loadingId,
          description: err.message,
          duration: 10000,
        });
        throw err;
      }

      // Invalidation runs outside the try block above: its failure is non-fatal and does not show the error toast.
      try {
        await Promise.all(
          options
            .invalidationKeys(input, output)
            .map((key) => queryClient.invalidateQueries({ queryKey: key as unknown[] }))
        );
      } catch (invalidationErr) {
        console.warn("[useK8sActionMutation] query invalidation failed (non-fatal):", invalidationErr);
      }

      return output;
    },
  });
}
