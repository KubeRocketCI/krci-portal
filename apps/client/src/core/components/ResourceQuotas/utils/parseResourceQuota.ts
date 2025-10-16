import { ResourceQuota } from "@my-project/shared";
import { ParsedQuotas, QuotaDetails } from "../types";
import { convertToNumber } from "./convertToNumber";

export const parseResourceQuota = (
  items: ResourceQuota[],
  useAnnotations: boolean
): {
  quotas: ParsedQuotas;
  highestUsedQuota: QuotaDetails | null;
} => {
  const quotas = items.reduce<ParsedQuotas>((acc, item) => {
    if (useAnnotations) {
      const annotations = item.metadata.annotations || {};
      Object.keys(annotations).forEach((key) => {
        const [category, entity] = key.substring(key.lastIndexOf("/") + 1).split("-");
        const value = convertToNumber(annotations[key]);

        if (!acc[entity]) acc[entity] = {};
        acc[entity][category] = value;
        acc[entity][`${category}_initial`] = annotations[key];
      });
    } else {
      const status = item.status || {};
      ["hard", "used"].forEach((statusType) => {
        const statusData = (status as Record<string, Record<string, string | number>>)[statusType] || {};
        Object.keys(statusData).forEach((key) => {
          const entity = key;
          const value = convertToNumber(String(statusData[key]));

          if (!acc[entity]) acc[entity] = {};
          acc[entity][statusType] = value;
          acc[entity][`${statusType}_initial`] = String(statusData[key]);
        });
      });
    }

    return acc;
  }, {});

  const highestUsedQuota = Object.entries(quotas).reduce<QuotaDetails | null>((acc, [entity, details]) => {
    const used = details.used || 0;
    const hard = details.hard || 0;
    const usedPercentage = (used / hard) * 100;

    if (!acc || usedPercentage > (acc.usedPercentage ?? 0)) {
      return {
        entity,
        used,
        hard,
        usedPercentage,
      };
    }

    return acc;
  }, null);

  return { quotas, highestUsedQuota };
};
