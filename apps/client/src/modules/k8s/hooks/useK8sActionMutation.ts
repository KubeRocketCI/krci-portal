import { useMutation, useQueryClient } from "@tanstack/react-query";
import { showToast } from "@/core/components/Snackbar";

export interface UseK8sActionMutationOptions<TInput, TOutput> {
  mutationKey: string;
  mutationFn: (input: TInput) => Promise<TOutput>;
  messages: {
    loading: (input: TInput) => string;
    success: (input: TInput, output: TOutput) => string;
    error: (input: TInput, err: Error) => string;
  };
  /**
   * Query-key prefixes to invalidate on success. Each entry is matched as a TanStack
   * Query prefix (queries whose key starts with this array are invalidated).
   * Required to prevent the previous behavior of invalidating the entire cache.
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
        showToast(options.messages.success(input, output), "success", { id: loadingId });
      } catch (rawErr) {
        const err = rawErr instanceof Error ? rawErr : new Error(String(rawErr));
        showToast(options.messages.error(input, err), "error", {
          id: loadingId,
          description: err.message,
          duration: 10000,
        });
        throw err;
      }

      // Invalidate after the success toast so a failed invalidation does not fire the
      // error toast — the K8s PATCH already succeeded and the user should not see a
      // misleading failure message because of a cache bookkeeping issue.
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
