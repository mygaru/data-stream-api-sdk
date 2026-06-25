import type { DataStreamApiClient } from '../services/client';
import type { DataStreamApiError } from '../services/errors';
import type { DataStreamApi } from './api.types';
import type { DataStreamApiConfig } from './config.types';

export interface BrowserDataStreamApi extends DataStreamApi {
  cmd: Array<() => void>;
  init(config: DataStreamApiConfig): DataStreamApiClient;
  Error: typeof DataStreamApiError;
}

declare global {
  interface Window {
    DataStreamApiClient?: BrowserDataStreamApi;
  }
}
