const API_BASE = import.meta.env.VITE_API_BASE || '';

export const ENDPOINTS = {
  catalog: API_BASE ? `${API_BASE}/api/catalog/graphql` : '/api/catalog/graphql',
  identity: API_BASE ? `${API_BASE}/api/identity/graphql` : '/api/identity/graphql',
  document: API_BASE ? `${API_BASE}/api/document` : '/api/document',
  products: API_BASE ? `${API_BASE}/api/products/graphql` : '/api/products/graphql',
};
