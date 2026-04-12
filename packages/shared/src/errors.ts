/** Centralized error types with blame attribution for structured error handling. */

export type Blame = 'client' | 'server' | 'external';

export class AppError extends Error {
  readonly statusCode: number;
  readonly blame: Blame;
  readonly userMessage: string;

  constructor(message: string, options: { statusCode: number; blame: Blame; userMessage: string }) {
    super(message);
    this.name = 'AppError';
    this.statusCode = options.statusCode;
    this.blame = options.blame;
    this.userMessage = options.userMessage;
  }
}

export class ClientError extends AppError {
  constructor(message: string, options?: { statusCode?: number; userMessage?: string }) {
    super(message, {
      statusCode: options?.statusCode ?? 400,
      blame: 'client',
      userMessage:
        options?.userMessage ?? 'The request was invalid. Please check your input and try again.',
    });
    this.name = 'ClientError';
  }
}

export class ServerError extends AppError {
  constructor(message: string, options?: { statusCode?: number; userMessage?: string }) {
    super(message, {
      statusCode: options?.statusCode ?? 500,
      blame: 'server',
      userMessage:
        options?.userMessage ?? 'Something went wrong on our end. Please try again later.',
    });
    this.name = 'ServerError';
  }
}

export class ExternalServiceError extends AppError {
  constructor(message: string, options?: { statusCode?: number; userMessage?: string }) {
    super(message, {
      statusCode: options?.statusCode ?? 502,
      blame: 'external',
      userMessage:
        options?.userMessage ??
        'A third-party service is currently unavailable. Please try again later.',
    });
    this.name = 'ExternalServiceError';
  }
}

export interface ErrorResponseBody {
  error: {
    message: string;
    blame: Blame;
    statusCode: number;
  };
}
