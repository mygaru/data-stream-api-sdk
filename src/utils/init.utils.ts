import type { DataStreamApiClient } from '../services/client';
import { DataStreamApiError } from '../services/errors';
import type { BrowserDataStreamApi, CmdCallback, CommandQueue } from '../types';

export let instance: DataStreamApiClient | null = null;
export const pending: CmdCallback[] = [];

export const execCmd = (...callbacks: CmdCallback[]): number => {
  callbacks.forEach((callback) => {
    try {
      if (callback) {
        callback();
      }
    } catch (err) {
      console.error('[DataStreamApiClient] request failed:', err);
    }
  });

  return callbacks.length;
};

export const runCmdQueue = (queue: CmdCallback[]): void => {
  for (let i = 0; i < queue.length; i++) {
    const callback = queue[i];

    if (typeof callback === 'function') {
      execCmd(callback);
    }
  }
};

export const getCmd = (): CmdCallback[] => {
  return (window.DataStreamApiClient as BrowserDataStreamApi & CommandQueue).cmd ?? [];
};

export const queueMethod = (callback: CmdCallback): void => {
  pending.push(callback);
};

export const runPendingTasks = (): void => {
  runCmdQueue(pending);
  pending.length = 0;
};

export const flushCmdUntilInit = (): void => {
  const queue = getCmd();

  while (queue.length > 0 && !instance) {
    const callback = queue.shift();

    if (typeof callback === 'function') {
      execCmd(callback);
    }
  }
};

export const pushCmd = (...callbacks: CmdCallback[]): number => {
  if (instance) {
    return execCmd(...callbacks);
  }

  const result = Array.prototype.push.apply(getCmd(), callbacks);
  flushCmdUntilInit();

  return result;
};

export const runOrQueue = <T>(task: () => Promise<T>): Promise<T> | Promise<void> => {
  if (instance) {
    return task();
  }

  queueMethod(() => {
    task();
  });

  return Promise.resolve();
};

export const getDataStreamApiClient = (): DataStreamApiClient => {
  if (!instance) {
    throw new DataStreamApiError('CONFIGURATION_ERROR', 'DataStreamApiClient is not initialized');
  }

  return instance;
};

export const setInstance = (client: DataStreamApiClient): void => {
  instance = client;
};
