export const QUERY_PRODUCTS = `
  query Products {
    products {
      id
      code
      name
      image
      model
      category
      subcategory
      space
      line
      baseMaterial
      variants {
        id
        sapRef
        sapCode
        components {
          id
          sapRef
          sapCode
          name
          value
          originalValue
        }
      }
    }
  }
`;

export const QUERY_PROJECTS = `
  query Projects {
    projects {
      id
      consecutive
      name
      version
      client
      region
      salesId
      quoterId
      state
      quoted
      effective
      totalCost
      estimatedTime
      createdAt
      variants {
        id
        sapRef
        sapCode
        baseCode
        price
        elaborationTime
        quantity
        type
        criticalMaterial
        comments
        baseName
        baseImage
        category
        subcategory
        line
        space
        components {
          id
          sapRef
          sapCode
          name
          value
          originalValue
        }
      }
    }
  }
`;

export const QUERY_PROJECTS_BY_SALES = `
  query ProjectsBySales($salesId: ID!) {
    projectsBySales(salesId: $salesId) {
      id
      consecutive
      name
      version
      client
      region
      state
      quoted
      reopen
      effective
      totalCost
      estimatedTime
      createdAt
      variants {
        id
        sapRef
        sapCode
        baseCode
        price
        elaborationTime
        quantity
        type
        criticalMaterial
        comments
        baseName
        baseImage
        category
        subcategory
        line
        space
        components {
          id
          sapRef
          sapCode
          name
          value
          originalValue
        }
      }
    }
  }
`;

export const QUERY_PROJECTS_BY_QUOTER = `
  query ProjectsByQuoter($quoterId: ID!) {
    projectsByQuoter(quoterId: $quoterId) {
      id
      consecutive
      name
      version
      client
      region
      state
      quoted
      reopen
      effective
      totalCost
      estimatedTime
      createdAt
      variants {
        id
        sapRef
        sapCode
        baseCode
        price
        elaborationTime
        quantity
        type
        criticalMaterial
        comments
        baseName
        baseImage
        category
        subcategory
        line
        space
        components {
          id
          sapRef
          sapCode
          name
          value
          originalValue
        }
      }
    }
  }
`;

export const QUERY_PROJECTS_EFFECTIVE = `
  query ProjectsEffective {
    projectsEffective {
      id
      consecutive
      name
      version
      client
      region
      state
      quoted
      reopen
      effective
      totalCost
      estimatedTime
      createdAt
      variants {
        id
        sapRef
        sapCode
        baseCode
        price
        elaborationTime
        quantity
        type
        criticalMaterial
        comments
        baseName
        baseImage
        category
        subcategory
        line
        space
        components {
          id
          sapRef
          sapCode
          name
          value
          originalValue
        }
      }
    }
  }
`;

export const MUTATION_CREATE_PROJECT = `
  mutation CreateProject($input: CreateProjectInput!) {
    createProject(input: $input) {
      id
      consecutive
      name
    }
  }
`;

export const MUTATION_UPDATE_PROJECT = `
  mutation UpdateProject($input: UpdateProjectInput!) {
    updateProject(input: $input) {
      id
      consecutive
    }
  }
`;

export const MUTATION_REOPEN_PROJECT = `
  mutation ReOpenProject($projectId: ID!) {
    reOpenProject(projectId: $projectId)
  }
`;

export const MUTATION_UPDATE_VARIANT_AND_REOPEN = `
  mutation UpdateVariantAndReopen($input: UpdateVariantAndReopenInput!) {
    updateVariantAndReopen(input: $input)
  }
`;

export const MUTATION_MAKE_PROJECT_EFFECTIVE = `
  mutation MakeProjectEffective($projectId: ID!) {
    makeProjectEffective(projectId: $projectId)
  }
`;

export const MUTATION_QUOTE_VARIANT = `
  mutation QuoteVariant($input: QuoteVariantInput!) {
    quoteVariant(input: $input)
  }
`;

export const MUTATION_UPDATE_VARIANT_QUOTE_QUANTITY = `
  mutation UpdateVariantQuoteQuantity($input: UpdateVariantQuoteQuantityInput!) {
    updateVariantQuoteQuantity(input: $input)
  }
`;

export const MUTATION_REMOVE_VARIANT_FROM_PROJECT = `
  mutation RemoveVariantFromProject($projectId: ID!, $variantId: ID!) {
    removeVariantFromProject(projectId: $projectId, variantId: $variantId)
  }
`;

export const MUTATION_DELETE_PROJECT = `
  mutation DeleteProject($projectId: ID!) {
    deleteProject(projectId: $projectId)
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

export const MUTATION_ADD_VARIANT_TO_BASE = `
  mutation AddVariantToBase($input: AddVariantToBaseInput!) {
    addVariantToBase(input: $input) {
      id
      sapRef
      sapCode
      components {
        id
        sapRef
        sapCode
        name
        value
        originalValue
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
      components {
        id
        sapRef
        sapCode
        name
        value
        originalValue
      }
    }
  }
`;

export const MUTATION_DELETE_VARIANT = `
  mutation DeleteVariant($variantId: ID!) {
    deleteVariant(variantId: $variantId)
  }
`;
