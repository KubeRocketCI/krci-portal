export const safeDecode = (value: string, defaultValue: string = "") => {
  try {
    return value ? atob(unescape(value)) : defaultValue;
  } catch (e) {
    console.error(e);
  }
};

export const safeEncode = (value: string) => {
  try {
    return btoa(unescape(value));
  } catch (e) {
    console.error(e);
  }
};

export const parseConfigJson = (configJson: string) => {
  const decodedConfigJson = safeDecode(configJson);
  return decodedConfigJson ? JSON.parse(decodedConfigJson) : {};
};
