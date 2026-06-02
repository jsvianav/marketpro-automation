export function uniqueEmail(base: string): string {
  const ts = Date.now();
  const parts = base.split('@');
  return `${parts[0]}_${ts}@${parts[1]}`;
}

export function uniqueSuffix(): string {
  return String(Date.now());
}
