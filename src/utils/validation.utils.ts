import { DataStreamApiError } from '../services/errors';

const FIELD_NAME_PATTERN = /^[A-Za-z ]+$/;

export const normalizeBaseUrl = (url: string): string => {
  const baseUrl = url.trim();

  if (baseUrl === '') {
    throw new DataStreamApiError('CONFIGURATION_ERROR', 'Provide a non-empty baseUrl');
  }

  return baseUrl.replace(/\/+$/, '');
};

export const validateOtp = (value: string): boolean => {
  if (typeof value !== 'string') {
    throw new DataStreamApiError('VALIDATION_ERROR', 'Pass a non-empty otp value');
  }

  const trimmed = value.trim();
  if (trimmed === '') {
    throw new DataStreamApiError('VALIDATION_ERROR', 'Pass a non-empty otp value');
  }

  return !!trimmed.length;
};

export const validateFieldName = (name: string): string => {
  const trimmed = typeof name === 'string' ? name.trim() : '';

  if (trimmed === '' || !FIELD_NAME_PATTERN.test(trimmed)) {
    throw new DataStreamApiError(
      'VALIDATION_ERROR',
      'Field name must be a non-empty string containing only Latin characters and spaces',
    );
  }

  return trimmed;
};
