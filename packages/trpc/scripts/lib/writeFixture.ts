import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { format, resolveConfig } from "prettier";

export async function writeFixtureJson(output: string, data: unknown, secrets: readonly string[] = []): Promise<void> {
  const json = `${JSON.stringify(data, null, 2)}\n`;
  if (secrets.some((secret) => json.includes(secret))) {
    throw new Error("The output holds a secret it was asked to keep out.");
  }

  await mkdir(dirname(output), { recursive: true });
  // plugins: [] overrides the client prettier plugin; trpc does not resolve it.
  await writeFile(output, await format(json, { ...(await resolveConfig(output)), plugins: [], filepath: output }));
}
