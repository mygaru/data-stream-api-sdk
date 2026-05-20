export const readCookie = (name: string): string | undefined => {
  try {
    const cookie = globalThis.document?.cookie;

    if (!cookie) {
      return undefined;
    }

    const parts = cookie.split(';').map((part) => part.trim());
    const entry = parts.find((part) => part.startsWith(`${name}=`));

    if (!entry) {
      return undefined;
    }

    return decodeURIComponent(entry.slice(name.length + 1));
  } catch {
    return undefined;
  }
};
