import { identityGraphQL } from './graphqlClient';
import {
  MUTATION_SIGN_IN,
  QUERY_USERS_BY_IDS,
  QUERY_QUOTERS,
  QUERY_SALES,
  QUERY_DESIGNERS,
  QUERY_DEVELOPERS,
  MUTATION_CREATE_USER,
  MUTATION_DELETE_USER,
  MUTATION_EDIT_USER,
} from './identityQueries';

export const createIdentityService = (getToken) => ({
  auth: {
    signIn: (input) =>
      identityGraphQL(MUTATION_SIGN_IN, { input }, getToken).then((d) => ({
        data: d.signIn,
      })),
  },
  getUsersByIds: (userIds) =>
    identityGraphQL(QUERY_USERS_BY_IDS, { userIds }, getToken).then((d) => d?.usersByIds ?? []),
  getQuoters: (limit, offset) =>
    identityGraphQL(QUERY_QUOTERS, { limit, offset }, getToken).then((d) => d?.quoters?.items ?? []),
  getSales: (limit, offset) =>
    identityGraphQL(QUERY_SALES, { limit, offset }, getToken).then((d) => d?.sales?.items ?? []),
  getDesigners: (limit, offset) =>
    identityGraphQL(QUERY_DESIGNERS, { limit, offset }, getToken).then((d) => d?.designers?.items ?? []),
  getDevelopers: (limit, offset) =>
    identityGraphQL(QUERY_DEVELOPERS, { limit, offset }, getToken).then((d) => d?.developers?.items ?? []),
  createUser: (input) =>
    identityGraphQL(MUTATION_CREATE_USER, { input }, getToken),
  deleteUser: (userId) =>
    identityGraphQL(MUTATION_DELETE_USER, { userId }, getToken),
  editUser: (userId, input) =>
    identityGraphQL(MUTATION_EDIT_USER, { userId, input }, getToken),
});

// Default instance using localStorage token (for use outside React)
const getStoredToken = () => localStorage.getItem('token');
export const identityGraphQLService = createIdentityService(getStoredToken);
