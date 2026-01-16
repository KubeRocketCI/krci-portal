export const safeDecode = (value: string, defaultValue: string = "") => {
  try {
    return value ? Buffer.from(value, "base64").toString("utf-8") : defaultValue;
  } catch (e) {
    console.error(e);
    return defaultValue;
  }
};

export const safeEncode = (value: string) => {
  try {
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
