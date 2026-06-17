import { SelectOption } from "@/core/types/forms";
import { CodebaseImageStream } from "@my-project/shared";

export const createImageStreamTags = (
  applicationImageStream: CodebaseImageStream | undefined,
  applicationVerifiedImageStream: CodebaseImageStream | undefined
) => {
  const tags = applicationImageStream?.spec?.tags ?? [];

  let base: SelectOption<string>[] = tags.map(({ name }) => ({ label: name, value: name })).reverse();

  if (tags.length) {
    const latestTagValue = tags.at(-1)?.name;
    base = [{ label: `[LATEST] - ${latestTagValue}`, value: `latest::${latestTagValue}` }, ...base];
  }

  if (applicationVerifiedImageStream?.spec?.tags?.length) {
    const latestTagValue = applicationVerifiedImageStream.spec.tags.at(-1)?.name;
    base = [{ label: `[STABLE] - ${latestTagValue}`, value: `stable::${latestTagValue}` }, ...base];
  }

  return base;
};
