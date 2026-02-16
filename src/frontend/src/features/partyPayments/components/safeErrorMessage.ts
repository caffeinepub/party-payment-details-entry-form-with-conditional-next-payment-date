/**
 * Derives a safe, human-readable error message from an unknown error object.
 * Redacts sensitive information like tokens, delegations, and identity strings.
 */
export function safeErrorMessage(error: unknown): string {
  if (!error) {
    return 'An unknown error occurred. Please try again.';
  }

  let message = '';

  // Extract message from various error types
  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  } else if (typeof error === 'object' && 'message' in error) {
    message = String((error as { message: unknown }).message);
  } else {
    message = String(error);
  }

  // Fallback if message is empty
  if (!message || message.trim() === '') {
    return 'An error occurred while connecting to the service. Please try again.';
  }

  // Redact sensitive patterns
  const sensitivePatterns = [
    /delegation/gi,
    /identity/gi,
    /token/gi,
    /principal/gi,
    /[a-z0-9]{20,}/gi, // Long alphanumeric strings (potential tokens)
  ];

  let sanitized = message;
  for (const pattern of sensitivePatterns) {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  }

  // Limit length
  const maxLength = 200;
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength) + '...';
  }

  // Provide user-friendly fallback for common patterns
  if (sanitized.toLowerCase().includes('fetch') || sanitized.toLowerCase().includes('network')) {
    return 'Network error: Unable to connect to the service. Please check your connection and try again.';
  }

  if (sanitized.toLowerCase().includes('timeout')) {
    return 'Request timed out. Please try again.';
  }

  return sanitized || 'An unexpected error occurred. Please try again.';
}
