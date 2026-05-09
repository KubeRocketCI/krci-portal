import { createRandomString, truncateName } from "../../../../../../../utils/index.js";
import { Pipeline } from "../../../Pipeline/types.js";
import { PipelineRunDraft } from "../../types.js";
import { TriggerTemplate } from "../../../TriggerTemplate/index.js";
import { pipelineLabels } from "../../../Pipeline/labels.js";
import { pipelineRunLabels } from "../../labels.js";

interface PipelineRunWorkspaceWithVCT {
  name: string;
  volumeClaimTemplate: {
    spec: {
      accessModes: string[];
      resources: { requests: { storage: string } };
    };
  };
}

// Matches Tekton Triggers placeholder syntax: $(tt.params.<name>)
const TT_PARAM_RE = /^\$\(tt\.params\.([^)]+)\)$/;

type PipelineParamSpec = NonNullable<Pipeline["spec"]["params"]>[number];

// Build a name→string mapping for every Pipeline param. Array defaults become
// "" because arrays cannot appear in K8s label or annotation values.
function buildStringDefaults(pipelineParams: PipelineParamSpec[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const p of pipelineParams) {
    const def = p.default;
    map.set(p.name, def == null || Array.isArray(def) ? "" : String(def));
  }
  return map;
}

// Recursively walk obj and replace every $(tt.params.X) placeholder in any
// string value with its string default. Handles both whole-value placeholders
// and composite strings like "$(tt.params.A)-$(tt.params.B)". This sanitises
// metadata.labels, metadata.annotations, and all other string-typed fields
// before K8s submission — the placeholder syntax contains characters ($, (, ))
// that are forbidden in K8s label values, causing 422 rejections.
function resolveStringPlaceholders(obj: unknown, defaults: Map<string, string>): unknown {
  if (typeof obj === "string") {
    return obj.replace(/\$\(tt\.params\.([^)]+)\)/g, (_, name: string) => defaults.get(name) ?? "");
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => resolveStringPlaceholders(item, defaults));
  }
  if (obj !== null && typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      result[k] = resolveStringPlaceholders(v, defaults);
    }
    return result;
  }
  return obj;
}

// K8s label value must be empty or match [A-Za-z0-9][-A-Za-z0-9_.]*[A-Za-z0-9].
// A composite placeholder like "$(tt.params.A)-$(tt.params.B)" can resolve to
// "-" (both empty), which K8s rejects with 422. Replace invalid results with "".
const K8S_LABEL_VALUE_RE = /^[A-Za-z0-9]([A-Za-z0-9\-_.]{0,61}[A-Za-z0-9])?$/;

function sanitizeLabelValues(labels: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(labels)) {
    out[k] = typeof v === "string" && v !== "" && !K8S_LABEL_VALUE_RE.test(v) ? "" : v;
  }
  return out;
}

// Apply type-aware resolution to spec.params entries. Handles two cases:
//   1. Value is still a $(tt.params.X) placeholder (string pass was skipped).
//   2. Value is "" and the param is an array type — the string pass set it to
//      "" because arrays can't be labels, but spec.params must carry [].
function resolveTtParams(
  draftParams: Array<{ name: string; value: unknown }>,
  pipelineParams: PipelineParamSpec[]
): Array<{ name: string; value: unknown }> {
  const byName = new Map(pipelineParams.map((p) => [p.name, p]));

  return draftParams.map((param) => {
    const spec = byName.get(param.name);

    // Case 1: unresolved placeholder
    if (typeof param.value === "string" && TT_PARAM_RE.test(param.value)) {
      const value = spec?.default ?? (spec?.type === "array" ? [] : "");
      return { name: param.name, value };
    }

    // Case 2: array param degraded to "" by the string pass
    if (spec?.type === "array" && param.value === "") {
      return { name: param.name, value: spec.default ?? [] };
    }

    return param;
  });
}

const getPipelineRunFromTriggerTemplate = (
  triggerTemplate: TriggerTemplate,
  pipeline: Pipeline
): PipelineRunDraft | null => {
  if (!triggerTemplate) {
    return null;
  }

  const template = triggerTemplate.spec?.resourcetemplates?.[0];
  if (!template) {
    return null;
  }

  // Deep-clone so mutations below never write back into the original
  // TriggerTemplate object (e.g. a K8s watch cache entry). The schema only
  // models the fields read here (spec.pipelineRef.name); the runtime payload
  // is a full PipelineRun, which the cast reflects.
  let pipelineRun = structuredClone(template) as unknown as PipelineRunDraft;

  // Always pin pipelineRef to the user-requested pipeline.
  if (pipelineRun.spec?.pipelineRef) {
    pipelineRun.spec.pipelineRef.name = pipeline.metadata.name;
  }

  if (pipeline.spec?.params) {
    // Pass 1: resolve ALL $(tt.params.*) throughout the entire template as
    // strings. Fixes labels, annotations, and any other string-typed field.
    const stringDefaults = buildStringDefaults(pipeline.spec.params);
    pipelineRun = resolveStringPlaceholders(pipelineRun, stringDefaults) as typeof pipelineRun;

    // Pass 1b: sanitize label values. Composite placeholders can resolve to
    // strings like "-" that are syntactically invalid K8s label values.
    if (pipelineRun.metadata?.labels && typeof pipelineRun.metadata.labels === "object") {
      pipelineRun.metadata.labels = sanitizeLabelValues(
        pipelineRun.metadata.labels as Record<string, unknown>
      ) as typeof pipelineRun.metadata.labels;
    }

    // Pass 2: re-apply type-aware resolution to spec.params so that array
    // params get [] instead of the "" assigned by the string pass above.
    if (Array.isArray(pipelineRun.spec?.params)) {
      pipelineRun.spec.params = resolveTtParams(
        pipelineRun.spec.params as { name: string; value: unknown }[],
        pipeline.spec.params
      );
    }
  }

  return pipelineRun;
};

export const createPipelineRunDraftFromPipeline = (
  triggerTemplate: TriggerTemplate | undefined,
  pipeline: Pipeline
): PipelineRunDraft => {
  if (triggerTemplate) {
    const fromTemplate = getPipelineRunFromTriggerTemplate(triggerTemplate, pipeline);
    if (fromTemplate) return fromTemplate;
  }

  const pipelineName = pipeline.metadata.name;
  const pipelineRunNamePrefix = "run-";
  const pipelineRunNamePostfix = `-${createRandomString()}`;

  const truncatedName = truncateName(pipelineName, pipelineRunNamePrefix.length + pipelineRunNamePostfix.length);

  const pipelineRunName = `${pipelineRunNamePrefix}${truncatedName}${pipelineRunNamePostfix}`;

  const pipelineRun: PipelineRunDraft = {
    apiVersion: "tekton.dev/v1",
    kind: "PipelineRun",
    metadata: {
      name: pipelineRunName,
      namespace: pipeline.metadata.namespace,
      labels: {
        [pipelineRunLabels.pipelineType]: pipeline.metadata.labels?.[pipelineLabels.pipelineType],
        [pipelineRunLabels.pipeline]: pipeline.metadata.name,
      },
    },
    spec: {
      pipelineRef: {
        name: pipeline.metadata.name,
      },
      params: (pipeline.spec.params || []).map((param: { name: string; type?: string; default?: unknown }) => ({
        name: param.name,
        value: param.default ?? (param.type === "array" ? [] : ""),
      })),
      ...(pipeline.spec.workspaces?.length
        ? {
            workspaces: pipeline.spec.workspaces.map(
              (ws: { name: string }): PipelineRunWorkspaceWithVCT => ({
                name: ws.name,
                volumeClaimTemplate: {
                  spec: {
                    accessModes: ["ReadWriteOnce"],
                    resources: { requests: { storage: "1Gi" } },
                  },
                },
              })
            ),
          }
        : {}),
    },
  };

  return pipelineRun;
};
