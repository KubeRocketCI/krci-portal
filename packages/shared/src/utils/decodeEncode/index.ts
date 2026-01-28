const isBrowser = typeof globalThis !== "undefined" && typeof globalThis.Buffer === "undefined";

function base64DecodeBrowser(value: string): string {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

function base64EncodeBrowser(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export const safeDecode = (value: string, defaultValue: string = "") => {
  try {
    if (!value) return defaultValue;
    if (isBrowser) return base64DecodeBrowser(value);
    return Buffer.from(value, "base64").toString("utf-8");
  } catch (e) {
    console.error(e);
    return defaultValue;
  }
};

export const safeEncode = (value: string) => {
  try {
    if (isBrowser) return base64EncodeBrowser(value);
    return Buffer.from(value, "utf-8").toString("base64");
  } catch (e) {
    console.error(e);
    return "";
  }
};

export const parseConfigJson = (configJson: string) => {
  const decodedConfigJson = safeDecode(configJson);
  return decodedConfigJson ? JSON.parse(decodedConfigJson) : {};
};
