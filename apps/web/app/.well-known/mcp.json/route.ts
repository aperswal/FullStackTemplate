export function GET(): Response {
  return Response.json({
    mcpServers: [
      {
        url: '/api/mcp',
        name: 'FullStack Template',
        description:
          'A production-ready full-stack template with authentication, payments, email, and more.',
        authentication: { type: 'optional', method: 'session' },
      },
    ],
  });
}
