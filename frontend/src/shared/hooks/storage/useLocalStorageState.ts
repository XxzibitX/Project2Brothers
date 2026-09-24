import { useState } from "react";
import { storage } from "./lib/storage";

export function useLocalStorageState<T>(
  key: string,
  defaultValue: T,
) {
  const [value, setValue] = useState<T>(
    () => storage.get(key, defaultValue) ?? defaultValue,
  );

  const updateValue: React.Dispatch<React.SetStateAction<T>> = (
    nextValue,
  ) => {
    setValue((prevValue) => {
      const value =
        typeof nextValue === "function"
          ? (nextValue as (prev: T) => T)(prevValue)
          : nextValue;

      storage.set(key, value);

      return value;
    });
  };

  return [value, updateValue] as const;
}