import { useMemo } from 'react';
import { useUser } from '../context/UserContext';
import { createIdentityService } from '../api/identityGraphQLService';

export function useIdentityService() {
  const { getToken } = useUser();
  return useMemo(() => createIdentityService(getToken), [getToken]);
}
