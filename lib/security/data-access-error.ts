export class DataAccessError extends Error {
  readonly code = "DATA_ACCESS_UNAVAILABLE";

  constructor(readonly surface: string) {
    super(`Authenticated data was unavailable for ${surface}.`);
    this.name = "DataAccessError";
  }
}

export function requireData<T>(value: T | null | undefined, surface: string): T {
  if (value === null || value === undefined) throw new DataAccessError(surface);
  return value;
}
