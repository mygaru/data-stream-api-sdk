import { DataStreamApiClient } from './services/client';
import { DataStreamApiError } from './services/errors';
import type { BrowserDataStreamApi, CommandQueue } from './types';
import {
  flushCmdUntilInit,
  getDataStreamApiClient,
  pushCmd,
  runOrQueue,
  runPendingTasks,
  setInstance,
} from './utils/init.utils';

const browserDataStreamApiClient: BrowserDataStreamApi & CommandQueue = {
  cmd: [],
  init(config) {
    const client = new DataStreamApiClient(config);

    setInstance(client);
    runPendingTasks();

    return client;
  },
  setText(name, value) {
    return runOrQueue(() => getDataStreamApiClient().setText(name, value));
  },
  addText(name, value) {
    return runOrQueue(() => getDataStreamApiClient().addText(name, value));
  },
  setNum(name, value) {
    return runOrQueue(() => getDataStreamApiClient().setNum(name, value));
  },
  stepNum(name, step) {
    return runOrQueue(() => getDataStreamApiClient().stepNum(name, step));
  },
  setBool(name, value) {
    return runOrQueue(() => getDataStreamApiClient().setBool(name, value));
  },
  Error: DataStreamApiError,
};

if (typeof window !== 'undefined') {
  const existing = window.DataStreamApiClient as (BrowserDataStreamApi & CommandQueue) | undefined;
  const client = browserDataStreamApiClient;

  client.cmd = existing?.cmd ?? [];
  client.cmd.push = pushCmd;
  window.DataStreamApiClient = client;
  flushCmdUntilInit();
}

export default browserDataStreamApiClient;
