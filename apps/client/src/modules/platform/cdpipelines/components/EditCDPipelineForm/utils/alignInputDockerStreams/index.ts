/**
 * Enforces the 1:1 length invariant between applications and inputDockerStreams.
 * Trims excess entries and pads missing entries with empty strings.
 * Neither the CRD, webhook, nor operator validates this invariant.
 */
export function alignInputDockerStreams(
  inputDockerStreams: string[] | undefined,
  applicationsLength: number
): string[] {
  const streams = inputDockerStreams ?? [];
  const trimmed = streams.slice(0, applicationsLength);

  while (trimmed.length < applicationsLength) {
    trimmed.push("");
  }

  return trimmed;
}
