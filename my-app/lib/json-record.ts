/** JSON responses are untrusted values in both browser and Worker runtimes. */
export function jsonRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown> : {};
}
