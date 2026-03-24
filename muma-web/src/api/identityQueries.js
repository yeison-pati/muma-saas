export const MUTATION_SIGN_IN = `
  mutation SignIn($input: LoginInput!) {
    signIn(input: $input) {
      user {
        id
        name
        email
        phone
        role
        jobTitle
        isLeader
      }
      token
    }
  }
`;

export const QUERY_USERS_BY_IDS = `
  query UsersByIds($userIds: [ID!]!) {
    usersByIds(userIds: $userIds) {
      id
      name
    }
  }
`;

const QUOTER_FIELDS = `
  user {
    id
    name
    email
    phone
    role
    jobTitle
    isLeader
    createdBy
  }
  quoted
  projects
  products
`;

export const QUERY_QUOTERS = `
  query Quoters($limit: Int, $offset: Int) {
    quoters(limit: $limit, offset: $offset) {
      items { ${QUOTER_FIELDS} }
      pageInfo { total limit offset }
    }
  }
`;

export const QUERY_SALES = `
  query Sales($limit: Int, $offset: Int) {
    sales(limit: $limit, offset: $offset) {
      items {
        user {
          id
          name
          email
          phone
          role
          jobTitle
          isLeader
          createdBy
        }
        requested
        effective
      }
      pageInfo { total limit offset }
    }
  }
`;

export const QUERY_DESIGNERS = `
  query Designers($limit: Int, $offset: Int) {
    designers(limit: $limit, offset: $offset) {
      items {
        user {
          id
          name
          email
          phone
          role
          jobTitle
          isLeader
          createdBy
        }
        created
        edited
      }
      pageInfo { total limit offset }
    }
  }
`;

export const QUERY_DEVELOPERS = `
  query Developers($limit: Int, $offset: Int) {
    developers(limit: $limit, offset: $offset) {
      items {
        user {
          id
          name
          email
          phone
          role
          jobTitle
          isLeader
          createdBy
        }
      }
      pageInfo { total limit offset }
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
