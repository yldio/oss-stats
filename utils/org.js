const { get } = require('lodash');

const paginateConnection = require('./pagination');

const orgMembersQuery = `
  query($org: String!, $after: String) {
    organization(login: $org) {
      membersWithRole(first: 100, after: $after) {
        nodes {
          id
          url
          name
          login
        }
        pageInfo {
          endCursor
          hasNextPage
        }
      }
    }
  }
`;

async function getOrgMembers(client, org) {
  return get(
    await paginateConnection(
      client,
      orgMembersQuery,
      { org },
      'organization.membersWithRole',
    ),
    'organization.membersWithRole.nodes',
  );
}

module.exports = getOrgMembers;
