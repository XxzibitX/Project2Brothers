export const storage = {
  set<T>(key: string, value: T) {
    console.log("storage.set", key, value);
    localStorage.setItem(key, JSON.stringify(value));
  },

  get<T>(key: string, defaultValue?: T): T | undefined {
    const item = localStorage.getItem(key);

    if (!item) {
      return defaultValue;
    }

    try {
      return JSON.parse(item) as T;
    } catch {
      return defaultValue;
    }
  },

  remove(key: string) {
    localStorage.removeItem(key);
  },

  clear() {
    localStorage.clear();
  },
};