import { getCvssColor } from "../../../sca/utils/cvss";

interface CvssScoreProps {
  score: number | undefined;
}

/**
 * Format CVSS score with proper color from constants
 */
export function CvssScore({ score }: CvssScoreProps) {
  if (score === undefined) {
    return <span className="text-muted-foreground text-sm">N/A</span>;
  }

  return (
    <span className="font-semibold" style={{ color: getCvssColor(score) }}>
      {score.toFixed(1)}
    </span>
  );
}
