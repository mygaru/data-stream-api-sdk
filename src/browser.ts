import { DataStreamApiClient } from './services/client';
import { DataStreamApiError } from './services/errors';
import type { BrowserDataStreamApi } from './types';

let instance: DataStreamApiClient | null = null;
let resolveReady: (client: DataStreamApiClient) => void;
const ready = new Promise<DataStreamApiClient>((resolve) => {
  resolveReady = resolve;
});

const getClient = (): Promise<DataStreamApiClient> => {
  if (instance) return Promise.resolve(instance);
  return ready;
};

const execCmd = (...callbacks: Array<() => void>): number => {
  for (const cb of callbacks) {
    try {
      if (typeof cb === 'function') {
        cb();
      }
    } catch (err) {
      console.error('[DataStreamApiClient] command failed:', err);
    }
  }
  return callbacks.length;
};

const browserDataStreamApiClient: BrowserDataStreamApi = {
  cmd: [],
  init(config) {
    instance = new DataStreamApiClient(config);
    resolveReady(instance);

    const { cmd } = browserDataStreamApiClient;
    for (let i = 0; i < cmd.length; i++) {
      execCmd(cmd[i]);
    }
    cmd.length = 0;
    cmd.push = execCmd;

    return instance;
  },
  async setText(name, value) {
    const client = await getClient();
    return client.setText(name, value);
  },
  async addText(name, value) {
    const client = await getClient();
    return client.addText(name, value);
  },
  async setNum(name, value) {
    const client = await getClient();
    return client.setNum(name, value);
  },
  async stepNum(name, step) {
    const client = await getClient();
    return client.stepNum(name, step);
  },
  async setBool(name, value) {
    const client = await getClient();
    return client.setBool(name, value);
  },
  Error: DataStreamApiError,
};

if (typeof window !== 'undefined') {
  const pending = (window.DataStreamApiClient as { cmd?: Array<() => void> } | undefined)?.cmd;
  window.DataStreamApiClient = browserDataStreamApiClient;
  if (Array.isArray(pending)) {
    browserDataStreamApiClient.cmd = pending;
  }
}

export default browserDataStreamApiClient;
