export function collectDuplicates(values: Array<string | undefined>) {
  const seen = new Set<string>();
  const duplicates: string[] = [];

  values.forEach((value) => {
    if (!value) return;
    const normalized = value.toLowerCase();
    if (seen.has(normalized)) {
      duplicates.push(value);
    } else {
      seen.add(normalized);
    }
  });

  return duplicates;
}
