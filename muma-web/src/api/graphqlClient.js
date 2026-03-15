import { ENDPOINTS } from './config';

function getOperationName(query) {
  const match = query.match(/(?:query|mutation)\s+(\w+)/);
  return match ? match[1] : 'unknown';
}

async function graphqlFetch(url, query, variables = {}, token) {
  const op = getOperationName(query);
  console.log('[graphqlFetch] REQ', op, 'url=', url, 'variables=', Object.keys(variables));
  const body = JSON.stringify({ query, variables });
  if (op.includes('CreateProject') || op.includes('createProject')) {
    console.log('[graphqlFetch] CreateProject variables.input.variants=', variables?.input?.variants?.length, variables?.input?.variants);
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
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
    console.log('[graphqlFetch] RES errors', op, json.errors);
    const msg = json.errors[0]?.message || 'Error GraphQL';
    throw new Error(msg);
  }

  if (!res.ok) {
    console.log('[graphqlFetch] RES !ok', op, 'status=', res.status, json);
    throw new Error(json.message || `HTTP ${res.status}`);
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
