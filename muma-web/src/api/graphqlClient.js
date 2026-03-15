import { ENDPOINTS } from './config';
import { getTraceId, TRACE_ID_HEADER } from './traceId';

export { resetTraceId } from './traceId';

function getOperationName(query) {
  const match = query.match(/(?:query|mutation)\s+(\w+)/);
  return match ? match[1] : 'unknown';
}

async function graphqlFetch(url, query, variables = {}, token) {
  const op = getOperationName(query);
  const traceId = getTraceId();
  console.log('[graphqlFetch] REQ', op, 'traceId=', traceId, 'url=', url, 'variables=', Object.keys(variables));
  const body = JSON.stringify({ query, variables });
  if (op.includes('CreateProject') || op.includes('createProject')) {
    console.log('[graphqlFetch] CreateProject variables.input.variants=', variables?.input?.variants?.length, variables?.input?.variants);
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      [TRACE_ID_HEADER]: traceId,
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body,
    credentials: 'include',
  });

  const json = await res.json().catch((e) => {
    console.log('[graphqlFetch] RES parse error', op, e);
    return {};
  });

  if (json.errors?.length) {
    const serverTraceId = res.headers.get(TRACE_ID_HEADER);
    const err0 = json.errors[0];
    const msg = err0?.message || 'Error GraphQL';
    console.error('[graphqlFetch] RES errors', op, 'traceId=', traceId, 'serverTraceId=', serverTraceId, 'message=', msg, 'path=', err0?.path, 'extensions=', err0?.extensions);
    if (json.errors.length > 1) console.error('[graphqlFetch] más errores:', json.errors.slice(1));
    const err = new Error(msg);
    err.traceId = serverTraceId || traceId;
    throw err;
  }

  if (!res.ok) {
    const serverTraceId = res.headers.get(TRACE_ID_HEADER);
    console.log('[graphqlFetch] RES !ok', op, 'traceId=', serverTraceId || traceId, 'status=', res.status, json);
    const err = new Error(json.message || `HTTP ${res.status}`);
    err.traceId = serverTraceId || traceId;
    throw err;
  }

  const dataKeys = json.data ? Object.keys(json.data) : [];
  console.log('[graphqlFetch] RES ok', op, 'dataKeys=', dataKeys);
  if (op.includes('CreateProject') && json.data?.createProject) {
    console.log('[graphqlFetch] CreateProject response', json.data.createProject);
  }
  return json.data;
}

export async function catalogGraphQL(query, variables = {}, getToken) {
  const token = getToken ? getToken() : null;
  return graphqlFetch(ENDPOINTS.catalog, query, variables, token);
}

export async function identityGraphQL(query, variables = {}, getToken) {
  const token = getToken ? getToken() : null;
  return graphqlFetch(ENDPOINTS.identity, query, variables, token);
}

export async function productsGraphQL(query, variables = {}, getToken) {
  const token = getToken ? getToken() : null;
  return graphqlFetch(ENDPOINTS.products, query, variables, token);
}

export async function threadsGraphQL(query, variables = {}, getToken) {
  const token = getToken ? getToken() : null;
  return graphqlFetch(ENDPOINTS.threads, query, variables, token);
}
