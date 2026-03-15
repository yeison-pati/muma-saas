import { useMemo } from 'react';
import { useUser } from '../context/UserContext';
import { createProductsService } from '../api/productsGraphQLService';

export function useProductsService() {
  const { getToken } = useUser();
  return useMemo(() => createProductsService(getToken), [getToken]);
}
