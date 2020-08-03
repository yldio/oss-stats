const pRetry = require('p-retry');
const got = require('got');

const userQuery = `
query($login: String!) {
  user(login: $login) {
      id
      url
      name
      login
  }
}
`;

const getUserData = async (login) => {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('Missing GitHub access token');
  }

  const query = userQuery;
  const variables = {
    login,
  };

  let data;

  await pRetry(async () => {
    let errors;

    try {
      // We don't use github-graphql-api because its error messages are useless
      const res = await got.post('https://api.github.com/graphql', {
        json: { query, variables },
        responseType: 'json',
        headers: {
          authorization: `Bearer ${token}`,
        },
        timeout: 10000,
      });

      data = res.body.data;
      errors = res.errors;
    } catch (error) {
      throw new Error(`
        Failed to retrieve contributions collection.
        Query:
        ${query}
        Variables:
        ${JSON.stringify(variables, null, 2)}
        API error:
        ${error}
      `);
    }

    if (errors) {
      throw new pRetry.AbortError(
        'GraphQL errors: ' + JSON.stringify(errors, null, 2),
      );
    }
  }, 16);

  return data;
};

module.exports = getUserData;
