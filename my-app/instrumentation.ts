import type { Instrumentation } from 'next';

// Count server failures without recording chat text, invite IDs, headers or tokens.
// Retention and alert delivery are configured in the selected hosting service.
export const onRequestError: Instrumentation.onRequestError = (error, request, context) => {
  const candidate = typeof error === 'object' && error !== null && 'digest' in error
    ? String(error.digest) : '';
  console.error(JSON.stringify({
    event: 'wyd_server_error',
    digest: /^[a-fA-F0-9-]{1,64}$/.test(candidate) ? candidate : 'unavailable',
    method: /^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)$/.test(request.method) ? request.method : 'other',
    kind: ['render', 'route', 'action', 'proxy'].includes(context.routeType) ? context.routeType : 'other',
  }));
};
