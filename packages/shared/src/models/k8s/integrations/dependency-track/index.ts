export * from "./create/index.js";
export * from "./edit/index.js";

export interface DepTrackProjectCollectionItem {
  active: boolean;
  classifier: string;
  lastBomImport: number;
  lastBomImportFormat: string;
  lastInheritedRiskScore: number;
  name: string;
  properties: string[];
  tags: string[];
  uuid: string;
  version: string;
}

export type DepTrackProjectData = {
  collection: DepTrackProjectCollectionItem[];
};

export interface DepTrackProjectMetrics {
  collectionLogic: string;
  collectionLogicChanged: boolean;
  components: number;
  critical: number;
  findingsAudited: number;
  findingsTotal: number;
  findingsUnaudited: number;
  firstOccurrence: number;
  high: number;
  inheritedRiskScore: number;
  lastOccurrence: number;
  low: number;
  medium: number;
  policyViolationsAudited: number;
  policyViolationsFail: number;
  policyViolationsInfo: number;
  policyViolationsLicenseAudited: number;
  policyViolationsLicenseTotal: number;
  policyViolationsLicenseUnaudited: number;
  policyViolationsOperationalAudited: number;
  policyViolationsOperationalTotal: number;
  policyViolationsOperationalUnaudited: number;
  policyViolationsSecurityAudited: number;
  policyViolationsSecurityTotal: number;
  policyViolationsSecurityUnaudited: number;
  policyViolationsTotal: number;
  policyViolationsUnaudited: number;
  policyViolationsWarn: number;
  suppressed: number;
  unassigned: number;
  vulnerabilities: number;
  vulnerableComponents: number;
}
