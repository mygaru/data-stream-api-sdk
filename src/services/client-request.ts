import { handleAPIError, handleNetworkError } from '../utils/errors.utils';
import { trimSlashes } from '../utils/helpers.utils';
import { buildQuery } from '../utils/query.utils';
import { DataStreamApiError } from './errors';

const DEFAULT_REQUEST_TIMEOUT_MS = 15000;

interface ClientRequestConfig {
  baseUrl: string;
}

type HttpMethod = 'GET';

export class ClientRequest {
  private readonly config: ClientRequestConfig;

  constructor(config: ClientRequestConfig) {
    this.config = config;

    if (typeof fetch !== 'function') {
      throw new DataStreamApiError('CONFIGURATION_ERROR', 'Fetch API is not available');
    }
  }

  async get(
    relativePath: string,
    query: Record<string, string | number | boolean> = {},
  ): Promise<void> {
    return await this.request('GET', relativePath, query);
  }

  private async request(
    method: HttpMethod,
    relativePath: string,
    query?: Record<string, string | number | boolean>,
  ): Promise<void> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_REQUEST_TIMEOUT_MS);

    try {
      const path = `/data-stream/${trimSlashes(relativePath)}`;
      const url = buildQuery(this.config.baseUrl, path, query ?? {});

      const response = await fetch(url, {
        method,
        signal: controller.signal,
      });

      if (!response.ok) {
        handleAPIError(response);
      }

      return Promise.resolve();
    } catch (error) {
      handleNetworkError(error as Error);
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
