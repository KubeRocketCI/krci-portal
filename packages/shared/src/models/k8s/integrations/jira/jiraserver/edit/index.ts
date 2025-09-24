import { JiraServer } from "../../../../groups/KRCI";
import { editResource } from "../../../utils";
import z from "zod";
import { Draft } from "immer";

const editJiraServerSchema = z.object({
  url: z.string(),
});

export const editJiraServer = (
  existingJiraServer: JiraServer,
  input: z.infer<typeof editJiraServerSchema>
): JiraServer => {
  return editResource(
    existingJiraServer,
    input,
    editJiraServerSchema,
    (draft: Draft<JiraServer>, validatedInput) => {
      // Update spec fields
      if (!draft.spec) {
        draft.spec = {} as any;
      }
      draft.spec.apiUrl = validatedInput.url;
      draft.spec.rootUrl = validatedInput.url;
    }
  );
};
