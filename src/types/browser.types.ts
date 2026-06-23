import type { DataStreamApiClient } from '../services/client';
import type { DataStreamApiError } from '../services/errors';
import type { DataStreamApi } from './api.types';
import type { DataStreamApiConfig } from './config.types';

export interface BrowserDataStreamApi extends DataStreamApi {
  init(config: DataStreamApiConfig): DataStreamApiClient;
  Error: typeof DataStreamApiError;
}

export type CmdCallback = () => void;
export type CommandQueue = { cmd: CmdCallback[] };

export type MyGaruOtp = { id: string };

declare global {
  interface Window {
    DataStreamApiClient?: BrowserDataStreamApi;
  }
}
