/** Shared API response shapes used by both client and server. */

import type { Blame } from './errors';

export interface ApiResponse<T> {
  data: T;
  meta?: {
    page?: number;
    perPage?: number;
    total?: number;
  };
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    blame: Blame;
    statusCode: number;
  };
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}
