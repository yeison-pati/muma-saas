import { useMemo } from 'react';
import { useUser } from '../context/UserContext';
import { createCatalogService } from '../api/catalogGraphQLService';

export function useCatalogService() {
  const { getToken } = useUser();
  return useMemo(() => createCatalogService(getToken), [getToken]);
}
