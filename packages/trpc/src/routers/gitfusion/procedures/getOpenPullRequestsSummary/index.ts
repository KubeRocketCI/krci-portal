import { z } from "zod";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { createGitFusionClient } from "../../../../clients/gitfusion/index.js";
import { K8sClient } from "../../../../clients/k8s/index.js";
import { k8sCodebaseConfig, type Codebase, type KubeObjectListBase } from "@my-project/shared";
import { TRPCError } from "@trpc/server";
import { ERROR_K8S_CLIENT_NOT_INITIALIZED } from "../../../k8s/errors/index.js";
import { handleK8sError } from "../../../k8s/utils/handleK8sError/index.js";

const MAX_CODEBASES = 10;
const PRS_PER_REPO = 3;

/**
 * Get aggregated open pull request summary across all codebases in a namespace.
 *
 * Server-side aggregation: lists Codebase CRDs via K8s API, then fetches
 * open PRs per repo via GitFusion. Returns a compact summary for the
 * dashboard overview widget.
 */
export const getOpenPullRequestsSummaryProcedure = protectedProcedure
  .input(
    z.object({
      clusterName: z.string(),
      namespace: z.string(),
    })
  )
  .query(async ({ input, ctx }) => {
    const { namespace } = input;

    const k8sClient = new K8sClient(ctx.session);

    if (!k8sClient.KubeConfig) {
      throw new TRPCError(ERROR_K8S_CLIENT_NOT_INITIALIZED);
    }

    let codebases: Codebase[];
    try {
      const list = (await k8sClient.listResource(
        k8sCodebaseConfig,
        namespace
      )) as unknown as KubeObjectListBase<Codebase>;
      codebases = list.items ?? [];
    } catch (error) {
      throw handleK8sError(error);
    }

    if (codebases.length === 0) {
      return { repos: [], totalOpen: 0 };
    }

    const gitFusionClient = createGitFusionClient();

    const repos: Array<{
      codebaseName: string;
      openCount: number;
      recentPRs: Array<{
        id: string;
        number: number;
        title: string;
        url: string;
        author?: string;
        updatedAt: string;
      }>;
    }> = [];

    let totalOpen = 0;

    const codebasesToProcess = codebases.slice(0, MAX_CODEBASES);

    const results = await Promise.allSettled(
      codebasesToProcess.map(async (codebase) => {
        const gitUrlPath = codebase.spec.gitUrlPath || "";
        const gitServer = codebase.spec.gitServer || "";
        const pathParts = gitUrlPath.split("/").filter(Boolean);
        const repoName = pathParts.at(-1) || "";
        const owner = pathParts.slice(0, -1).join("/");

        if (!gitServer || !owner || !repoName) return null;

        const response = await gitFusionClient.getPullRequests(gitServer, owner, repoName, "open", 1, PRS_PER_REPO);

        const openCount = response.pagination?.total ?? response.data.length;

        return {
          codebaseName: codebase.metadata.name,
          openCount,
          recentPRs: response.data.slice(0, PRS_PER_REPO).map((pr) => ({
            id: pr.id,
            number: pr.number,
            title: pr.title,
            url: pr.url,
            author: pr.author?.name,
            updatedAt: pr.updated_at,
          })),
        };
      })
    );

    for (const result of results) {
      if (result.status === "fulfilled" && result.value) {
        repos.push(result.value);
        totalOpen += result.value.openCount;
      }
    }

    return { repos, totalOpen };
  });
