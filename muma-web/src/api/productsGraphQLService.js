import { productsGraphQL } from './graphqlClient';
import {
  QUERY_PRODUCTS,
  MUTATION_CREATE_BASE,
  MUTATION_UPDATE_BASE,
  MUTATION_DELETE_BASE,
  MUTATION_CREATE_VARIANT,
  MUTATION_UPDATE_VARIANT,
  MUTATION_DELETE_VARIANT,
} from './productsQueries';

export const createProductsService = (getToken) => ({
  getProducts: () =>
    productsGraphQL(QUERY_PRODUCTS, {}, getToken).then((d) => d?.products ?? []),

  createBase: (input) =>
    productsGraphQL(MUTATION_CREATE_BASE, { input }, getToken).then(
      (d) => d?.createBase
    ),

  updateBase: (input) =>
    productsGraphQL(MUTATION_UPDATE_BASE, { input }, getToken).then(
      (d) => d?.updateBase
    ),

  deleteBase: (baseId) =>
    productsGraphQL(MUTATION_DELETE_BASE, { baseId }, getToken),

  /** baseId = UUID de la base (product.id). Products usa baseId, no baseCode. */
  addVariantToBase: (input) =>
    productsGraphQL(MUTATION_CREATE_VARIANT, { input }, getToken).then(
      (d) => d?.createVariant
    ),

  updateVariant: (input) =>
    productsGraphQL(MUTATION_UPDATE_VARIANT, { input }, getToken).then(
      (d) => d?.updateVariant
    ),

  deleteVariant: (variantId) =>
    productsGraphQL(MUTATION_DELETE_VARIANT, { variantId }, getToken),
});
