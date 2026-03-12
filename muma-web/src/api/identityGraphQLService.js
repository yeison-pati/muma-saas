import { identityGraphQL } from './graphqlClient';
import {
  MUTATION_SIGN_IN,
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
  getQuoters: () =>
    identityGraphQL(QUERY_QUOTERS, {}, getToken).then((d) => d?.quoters ?? []),
  getSales: () =>
    identityGraphQL(QUERY_SALES, {}, getToken).then((d) => d?.sales ?? []),
  getDesigners: () =>
    identityGraphQL(QUERY_DESIGNERS, {}, getToken).then(
      (d) => d?.designers ?? []
    ),
  getDevelopers: () =>
    identityGraphQL(QUERY_DEVELOPERS, {}, getToken).then(
      (d) => d?.developers ?? []
    ),
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
