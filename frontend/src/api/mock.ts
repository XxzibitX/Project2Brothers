/**
 * Пока бэкенда нет — API ходит в моки.
 * Когда бэкенд готов: поставь VITE_USE_API_MOCK=false и проверь эндпоинты в *.api.ts
 */
export const USE_API_MOCK = import.meta.env.VITE_USE_API_MOCK !== "false";

export function mockDelay(ms = 280): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}
