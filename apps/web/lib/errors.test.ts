import { describe, it, expect } from 'vitest';

import {
  AppError,
  ClientError,
  ServerError,
  ExternalServiceError,
  createErrorResponse,
} from './errors';

describe('AppError', () => {
  it('sets message, statusCode, blame, and userMessage', () => {
    const error = new AppError('db failed', {
      statusCode: 503,
      blame: 'server',
      userMessage: 'Try again later.',
    });
    expect(error.message).toBe('db failed');
    expect(error.statusCode).toBe(503);
    expect(error.blame).toBe('server');
    expect(error.userMessage).toBe('Try again later.');
  });

  it('is an instance of Error', () => {
    const error = new AppError('fail', {
      statusCode: 500,
      blame: 'server',
      userMessage: 'Oops',
    });
    expect(error).toBeInstanceOf(Error);
  });

  it('has name "AppError"', () => {
    const error = new AppError('fail', {
      statusCode: 500,
      blame: 'server',
      userMessage: 'Oops',
    });
    expect(error.name).toBe('AppError');
  });
});

describe('ClientError', () => {
  it('defaults to statusCode 400 and blame "client"', () => {
    const error = new ClientError('bad input');
    expect(error.statusCode).toBe(400);
    expect(error.blame).toBe('client');
  });

  it('has a default userMessage about invalid request', () => {
    const error = new ClientError('bad input');
    expect(error.userMessage).toBe(
      'The request was invalid. Please check your input and try again.',
    );
  });

  it('allows overriding statusCode', () => {
    const error = new ClientError('not found', { statusCode: 404 });
    expect(error.statusCode).toBe(404);
  });

  it('allows overriding userMessage', () => {
    const error = new ClientError('bad input', {
      userMessage: 'Check your email.',
    });
    expect(error.userMessage).toBe('Check your email.');
  });

  it('has name "ClientError"', () => {
    const error = new ClientError('bad input');
    expect(error.name).toBe('ClientError');
  });

  it('is an instance of AppError', () => {
    const error = new ClientError('bad input');
    expect(error).toBeInstanceOf(AppError);
  });
});

describe('ServerError', () => {
  it('defaults to statusCode 500 and blame "server"', () => {
    const error = new ServerError('crash');
    expect(error.statusCode).toBe(500);
    expect(error.blame).toBe('server');
  });

  it('has a default userMessage about something going wrong', () => {
    const error = new ServerError('crash');
    expect(error.userMessage).toBe('Something went wrong on our end. Please try again later.');
  });

  it('allows overriding statusCode and userMessage', () => {
    const error = new ServerError('crash', {
      statusCode: 503,
      userMessage: 'Maintenance in progress.',
    });
    expect(error.statusCode).toBe(503);
    expect(error.userMessage).toBe('Maintenance in progress.');
  });

  it('has name "ServerError"', () => {
    const error = new ServerError('crash');
    expect(error.name).toBe('ServerError');
  });
});

describe('ExternalServiceError', () => {
  it('defaults to statusCode 502 and blame "external"', () => {
    const error = new ExternalServiceError('stripe down');
    expect(error.statusCode).toBe(502);
    expect(error.blame).toBe('external');
  });

  it('has a default userMessage about third-party service', () => {
    const error = new ExternalServiceError('stripe down');
    expect(error.userMessage).toBe(
      'A third-party service is currently unavailable. Please try again later.',
    );
  });

  it('has name "ExternalServiceError"', () => {
    const error = new ExternalServiceError('stripe down');
    expect(error.name).toBe('ExternalServiceError');
  });
});

describe('createErrorResponse', () => {
  it('returns correct status and body for ClientError', async () => {
    const error = new ClientError('bad input');
    const response = createErrorResponse(error);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.message).toBe(
      'The request was invalid. Please check your input and try again.',
    );
    expect(body.error.blame).toBe('client');
    expect(body.error.statusCode).toBe(400);
  });

  it('returns correct status and body for ServerError', async () => {
    const error = new ServerError('crash');
    const response = createErrorResponse(error);
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error.blame).toBe('server');
    expect(body.error.statusCode).toBe(500);
  });

  it('returns correct status and body for ExternalServiceError', async () => {
    const error = new ExternalServiceError('stripe down');
    const response = createErrorResponse(error);
    expect(response.status).toBe(502);
    const body = await response.json();
    expect(body.error.blame).toBe('external');
    expect(body.error.statusCode).toBe(502);
  });

  it('returns 500 with generic message for unknown error', async () => {
    const response = createErrorResponse(new Error('random'));
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error.message).toBe('An unexpected error occurred. Please try again later.');
    expect(body.error.blame).toBe('server');
    expect(body.error.statusCode).toBe(500);
  });

  it('returns 500 with generic message for plain string error', async () => {
    const response = createErrorResponse('something broke');
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error.blame).toBe('server');
  });
});
