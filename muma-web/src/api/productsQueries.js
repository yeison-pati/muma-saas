export const QUERY_PRODUCTS = `
  query Products {
    products {
      id
      code
      name
      category
      subcategory
      space
      line
      baseMaterial
      variants {
        id
        sapRef
        sapCode
        image
        model
        components {
          id
          sapRef
          sapCode
          name
          value
          originalValue
          catalogOriginalValue
        }
      }
    }
  }
`;

export const MUTATION_CREATE_BASE = `
  mutation CreateBase($input: CreateBaseInput!) {
    createBase(input: $input) {
      id
      code
      name
    }
  }
`;

export const MUTATION_UPDATE_BASE = `
  mutation UpdateBase($input: UpdateBaseInput!) {
    updateBase(input: $input) {
      id
      code
      name
    }
  }
`;

export const MUTATION_DELETE_BASE = `
  mutation DeleteBase($baseId: ID!) {
    deleteBase(baseId: $baseId)
  }
`;

export const MUTATION_CREATE_VARIANT = `
  mutation CreateVariant($input: CreateVariantInput!) {
    createVariant(input: $input) {
      id
      sapRef
      sapCode
      image
      model
      components {
        id
        sapRef
        sapCode
        name
        value
        originalValue
        catalogOriginalValue
      }
    }
  }
`;

export const MUTATION_UPDATE_VARIANT = `
  mutation UpdateVariant($input: UpdateVariantInput!) {
    updateVariant(input: $input) {
      id
      sapRef
      sapCode
      image
      model
      components {
        id
        sapRef
        sapCode
        name
        value
        originalValue
        catalogOriginalValue
      }
    }
  }
`;

export const MUTATION_DELETE_VARIANT = `
  mutation DeleteVariant($variantId: ID!) {
    deleteVariant(variantId: $variantId)
  }
`;
