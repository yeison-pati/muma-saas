export const MUTATION_SIGN_IN = `
  mutation SignIn($input: LoginInput!) {
    signIn(input: $input) {
      user {
        id
        name
        email
        phone
        role
        region
        jobTitle
      }
      token
    }
  }
`;

export const QUERY_QUOTERS = `
  query Quoters {
    quoters {
      user {
        id
        name
        email
        phone
        role
        region
        jobTitle
        createdBy
      }
      quoted
      projects
      products
    }
  }
`;

export const QUERY_SALES = `
  query Sales {
    sales {
      user {
        id
        name
        email
        phone
        role
        region
        jobTitle
        createdBy
      }
      requested
      effective
    }
  }
`;

export const QUERY_DESIGNERS = `
  query Designers {
    designers {
      user {
        id
        name
        email
        phone
        role
        region
        jobTitle
        createdBy
      }
      created
      edited
    }
  }
`;

export const QUERY_DEVELOPERS = `
  query Developers {
    developers {
      user {
        id
        name
        email
        phone
        role
        region
        jobTitle
        createdBy
      }
    }
  }
`;

export const MUTATION_CREATE_USER = `
  mutation CreateUser($input: RegisterInput!) {
    createUser(input: $input)
  }
`;

export const MUTATION_DELETE_USER = `
  mutation DeleteUser($userId: ID!) {
    deleteUser(userId: $userId)
  }
`;

export const MUTATION_EDIT_USER = `
  mutation EditUser($userId: ID!, $input: UserUpdateInput!) {
    editUser(userId: $userId, input: $input)
  }
`;
