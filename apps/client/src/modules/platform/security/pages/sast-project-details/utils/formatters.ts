export function formatDebtTime(debt: string | undefined): string {
  if (!debt) return "—";

  const match = debt.match(/^(\d+)(min|h|d)$/);
  if (!match) return debt;

  const [, value, unit] = match;
  const unitMap: Record<string, string> = {
    min: value === "1" ? "min" : "mins",
    h: value === "1" ? "hour" : "hours",
    d: value === "1" ? "day" : "days",
  };

  return `${value} ${unitMap[unit]}`;
}

export function formatRating(rating: string | undefined): string {
  if (!rating) return "—";

  const ratingMap: Record<string, string> = {
    "1.0": "A",
    "2.0": "B",
    "3.0": "C",
    "4.0": "D",
    "5.0": "E",
  };

  return ratingMap[rating] || "—";
}

export function formatNumber(value: number | string | undefined): string {
  if (value === undefined || value === null) return "—";

  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "—";

  return new Intl.NumberFormat("en-US").format(num);
}

export function formatPercentage(value: number | string | undefined): string {
  if (value === undefined || value === null) return "—";

  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "—";

  return `${num.toFixed(1)}%`;
}

export function formatDate(dateString: string | undefined): string {
  if (!dateString) return "—";

  try {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
    });
  } catch {
    return dateString;
  }
}
