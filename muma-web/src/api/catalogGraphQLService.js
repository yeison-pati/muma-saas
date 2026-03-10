import { catalogGraphQL } from './graphqlClient';
import {
  QUERY_PRODUCTS,
  QUERY_PROJECTS,
  QUERY_PROJECTS_BY_SALES,
  QUERY_PROJECTS_BY_QUOTER,
  QUERY_PROJECTS_EFFECTIVE,
  MUTATION_CREATE_PROJECT,
  MUTATION_UPDATE_PROJECT,
  MUTATION_REOPEN_PROJECT,
  MUTATION_UPDATE_VARIANT_AND_REOPEN,
  MUTATION_MAKE_PROJECT_EFFECTIVE,
  MUTATION_QUOTE_VARIANT,
  MUTATION_UPDATE_VARIANT_QUOTE_QUANTITY,
  MUTATION_REMOVE_VARIANT_FROM_PROJECT,
  MUTATION_DELETE_PROJECT,
  MUTATION_CREATE_BASE,
  MUTATION_UPDATE_BASE,
  MUTATION_DELETE_BASE,
  MUTATION_ADD_VARIANT_TO_BASE,
  MUTATION_UPDATE_VARIANT,
  MUTATION_DELETE_VARIANT,
} from './catalogQueries';

export const createCatalogService = (getToken) => ({
  getProducts: () =>
    catalogGraphQL(QUERY_PRODUCTS, {}, getToken).then((d) => d?.products ?? []),

  getProjects: () =>
    catalogGraphQL(QUERY_PROJECTS, {}, getToken).then((d) => d?.projects ?? []),

  getProjectsBySales: (salesId) =>
    catalogGraphQL(QUERY_PROJECTS_BY_SALES, { salesId }, getToken).then(
      (d) => d?.projectsBySales ?? []
    ),

  getProjectsByQuoter: (quoterId) =>
    catalogGraphQL(QUERY_PROJECTS_BY_QUOTER, { quoterId }, getToken).then(
      (d) => d?.projectsByQuoter ?? []
    ),

  getProjectsEffective: () =>
    catalogGraphQL(QUERY_PROJECTS_EFFECTIVE, {}, getToken).then(
      (d) => d?.projectsEffective ?? []
    ),

  createProject: (input) =>
    catalogGraphQL(MUTATION_CREATE_PROJECT, { input }, getToken).then(
      (d) => d?.createProject
    ),

  updateProject: (input) =>
    catalogGraphQL(MUTATION_UPDATE_PROJECT, { input }, getToken).then(
      (d) => d?.updateProject
    ),

  reOpenProject: (projectId) =>
    catalogGraphQL(MUTATION_REOPEN_PROJECT, { projectId }, getToken).then(
      (d) => d?.reOpenProject
    ),

  updateVariantAndReopen: (input) =>
    catalogGraphQL(MUTATION_UPDATE_VARIANT_AND_REOPEN, { input }, getToken).then(
      (d) => d?.updateVariantAndReopen
    ),

  makeProjectEffective: (projectId) =>
    catalogGraphQL(MUTATION_MAKE_PROJECT_EFFECTIVE, { projectId }, getToken).then(
      (d) => d?.makeProjectEffective
    ),

  quoteVariant: (input) =>
    catalogGraphQL(MUTATION_QUOTE_VARIANT, { input }, getToken),

  updateVariantQuoteQuantity: (input) =>
    catalogGraphQL(MUTATION_UPDATE_VARIANT_QUOTE_QUANTITY, { input }, getToken),

  removeVariantFromProject: (projectId, variantId) =>
    catalogGraphQL(MUTATION_REMOVE_VARIANT_FROM_PROJECT, { projectId, variantId }, getToken),

  deleteProject: (projectId) =>
    catalogGraphQL(MUTATION_DELETE_PROJECT, { projectId }, getToken).then((d) => d?.deleteProject),

  createBase: (input) =>
    catalogGraphQL(MUTATION_CREATE_BASE, { input }, getToken).then(
      (d) => d?.createBase
    ),
  updateBase: (input) =>
    catalogGraphQL(MUTATION_UPDATE_BASE, { input }, getToken).then(
      (d) => d?.updateBase
    ),
  deleteBase: (baseId) =>
    catalogGraphQL(MUTATION_DELETE_BASE, { baseId }, getToken),
  addVariantToBase: (input) =>
    catalogGraphQL(MUTATION_ADD_VARIANT_TO_BASE, { input }, getToken).then(
      (d) => d?.addVariantToBase
    ),
  updateVariant: (input) =>
    catalogGraphQL(MUTATION_UPDATE_VARIANT, { input }, getToken).then(
      (d) => d?.updateVariant
    ),
  deleteVariant: (variantId) =>
    catalogGraphQL(MUTATION_DELETE_VARIANT, { variantId }, getToken),
});
