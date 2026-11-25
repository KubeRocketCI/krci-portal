import type { PlatformFindingsList } from "@my-project/shared";
import { createDefectDojoClient, isDefectDojoConfigured } from "../../../clients/defectDojo/index.js";
import type { CustomSession } from "../../../context/types.js";
import { NO_PLATFORM_FACTS, loadPlatformFacts } from "./facts.js";
import { readPlatformFindings, type PlatformListKind, type PlatformListRequest } from "./list.js";

export async function readPlatformList(
  session: CustomSession,
  request: PlatformListRequest,
  kind: PlatformListKind
): Promise<PlatformFindingsList> {
  if (!isDefectDojoConfigured(process.env)) {
    return { state: "notConfigured" };
  }

  const facts =
    request.level === "runtime"
      ? await loadPlatformFacts(session, request.namespace, { applications: true })
      : NO_PLATFORM_FACTS;
  return readPlatformFindings(createDefectDojoClient(), facts, request, kind);
}
