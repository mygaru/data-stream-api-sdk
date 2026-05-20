export const parseCookies = (): Record<string, string> => {
  const cookie = globalThis.document?.cookie;

  if (!cookie) return {};

  return cookie.split(';').reduce<Record<string, string>>((acc, part) => {
    const [key, ...rest] = part.trim().split('=');

    if (!key) return acc;

    acc[key] = decodeURIComponent(rest.join('='));

    return acc;
  }, {});
};

export const readCookie = (name: string): string | undefined => {
  try {
    const cookies = parseCookies();

    return cookies[name];
  } catch {
    return undefined;
  }
};
