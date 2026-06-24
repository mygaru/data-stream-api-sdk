import { DataStreamApiClient } from './services/client';
import { DataStreamApiError } from './services/errors';
import type { BrowserDataStreamApi } from './types';
import { friendlyInterval } from './utils/friendly-interval';

let instance: DataStreamApiClient | null = null;
let resolveReady: (client: DataStreamApiClient) => void;
const ready = new Promise<DataStreamApiClient>((resolve) => {
  resolveReady = resolve;
});

const getClient = (): Promise<DataStreamApiClient> => ready;

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

const OTP_POLL_INTERVAL_MS = 100;
const OTP_POLL_TIMEOUT_MS = 60_000;

const browserDataStreamApiClient: BrowserDataStreamApi = {
  cmd: [],
  init(config) {
    instance = new DataStreamApiClient(config);

    const otp = instance.probeOtp();
    if (otp) {
      instance.lockOtp(otp);
      resolveReady(instance);
    } else {
      const { promise } = friendlyInterval(
        () => !!instance?.probeOtp(),
        OTP_POLL_INTERVAL_MS,
        OTP_POLL_TIMEOUT_MS,
      );

      promise.then((found) => {
        if (found && instance) {
          const otp = instance.probeOtp();
          if (otp) {
            instance.lockOtp(otp);
            resolveReady(instance);
          }
        } else {
          console.error('[DataStreamApiClient] OTP not found within 60s');
        }
      });
    }

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
  browserDataStreamApiClient.cmd.push = execCmd;

  if (Array.isArray(pending)) {
    for (let i = 0; i < pending.length; i++) {
      execCmd(pending[i]);
    }
  }
}

export default browserDataStreamApiClient;
