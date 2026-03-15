import { catalogGraphQL } from './graphqlClient';
import {
  QUERY_PROJECTS,
  QUERY_PROJECTS_BY_SALES,
  QUERY_PROJECTS_BY_QUOTER,
  QUERY_PROJECTS_EFFECTIVE,
  QUERY_PROJECTS_FOR_ASSIGNMENT,
  QUERY_PROJECTS_BY_ASSIGNED_QUOTER,
  QUERY_PROJECTS_BY_ASSIGNED_DESIGNER,
  QUERY_PROJECTS_BY_ASSIGNED_DEVELOPMENT,
  MUTATION_CREATE_PROJECT,
  MUTATION_UPDATE_PROJECT,
  MUTATION_REOPEN_PROJECT,
  MUTATION_UPDATE_VARIANT_AND_REOPEN,
  MUTATION_MAKE_PROJECT_EFFECTIVE,
  MUTATION_QUITAR_PROJECT_EFFECTIVE,
  MUTATION_MAKE_VARIANT_QUOTE_EFFECTIVE,
  MUTATION_ASSIGN_VARIANT_TO_USER,
  MUTATION_TOGGLE_P3_P5,
  MUTATION_MARK_VARIANT_AS_DESIGNED,
  MUTATION_MARK_VARIANT_AS_DEVELOPED,
  MUTATION_QUOTE_VARIANT,
  MUTATION_UPDATE_VARIANT_QUOTE_QUANTITY,
  MUTATION_REMOVE_VARIANT_FROM_PROJECT,
  MUTATION_DELETE_PROJECT,
} from './catalogQueries';

export const createCatalogService = (getToken) => ({
  getProjects: () =>
    catalogGraphQL(QUERY_PROJECTS, {}, getToken).then((d) => d?.projects ?? []),

  getProjectsBySales: (salesId) =>
    catalogGraphQL(QUERY_PROJECTS_BY_SALES, { salesId }, getToken).then((d) => {
      const projects = d?.projectsBySales ?? [];
      projects.forEach((p, i) => {
        console.log('[catalog.getProjectsBySales] project', i, 'id=', p?.id, 'variants=', p?.variants?.length, p?.variants);
      });
      return projects;
    }),

  getProjectsByQuoter: (quoterId) =>
    catalogGraphQL(QUERY_PROJECTS_BY_QUOTER, { quoterId }, getToken).then(
      (d) => d?.projectsByQuoter ?? []
    ),

  getProjectsByAssignedQuoter: (quoterId) =>
    catalogGraphQL(QUERY_PROJECTS_BY_ASSIGNED_QUOTER, { quoterId }, getToken).then(
      (d) => d?.projectsByAssignedQuoter ?? []
    ),

  getProjectsByAssignedDesigner: (designerId) =>
    catalogGraphQL(QUERY_PROJECTS_BY_ASSIGNED_DESIGNER, { designerId }, getToken).then(
      (d) => d?.projectsByAssignedDesigner ?? []
    ),

  getProjectsByAssignedDevelopment: (userId) =>
    catalogGraphQL(QUERY_PROJECTS_BY_ASSIGNED_DEVELOPMENT, { userId }, getToken).then(
      (d) => d?.projectsByAssignedDevelopment ?? []
    ),

  getProjectsForAssignment: (role) =>
    catalogGraphQL(QUERY_PROJECTS_FOR_ASSIGNMENT, { role: role || null }, getToken).then(
      (d) => d?.projectsForAssignment ?? []
    ),

  getProjectsEffective: () =>
    catalogGraphQL(QUERY_PROJECTS_EFFECTIVE, {}, getToken).then(
      (d) => d?.projectsEffective ?? []
    ),

  createProject: (input) => {
    console.log('[catalog.createProject] llamando input.variants=', input?.variants?.length);
    return catalogGraphQL(MUTATION_CREATE_PROJECT, { input }, getToken).then((d) => {
      const result = d?.createProject;
      console.log('[catalog.createProject] respuesta', result ? { id: result.id, consecutive: result.consecutive } : result);
      return result;
    });
  },

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

  quitarProjectEffective: (projectId) =>
    catalogGraphQL(MUTATION_QUITAR_PROJECT_EFFECTIVE, { projectId }, getToken).then(
      (d) => d?.quitarProjectEffective
    ),

  assignVariantToUser: (projectId, variantId, assigneeId, roleType) =>
    catalogGraphQL(MUTATION_ASSIGN_VARIANT_TO_USER, { projectId, variantId, assigneeId, roleType }, getToken).then(
      (d) => d?.assignVariantToUser
    ),

  makeVariantQuoteEffective: (projectId, variantId, effective) =>
    catalogGraphQL(MUTATION_MAKE_VARIANT_QUOTE_EFFECTIVE, { projectId, variantId, effective }, getToken).then(
      (d) => d?.makeVariantQuoteEffective
    ),

  toggleP3P5: (projectId, variantId) =>
    catalogGraphQL(MUTATION_TOGGLE_P3_P5, { projectId, variantId }, getToken).then(
      (d) => d?.toggleP3P5
    ),

  markVariantAsDesigned: (projectId, variantId, designerId) =>
    catalogGraphQL(MUTATION_MARK_VARIANT_AS_DESIGNED, { projectId, variantId, designerId }, getToken).then(
      (d) => d?.markVariantAsDesigned
    ),

  markVariantAsDeveloped: (projectId, variantId, developmentUserId) =>
    catalogGraphQL(MUTATION_MARK_VARIANT_AS_DEVELOPED, { projectId, variantId, developmentUserId }, getToken).then(
      (d) => d?.markVariantAsDeveloped
    ),

  quoteVariant: (input) =>
    catalogGraphQL(MUTATION_QUOTE_VARIANT, { input }, getToken),

  updateVariantQuoteQuantity: (input) =>
    catalogGraphQL(MUTATION_UPDATE_VARIANT_QUOTE_QUANTITY, { input }, getToken),

  removeVariantFromProject: (projectId, variantId) =>
    catalogGraphQL(MUTATION_REMOVE_VARIANT_FROM_PROJECT, { projectId, variantId }, getToken),

  deleteProject: (projectId) =>
    catalogGraphQL(MUTATION_DELETE_PROJECT, { projectId }, getToken).then((d) => d?.deleteProject),
});
