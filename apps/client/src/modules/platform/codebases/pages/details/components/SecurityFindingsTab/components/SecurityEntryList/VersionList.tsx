import { FocusableTooltipText } from "@/modules/platform/security/components/defectdojo/FocusableTooltipText";
import { MAX_VERSIONS_SHOWN, truncateMiddle } from "../../utils";

const MAX_VERSION_LENGTH = 32;

function Version({ version }: { version: string }) {
  const text = truncateMiddle(version, MAX_VERSION_LENGTH);

  if (text === version) {
    return <span className="block">{version}</span>;
  }

  return (
    <FocusableTooltipText hint={version} screenReaderText={version} className="block">
      {text}
    </FocusableTooltipText>
  );
}

/** The first MAX_VERSIONS_SHOWN versions, long tags middle-truncated, the rest behind "+N". */
export function VersionList({ versions }: { versions: string[] }) {
  if (versions.length === 0) {
    return null;
  }

  const hidden = versions.slice(MAX_VERSIONS_SHOWN);

  return (
    <ul aria-label="Versions" className="text-muted-foreground mt-0.5 flex flex-wrap gap-x-2 font-mono text-xs">
      {versions.slice(0, MAX_VERSIONS_SHOWN).map((version) => (
        <li key={version} className="min-w-0">
          <Version version={version} />
        </li>
      ))}
      {hidden.length > 0 && (
        <li>
          <FocusableTooltipText
            hint={
              <ul className="font-mono text-xs">
                {hidden.map((version) => (
                  <li key={version} className="break-all">
                    {version}
                  </li>
                ))}
              </ul>
            }
            screenReaderText={`${hidden.length} more versions: ${hidden.join(", ")}`}
            className="block"
          >
            +{hidden.length}
          </FocusableTooltipText>
        </li>
      )}
    </ul>
  );
}
