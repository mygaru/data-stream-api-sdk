import { DataStreamApiClient } from './services/client';
import { DataStreamApiError } from './services/errors';
import type { BrowserDataStreamApi, CommandQueue, CommandQueueEntry } from './types';

let instance: DataStreamApiClient | null = null;

const replayQueue = (queue: CommandQueueEntry[]): void => {
  const sdkRecord = browserDataStreamApiClient as unknown as Record<
    string,
    ((...rest: unknown[]) => unknown) | unknown
  >;

  for (const entry of queue) {
    const [methodName, ...args] = Array.from(entry as ArrayLike<unknown>);
    const handler = sdkRecord[methodName as string];

    try {
      if (typeof handler !== 'function') {
        throw new DataStreamApiError(
          'VALIDATION_ERROR',
          `Unknown DataStreamApiClient method: "${String(methodName)}"`,
        );
      }

      (handler as (...rest: unknown[]) => unknown).apply(browserDataStreamApiClient, args);
    } catch (err) {
      console.error('[DataStreamApiClient] queued call failed:', err);
    }
  }
};

const getDataStreamApiClient = (): DataStreamApiClient => {
  if (!instance) {
    throw new DataStreamApiError('CONFIGURATION_ERROR', 'DataStreamApiClient is not initialized');
  }

  return instance;
};

const browserDataStreamApiClient: BrowserDataStreamApi = {
  init(config) {
    instance = new DataStreamApiClient(config);

    const queue = (browserDataStreamApiClient as BrowserDataStreamApi & CommandQueue).q;

    if (Array.isArray(queue) && queue.length > 0) {
      (browserDataStreamApiClient as BrowserDataStreamApi & CommandQueue).q = [];

      replayQueue(queue);
    }

    return instance;
  },
  setText(name, value) {
    return getDataStreamApiClient().setText(name, value);
  },
  addText(name, value, delimiter) {
    return getDataStreamApiClient().addText(name, value, delimiter);
  },
  setNum(name, value) {
    return getDataStreamApiClient().setNum(name, value);
  },
  stepNum(name, step) {
    return getDataStreamApiClient().stepNum(name, step);
  },
  setBool(name, value) {
    return getDataStreamApiClient().setBool(name, value);
  },
  Error: DataStreamApiError,
};

if (typeof window !== 'undefined') {
  const existing = window.DataStreamApiClient as (BrowserDataStreamApi & CommandQueue) | undefined;
  const queue = existing?.q;
  const client = browserDataStreamApiClient as BrowserDataStreamApi & CommandQueue;

  window.DataStreamApiClient = client;

  if (Array.isArray(queue)) {
    client.q = queue;
  }
}

export default browserDataStreamApiClient;
