import type { KubeCondition, KubeMetadata } from "../../../common/types.js";

export interface CRDVersion {
  name: string;
  served: boolean;
  storage: boolean;
  additionalPrinterColumns?: Array<{
    name: string;
    type: "string" | "integer" | "number" | "boolean" | "date";
    /** Optional format hint per CRD v1 spec (e.g. "byte", "date-time", "int32"). */
    format?: string;
    jsonPath: string;
    description?: string;
    priority?: number;
  }>;
  schema?: { openAPIV3Schema?: Record<string, unknown> };
}

export interface CRDObject {
  apiVersion: "apiextensions.k8s.io/v1";
  kind: "CustomResourceDefinition";
  // Use the canonical KubeMetadata to inherit every field tracked by the
  // central metadata schema (resourceVersion, deletionTimestamp, finalizers,
  // generation, managedFields, ownerReferences, etc.) and avoid drift.
  metadata: KubeMetadata;
  spec: {
    group: string;
    scope: "Namespaced" | "Cluster";
    names: {
      kind: string;
      plural: string;
      singular?: string;
      listKind?: string;
      shortNames?: string[];
      categories?: string[];
    };
    versions: CRDVersion[];
    conversion?: {
      strategy: "None" | "Webhook";
      conversionReviewVersions?: string[];
      webhook?: Record<string, unknown>;
    };
  };
  status?: {
    conditions?: KubeCondition[];
    storedVersions?: string[];
    acceptedNames?: {
      kind: string;
      plural: string;
      singular?: string;
      listKind?: string;
      shortNames?: string[];
    };
  };
}
