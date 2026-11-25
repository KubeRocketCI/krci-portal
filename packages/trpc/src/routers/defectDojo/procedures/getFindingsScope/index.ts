import { findingsScopeInputSchema, findingsScopeSchema } from "@my-project/shared";
import { createDefectDojoClient, isDefectDojoConfigured } from "../../../../clients/defectDojo/index.js";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { loadPlatformFacts } from "../../platformFindings/facts.js";
import { NAMESPACE_PRODUCT_TAG_TEXT, toFindingsScope } from "../../platformFindings/scope.js";

export const getFindingsScopeProcedure = protectedProcedure
  .input(findingsScopeInputSchema)
  .output(findingsScopeSchema)
  .query(async ({ input, ctx }) => {
    if (!isDefectDojoConfigured(process.env)) {
      return { state: "notConfigured" };
    }

    const [facts, products] = await Promise.all([
      loadPlatformFacts(ctx.session, input.namespace),
      createDefectDojoClient().listProductsWithTagText(NAMESPACE_PRODUCT_TAG_TEXT),
    ]);
    return toFindingsScope(facts, products);
  });
