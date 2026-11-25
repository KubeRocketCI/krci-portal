import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ExposedSecretsInput, PlatformFindingsList } from "@my-project/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { queryClient } from "@/core/clients/queryClient";
import { useTRPCClient } from "@/core/providers/trpc";
import { useExposedSecrets } from "./useExposedSecrets";

vi.mock("@/core/providers/trpc", () => ({ useTRPCClient: vi.fn() }));

const query = vi.fn();

const INPUT: ExposedSecretsInput = { level: "code", namespace: "krci", codebase: "demo-app", page: 0, pageSize: 25 };

const DATA: PlatformFindingsList = { state: "data", total: 0, findings: [], truncated: false };

function renderSecrets(input: ExposedSecretsInput | null) {
  return renderHook((props: { input: ExposedSecretsInput | null }) => useExposedSecrets(props.input), {
    initialProps: { input },
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });
}

describe("useExposedSecrets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    vi.mocked(useTRPCClient).mockReturnValue({ defectDojo: { getExposedSecrets: { query } } } as never);
  });

  it("asks the server with the typed filters and the page of one list", async () => {
    query.mockResolvedValue(DATA);

    const { result } = renderSecrets(INPUT);
    await waitFor(() => expect(result.current.data).toEqual(DATA));

    expect(query).toHaveBeenCalledWith(INPUT);
  });

  it("asks nothing for a list that is not asked for: Runtime under Mitigated", () => {
    const { result } = renderSecrets(null);

    expect(result.current.fetchStatus).toBe("idle");
    expect(query).not.toHaveBeenCalled();
  });

  it("shows nothing it showed before once the list is not asked for", async () => {
    query.mockResolvedValue(DATA);

    const { result, rerender } = renderSecrets(INPUT);
    await waitFor(() => expect(result.current.data).toEqual(DATA));
    rerender({ input: null });

    expect(result.current.data).toBeUndefined();
  });

  it("asks nothing until the installation namespace is known", () => {
    const { result } = renderSecrets({ ...INPUT, namespace: "" });

    expect(result.current.fetchStatus).toBe("idle");
    expect(query).not.toHaveBeenCalled();
  });
});
