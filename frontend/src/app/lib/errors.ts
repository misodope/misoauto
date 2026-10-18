/**
 * Extracts API error messages from an Axios error. The backend sends
 * `message` as a string, or as a string[] for validation errors.
 */
export const getErrorMessages = (
  error: unknown,
  fallback: string,
): string[] => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof error.response === 'object' &&
    error.response !== null &&
    'data' in error.response &&
    typeof error.response.data === 'object' &&
    error.response.data !== null &&
    'message' in error.response.data
  ) {
    const { message } = error.response.data;
    if (typeof message === 'string') return [message];
    if (
      Array.isArray(message) &&
      message.length > 0 &&
      message.every((item) => typeof item === 'string')
    ) {
      return message;
    }
  }

  return [error instanceof Error ? error.message : fallback];
};

export const getErrorMessage = (error: unknown, fallback: string): string =>
  getErrorMessages(error, fallback).join(' ');
