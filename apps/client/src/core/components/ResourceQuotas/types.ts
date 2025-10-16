export interface QuotaDetails {
  hard?: number;
  used?: number;
  usedPercentage?: number;
  hard_initial?: string;
  used_initial?: string;
  [key: string]: unknown;
}

export interface ParsedQuotas {
  [entity: string]: QuotaDetails;
}

export interface CircleProgressProps {
  loadPercentage: number;
  color: string;
}

export interface RQItemProps {
  entity: string;
  details: QuotaDetails;
}
