export const buildQuery = (
  baseUrl: string,
  normalizedRelativePath: string,
  query: Record<string, string | number | boolean>,
): string => {
  const base = baseUrl.replace(/\/+$/, '');

  const url = new URL(`${base}${normalizedRelativePath}`);

  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, String(value));
  }

  return url.toString();
};
