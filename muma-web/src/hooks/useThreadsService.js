import { useMemo } from 'react';
import { useUser } from '../context/UserContext';
import { createThreadsService } from '../api/threadsGraphQLService';

export function useThreadsService() {
  const { getToken } = useUser();
  return useMemo(() => createThreadsService(getToken), [getToken]);
}
