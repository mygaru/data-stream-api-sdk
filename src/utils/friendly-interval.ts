interface FriendlyIntervalHandle {
  promise: Promise<boolean>;
  cancel: () => void;
}

export function friendlyInterval(
  check: () => boolean,
  intervalMs: number,
  timeoutMs: number,
): FriendlyIntervalHandle {
  let intervalId: ReturnType<typeof setInterval> | 0 = 0;
  let settled = false;

  const promise = new Promise<boolean>((resolve) => {
    const done = (result: boolean) => {
      if (settled) return;
      settled = true;
      if (intervalId) clearInterval(intervalId);
      resolve(result);
    };

    const start = Date.now();

    intervalId = setInterval(() => {
      if (check()) {
        done(true);
        return;
      }
      if (Date.now() - start >= timeoutMs) {
        done(false);
      }
    }, intervalMs);
  });

  const cancel = () => {
    if (settled) return;
    settled = true;
    if (intervalId) clearInterval(intervalId);
  };

  return { promise, cancel };
}
