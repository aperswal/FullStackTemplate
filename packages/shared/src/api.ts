/** Shared API response shapes used by both client and server. */

import type { ErrorResponseBody } from './errors';

export interface ApiResponse<T> {
  data: T;
  meta?: {
    page?: number;
    perPage?: number;
    total?: number;
  };
}

/** @deprecated Use ErrorResponseBody from './errors' instead. */
export type ApiError = ErrorResponseBody;

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}
