export function isRateLimitError(error: unknown): boolean {
  if (!error) return false;

  const status = (error as { response?: { status?: number } }).response?.status;
  if (status === 429) return true;

  if (error instanceof Error) {
    return /\b429\b/.test(error.message);
  }

  return false;
}
