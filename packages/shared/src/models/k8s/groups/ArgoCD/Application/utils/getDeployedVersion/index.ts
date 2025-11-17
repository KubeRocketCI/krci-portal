import { Application } from "../../types.js";

export const getDeployedVersion = (
  withValuesOverride: boolean,
  isHelm: boolean,
  application: Application | undefined
): string => {
  if (!application) {
    return "NaN";
  }

  if (withValuesOverride) {
    // @ts-expect-error TODO: fix this
    const sourcesHelm = application?.spec?.sources?.find((el) => el.helm);

    if (isHelm) {
      return sourcesHelm?.targetRevision?.split("/").at(-1);
    }

    return sourcesHelm?.helm?.parameters?.find((el: { [key: string]: unknown }) => el.name === "image.tag")?.value;
  } else {
    if (isHelm) {
      return application?.spec?.source?.targetRevision?.split("/").at(-1) || "";
    }

    return (
      application?.spec?.source?.helm?.parameters?.find(
        // @ts-expect-error TODO: fix this
        (el) => el.name === "image.tag"
      )?.value || ""
    );
  }
};
