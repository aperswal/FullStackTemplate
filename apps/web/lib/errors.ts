import { NextResponse } from 'next/server';
import { AppError } from '@template/shared';
import type { ErrorResponseBody } from '@template/shared';

// Re-export error classes so existing consumers don't need to change their import paths.
// The canonical definitions live in @template/shared.
export { AppError, ClientError, ServerError, ExternalServiceError } from '@template/shared';
export type { Blame, ErrorResponseBody } from '@template/shared';

export function createErrorResponse(error: unknown): NextResponse<ErrorResponseBody> {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: {
          code: error.name,
          message: error.userMessage,
          blame: error.blame,
          statusCode: error.statusCode,
        },
      },
      { status: error.statusCode },
    );
  }

  return NextResponse.json(
    {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred. Please try again later.',
        blame: 'server' as const,
        statusCode: 500,
      },
    },
    { status: 500 },
  );
}
