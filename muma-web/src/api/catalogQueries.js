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
          catalogOriginalValue
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
        effective
        criticalMaterial
        comments
        baseName
        baseImage
        category
        subcategory
        line
        space
        assignedQuoterId
        assignedDesignerId
        assignedDevelopmentUserId
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
        effective
        criticalMaterial
        comments
        baseName
        baseImage
        category
        subcategory
        line
        space
        assignedQuoterId
        assignedDesignerId
        assignedDevelopmentUserId
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
        effective
        criticalMaterial
        comments
        baseName
        baseImage
        category
        subcategory
        line
        space
        assignedQuoterId
        assignedDesignerId
        assignedDevelopmentUserId
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

export const QUERY_PROJECTS_BY_ASSIGNED_QUOTER = `
  query ProjectsByAssignedQuoter($quoterId: ID!) {
    projectsByAssignedQuoter(quoterId: $quoterId) {
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
        effective
        quotedAt
        designedAt
        developedAt
        criticalMaterial
        comments
        baseName
        baseImage
        category
        subcategory
        line
        space
        assignedQuoterId
        assignedDesignerId
        assignedDevelopmentUserId
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

export const QUERY_PROJECTS_BY_ASSIGNED_DESIGNER = `
  query ProjectsByAssignedDesigner($designerId: ID!) {
    projectsByAssignedDesigner(designerId: $designerId) {
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
      requestedAt
      variants {
        id
        sapRef
        sapCode
        baseCode
        price
        elaborationTime
        quantity
        type
        effective
        quotedAt
        designedAt
        developedAt
        criticalMaterial
        comments
        baseName
        baseImage
        category
        subcategory
        line
        space
        assignedQuoterId
        assignedDesignerId
        assignedDevelopmentUserId
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

export const QUERY_PROJECTS_BY_ASSIGNED_DEVELOPMENT = `
  query ProjectsByAssignedDevelopment($userId: ID!) {
    projectsByAssignedDevelopment(userId: $userId) {
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
      requestedAt
      variants {
        id
        sapRef
        sapCode
        baseCode
        price
        elaborationTime
        quantity
        type
        effective
        quotedAt
        designedAt
        developedAt
        criticalMaterial
        comments
        baseName
        baseImage
        category
        subcategory
        line
        space
        assignedQuoterId
        assignedDesignerId
        assignedDevelopmentUserId
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

export const QUERY_PROJECTS_FOR_ASSIGNMENT = `
  query ProjectsForAssignment($role: String) {
    projectsForAssignment(role: $role) {
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
      requestedAt
      variants {
        id
        sapRef
        sapCode
        baseCode
        price
        elaborationTime
        quantity
        type
        effective
        quotedAt
        designedAt
        developedAt
        criticalMaterial
        comments
        baseName
        baseImage
        category
        subcategory
        line
        space
        assignedQuoterId
        assignedDesignerId
        assignedDevelopmentUserId
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
      requestedAt
      variants {
        id
        sapRef
        sapCode
        baseCode
        price
        elaborationTime
        quantity
        type
        effective
        quotedAt
        designedAt
        developedAt
        criticalMaterial
        comments
        baseName
        baseImage
        category
        subcategory
        line
        space
        assignedQuoterId
        assignedDesignerId
        assignedDevelopmentUserId
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

export const MUTATION_QUITAR_PROJECT_EFFECTIVE = `
  mutation QuitarProjectEffective($projectId: ID!) {
    quitarProjectEffective(projectId: $projectId)
  }
`;

export const MUTATION_MAKE_VARIANT_QUOTE_EFFECTIVE = `
  mutation MakeVariantQuoteEffective($projectId: ID!, $variantId: ID!, $effective: Boolean!) {
    makeVariantQuoteEffective(projectId: $projectId, variantId: $variantId, effective: $effective)
  }
`;

export const MUTATION_TOGGLE_P3_P5 = `
  mutation ToggleP3P5($projectId: ID!, $variantId: ID!) {
    toggleP3P5(projectId: $projectId, variantId: $variantId)
  }
`;

export const QUERY_THREADS_BY_PROJECT = `
  query ThreadsByProject($projectId: ID!) {
    threadsByProject(projectId: $projectId) {
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

export const MUTATION_MARK_VARIANT_AS_DESIGNED = `
  mutation MarkVariantAsDesigned($projectId: ID!, $variantId: ID!, $designerId: ID!) {
    markVariantAsDesigned(projectId: $projectId, variantId: $variantId, designerId: $designerId)
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

export const MUTATION_ASSIGN_VARIANT_TO_USER = `
  mutation AssignVariantToUser($projectId: ID!, $variantId: ID!, $assigneeId: ID!, $roleType: String!) {
    assignVariantToUser(projectId: $projectId, variantId: $variantId, assigneeId: $assigneeId, roleType: $roleType)
  }
`;

export const MUTATION_MARK_VARIANT_AS_DEVELOPED = `
  mutation MarkVariantAsDeveloped($projectId: ID!, $variantId: ID!, $developmentUserId: ID!) {
    markVariantAsDeveloped(projectId: $projectId, variantId: $variantId, developmentUserId: $developmentUserId)
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
