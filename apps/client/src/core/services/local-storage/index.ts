export const LOCAL_STORAGE_SERVICE = {
  getItem: (key: string) => {
    try {
      const lsValue = localStorage.getItem(key);
      if (!lsValue || lsValue === "undefined") return null;
      return JSON.parse(lsValue);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: unknown) => {
    localStorage.setItem(key, JSON.stringify(value));
  },
  removeItem: (key: string) => {
    localStorage.removeItem(key);
  },
};
