export const QUERY_THREADS_BY_PROJECT = `
  query ThreadsByProject($projectId: ID!, $limit: Int, $offset: Int) {
    threadsByProject(projectId: $projectId, limit: $limit, offset: $offset) {
      items {
        id
        projectId
        variantId
        type
        openedAt
        closedAt
        openedBy
        closedBy
      }
      pageInfo { total limit offset }
    }
  }
`;

export const QUERY_THREAD_MESSAGES = `
  query ThreadMessages($threadId: ID!, $limit: Int, $offset: Int) {
    threadMessages(threadId: $threadId, limit: $limit, offset: $offset) {
      items {
        id
        threadId
        userId
        content
        createdAt
      }
      pageInfo { total limit offset }
    }
  }
`;

export const MUTATION_OPEN_THREAD = `
  mutation OpenThread($projectId: ID!, $variantId: ID, $type: String!, $openedBy: ID!) {
    openThread(projectId: $projectId, variantId: $variantId, type: $type, openedBy: $openedBy) {
      id
      projectId
      variantId
      type
      openedAt
      closedAt
      openedBy
      closedBy
    }
  }
`;

export const MUTATION_CLOSE_THREAD = `
  mutation CloseThread($threadId: ID!, $closedBy: ID!) {
    closeThread(threadId: $threadId, closedBy: $closedBy) {
      id
      projectId
      variantId
      type
      openedAt
      closedAt
      openedBy
      closedBy
    }
  }
`;

export const MUTATION_ADD_THREAD_MESSAGE = `
  mutation AddThreadMessage($threadId: ID!, $userId: ID!, $content: String!) {
    addThreadMessage(threadId: $threadId, userId: $userId, content: $content) {
      id
      threadId
      userId
      content
      createdAt
    }
  }
`;
