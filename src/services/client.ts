import type { DataStreamApi, DataStreamApiConfig } from '../types';
import { readCookie } from '../utils/cookie.utils';
import { normalizeBaseUrl, validateFieldName, validateOtp } from '../utils/validation.utils';
import { ClientRequest } from './client-request';
import { DataStreamApiError } from './errors';

export class DataStreamApiClient implements DataStreamApi {
  private readonly requestClient: ClientRequest;

  constructor(config: DataStreamApiConfig) {
    if (!config.baseUrl) {
      throw new DataStreamApiError('CONFIGURATION_ERROR', 'Base URL is required');
    }

    const baseUrl = normalizeBaseUrl(config.baseUrl);

    this.requestClient = new ClientRequest({
      baseUrl,
    });
  }

  private resolveOtp(): string {
    const otp = readCookie('iuid') ?? this.readCachedOtp();

    if (otp) {
      const isValidOtp = validateOtp(otp);

      if (isValidOtp) {
        return encodeURIComponent(otp);
      }
    }

    throw new DataStreamApiError('VALIDATION_ERROR', 'OTP is required');
  }

  private readCachedOtp(): string | undefined {
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    try {
      const raw = globalThis.localStorage?.getItem('myg_otp');
      if (!raw) return undefined;

      const entry: { id: string; ts: number } = JSON.parse(raw);
      if (!entry.id || Date.now() - entry.ts > weekMs) return undefined;

      return entry.id;
    } catch {
      return undefined;
    }
  }

  async setText(name: string, value: string): Promise<void> {
    const fieldName = validateFieldName(name);

    if (typeof value !== 'string') {
      throw new DataStreamApiError(
        'VALIDATION_ERROR',
        'Invalid value for setText - expected a string',
      );
    }

    const otp = this.resolveOtp();

    return await this.requestClient.get('/set-text', {
      otp,
      name: fieldName,
      label: value.trim(),
    });
  }

  async addText(name: string, value: string): Promise<void> {
    const fieldName = validateFieldName(name);

    if (typeof value !== 'string' || (typeof value === 'string' && value.trim() === '')) {
      throw new DataStreamApiError(
        'VALIDATION_ERROR',
        'Invalid value for addText - expected a non-empty string',
      );
    }

    const otp = this.resolveOtp();

    return await this.requestClient.get('/add-text', {
      otp,
      name: fieldName,
      label: value.trim(),
    });
  }

  async setNum(name: string, value: number): Promise<void> {
    const fieldName = validateFieldName(name);

    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new DataStreamApiError(
        'VALIDATION_ERROR',
        'Invalid value for setNum - expected a finite number',
      );
    }

    const otp = this.resolveOtp();

    return await this.requestClient.get('/set-number', {
      otp,
      name: fieldName,
      value,
    });
  }

  async stepNum(name: string, step: number): Promise<void> {
    const fieldName = validateFieldName(name);

    if (typeof step !== 'number' || !Number.isFinite(step)) {
      throw new DataStreamApiError(
        'VALIDATION_ERROR',
        'Invalid step for stepNum - expected a finite number',
      );
    }

    const otp = this.resolveOtp();

    return await this.requestClient.get('/step-number', {
      otp,
      name: fieldName,
      value: step,
    });
  }

  async setBool(name: string, value: boolean): Promise<void> {
    const fieldName = validateFieldName(name);

    if (typeof value !== 'boolean') {
      throw new DataStreamApiError(
        'VALIDATION_ERROR',
        'Invalid value for setBool - expected a boolean',
      );
    }

    const otp = this.resolveOtp();

    return await this.requestClient.get('/set-boolean', {
      otp,
      name: fieldName,
      value,
    });
  }
}
