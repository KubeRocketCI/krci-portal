import { useMemo, useState } from "react";
import yaml from "js-yaml";
import { Editor } from "@monaco-editor/react";
import { GitCompare, RefreshCw, Save } from "lucide-react";
import { Button } from "@/core/components/ui/button";
import { ButtonWithPermission } from "@/core/components/ButtonWithPermission";
import { useMonacoTheme } from "@/core/hooks/useTheme";
import { useK8sUpdate } from "../../hooks/useK8sUpdate";
import { usePermissions } from "@/k8s/api/hooks/usePermissions";
import { YamlDiffDialog } from "./YamlDiffDialog";
import type { K8sResourceConfig, KubeObjectBase } from "@my-project/shared";

interface Props {
  item: KubeObjectBase;
  config: K8sResourceConfig;
}

export function ResourceYamlTab({ item, config }: Props) {
  const initialYaml = useMemo(() => yaml.dump(item), [item]);
  const [draft, setDraft] = useState(initialYaml);
  const [diffOpen, setDiffOpen] = useState(false);
  const isUnchanged = draft === initialYaml;
  const perms = usePermissions({
    group: config.group,
    version: config.version,
    resourcePlural: config.pluralName,
  });
  const canUpdate = perms.data?.update;
  const { mutate, isPending } = useK8sUpdate(config);
  const monacoTheme = useMonacoTheme();

  const handleSave = () => {
    let body: unknown;
    try {
      body = yaml.load(draft);
    } catch {
      return;
    }
    mutate({ namespace: item.metadata?.namespace ?? "", name: item.metadata?.name ?? "", body });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 border-b px-4 py-2">
        <ButtonWithPermission
          allowed={canUpdate?.allowed ?? false}
          reason={canUpdate?.reason ?? ""}
          ButtonProps={{ onClick: handleSave, disabled: isPending || isUnchanged, size: "sm" }}
        >
          <Save size={14} className="mr-1.5" /> Save
        </ButtonWithPermission>
        <Button variant="ghost" size="sm" disabled={isUnchanged} onClick={() => setDraft(initialYaml)}>
          <RefreshCw size={14} className="mr-1.5" /> Reset
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setDiffOpen(true)}>
          <GitCompare size={14} className="mr-1.5" /> Preview changes
        </Button>
      </div>
      <Editor
        language="yaml"
        theme={monacoTheme}
        value={draft}
        onChange={(v) => setDraft(v ?? "")}
        height="60vh"
        options={{ minimap: { enabled: false } }}
      />
      <YamlDiffDialog open={diffOpen} onClose={() => setDiffOpen(false)} current={initialYaml} draft={draft} />
    </div>
  );
}
