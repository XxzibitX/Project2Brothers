import ky from "ky";

export const apiClient = ky.create({
  prefixUrl: `${import.meta.env.VITE_API_BASE_URL}`,
  credentials: "include",
  timeout: 45_000,
  hooks: {
    beforeError: [
      async (error) => {
        const { response } = error;
        if (response) {
          try {
            const errorData = (await response.json()) as {
              message?: string | string[];
            };
            const msg = errorData?.message;
            error.message =
              (Array.isArray(msg) ? msg.join("; ") : msg) ||
              `Ошибка HTTP: ${response.status}`;
          } catch {
            error.message = `Ошибка HTTP: ${response.status}`;
          }
        }
        return error;
      },
    ],
  },
});
