import { threadsGraphQL } from './graphqlClient';
import {
  QUERY_THREADS_BY_PROJECT,
  QUERY_THREAD_MESSAGES,
  MUTATION_OPEN_THREAD,
  MUTATION_CLOSE_THREAD,
  MUTATION_ADD_THREAD_MESSAGE,
} from './threadsQueries';

export const createThreadsService = (getToken) => ({
  getThreadsByProject: (projectId, limit, offset) =>
    threadsGraphQL(QUERY_THREADS_BY_PROJECT, { projectId, limit, offset }, getToken).then(
      (d) => d?.threadsByProject?.items ?? []
    ),

  getThreadMessages: (threadId, limit, offset) =>
    threadsGraphQL(QUERY_THREAD_MESSAGES, { threadId, limit, offset }, getToken).then(
      (d) => d?.threadMessages?.items ?? []
    ),

  openThread: (projectId, variantId, type, openedBy) =>
    threadsGraphQL(MUTATION_OPEN_THREAD, { projectId, variantId, type, openedBy }, getToken).then(
      (d) => d?.openThread
    ),

  closeThread: (threadId, closedBy) =>
    threadsGraphQL(MUTATION_CLOSE_THREAD, { threadId, closedBy }, getToken).then(
      (d) => d?.closeThread
    ),

  addThreadMessage: (threadId, userId, content) =>
    threadsGraphQL(MUTATION_ADD_THREAD_MESSAGE, { threadId, userId, content }, getToken).then(
      (d) => d?.addThreadMessage
    ),
});
