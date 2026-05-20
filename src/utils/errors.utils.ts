import { DataStreamApiError } from '../services/errors';

export const handleAPIError = (response: Response): never => {
  const message = response.statusText || 'Unknown API error';

  if (response.status >= 500) {
    throw new DataStreamApiError('SERVER_ERROR', message);
  }

  switch (response.status) {
    case 400:
      throw new DataStreamApiError('VALIDATION_ERROR', message);

    case 401:
    case 403:
      throw new DataStreamApiError('AUTHENTICATION_ERROR', message);

    case 404:
      throw new DataStreamApiError('NOT_FOUND', message);

    case 405:
      throw new DataStreamApiError('METHOD_NOT_ALLOWED', message);

    case 429:
      throw new DataStreamApiError('RATE_LIMIT_ERROR', message);

    default:
      throw new DataStreamApiError('HTTP_ERROR', message);
  }
};

export const handleNetworkError = (error: Error): never => {
  const originalMessage = error.message || 'Unknown network error';
  const normalizedMessage = originalMessage.toLowerCase();

  if (error.name === 'AbortError' || normalizedMessage.includes('timeout')) {
    throw new DataStreamApiError('TIMEOUT_ERROR', originalMessage);
  }

  if (normalizedMessage.includes('fetch') || normalizedMessage.includes('network')) {
    throw new DataStreamApiError('NETWORK_ERROR', originalMessage);
  }

  throw new DataStreamApiError('UNKNOWN_ERROR', originalMessage);
};
