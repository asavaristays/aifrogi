export function isDatabaseAccessError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string" &&
    ["P1000", "P1001", "P1010", "P2021"].includes((error as { code: string }).code)
  );
}
