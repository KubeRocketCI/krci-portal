import yaml from "js-yaml";

export function removeStatusField(yamlText: string): string {
  try {
    const obj = yaml.load(yamlText) as Record<string, unknown> | null;
    if (obj && typeof obj === "object") {
      delete (obj as { status?: unknown }).status;
      return yaml.dump(obj);
    }
  } catch {
    return yamlText;
  }
  return yamlText;
}
