import { ENDPOINTS } from './config';

async function graphqlFetch(url, query, variables = {}, token) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({ query, variables }),
    credentials: 'include',
  });

  const json = await res.json().catch(() => ({}));

  if (json.errors?.length) {
    const msg = json.errors[0]?.message || 'Error GraphQL';
    throw new Error(msg);
  }

  if (!res.ok) {
    throw new Error(json.message || `HTTP ${res.status}`);
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
