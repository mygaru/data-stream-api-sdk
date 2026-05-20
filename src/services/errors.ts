type DataStreamApiErrorCode =
  | 'CONFIGURATION_ERROR'
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'NOT_FOUND'
  | 'METHOD_NOT_ALLOWED'
  | 'RATE_LIMIT_ERROR'
  | 'SERVER_ERROR'
  | 'HTTP_ERROR'
  | 'TIMEOUT_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

export class DataStreamApiError extends Error {
  constructor(
    public readonly code: DataStreamApiErrorCode,
    message: string,
  ) {
    super(`[${code}] - ${message}`);

    this.name = 'DataStreamApiError';
  }
}
