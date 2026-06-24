interface FriendlyIntervalHandle {
  promise: Promise<boolean>;
  cancel: () => void;
}

export function friendlyInterval(
  check: () => boolean,
  intervalMs: number,
  timeoutMs: number,
): FriendlyIntervalHandle {
  let rafId = 0;
  let intervalId: ReturnType<typeof setInterval> | 0 = 0;
  let settled = false;

  const promise = new Promise<boolean>((resolve) => {
    const done = (result: boolean) => {
      if (settled) return;
      settled = true;
      if (intervalId) clearInterval(intervalId);
      cancelAnimationFrame(rafId);
      resolve(result);
    };

    const start = Date.now();

    intervalId = setInterval(() => {
      rafId = requestAnimationFrame(() => {
        if (check()) {
          done(true);
          return;
        }
        if (Date.now() - start >= timeoutMs) {
          done(false);
        }
      });
    }, intervalMs);
  });

  const cancel = () => {
    if (settled) return;
    settled = true;
    if (intervalId) clearInterval(intervalId);
    cancelAnimationFrame(rafId);
  };

  return { promise, cancel };
}
