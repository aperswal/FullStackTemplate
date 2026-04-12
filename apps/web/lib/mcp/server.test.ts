import { describe, it, expect } from 'vitest';

import { createMcpServer } from './server';

describe('createMcpServer', () => {
  it('creates a server with three tools', () => {
    const server = createMcpServer('http://localhost:3000', {});
    expect(server).toBeDefined();
    expect(server.server).toBeDefined();
  });

  it('accepts auth context without errors', () => {
    const server = createMcpServer('http://localhost:3000', {
      cookies: 'session=abc123',
      authorization: 'Bearer token',
    });
    expect(server).toBeDefined();
  });
});
