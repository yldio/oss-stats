const { GitHub } = require("github-graphql-api");
const {
  get,
  set,
  flatMap,
  uniq,
  chunk,
  keyBy,
  orderBy,
  groupBy,
  countBy
} = require("lodash");

const client = new GitHub({ token: process.env.GITHUB_TOKEN });

async function paginateConnection(
  query,
  variables,
  pathToConnection,
  previousPage
) {
  const pathToNodes = pathToConnection + ".nodes";
  const currentPage = await client.query(
    query,
    previousPage
      ? {
          ...variables,
          after: get(previousPage, pathToConnection).pageInfo.endCursor
        }
      : variables
  );
  if (previousPage) {
    set(currentPage, pathToNodes, [
      ...get(previousPage, pathToNodes),
      ...get(currentPage, pathToNodes)
    ]);
  }
  if (get(currentPage, pathToConnection).pageInfo.hasNextPage) {
    return paginateConnection(query, variables, pathToConnection, currentPage);
  } else {
    return currentPage;
  }
}

const orgMembersQuery = `
  query($org: String!, $after: String) {
    organization(login: $org) {
      members(first: 100, after: $after) {
        nodes {
          id
        }
        pageInfo {
          endCursor
          hasNextPage
        }
      }
    }
  }
`;

const userPullRequestsQuery = `
  query($id: ID!, $after: String) {
    node(id: $id) {
      ... on User {
        pullRequests(first: 100, after: $after) {
          nodes {
            createdAt
            author {
              ... on User {
                id
                url
                name
                login
              }
            }
            repository {
              id
            }
          }
          pageInfo {
            endCursor
            hasNextPage
          }
        }
      }
    }
  }
`;

const repoDetailsQuery = `
  query($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on Repository {
        id
        url
        nameWithOwner
        descriptionHTML
        repositoryTopics(first: 100) {
          nodes {
            url
            topic {
              name
            }
          }
        }
        stargazers {
          totalCount
        }
      }
    }
  }
`;

async function getData(org) {
  const members = get(
    await paginateConnection(orgMembersQuery, { org }, "organization.members"),
    "organization.members.nodes"
  );

  const pullRequests = flatMap(
    await Promise.all(
      members.map(member =>
        paginateConnection(userPullRequestsQuery, member, "node.pullRequests")
      )
    ),
    "node.pullRequests.nodes"
  );

  const repos = flatMap(
    await Promise.all(
      chunk(uniq(pullRequests.map(r => r.repository.id)), 100).map(ids =>
        client.query(repoDetailsQuery, { ids })
      )
    ),
    "nodes"
  );

  return { members, pullRequests, repos };
}

function sortRepos(repos) {
  const reposWithPullRequestsRank = orderBy(
    repos,
    "pullRequestsCount",
    "desc"
  ).map((r, i) => ({ ...r, pullRequestsRank: i }));
  const reposWithBothRanks = orderBy(
    reposWithPullRequestsRank,
    "stargazers.totalCount",
    "desc"
  ).map((r, i) => ({ ...r, starsRank: i }));

  return orderBy(
    reposWithBothRanks.map(r => ({
      ...r,
      rank: r.pullRequestsRank + r.starsRank
    })),
    "rank",
    "asc"
  );
}

function summariseContributions(data) {
  const reposById = keyBy(data.repos, "id");

  const pullRequests = orderBy(
    data.pullRequests.map(pr => ({
      ...pr,
      year: pr.createdAt.slice(0, 4),
      month: pr.createdAt.slice(0, 7),
      repository: reposById[pr.repository.id]
    })),
    "createdAt",
    "desc"
  );

  const prsByRepo = groupBy(pullRequests, "repository.id");

  const repos = sortRepos(
    data.repos.map(r => {
      const pullRequests = prsByRepo[r.id];
      const pullRequestsCount = pullRequests.length;
      return {
        ...r,
        repositoryTopics: r.repositoryTopics.nodes,
        pullRequests,
        pullRequestsCount
      };
    })
  );

  const summary = {
    repos,
    reposCount: repos.length,
    pullRequestsCount: pullRequests.length,
    pullRequestsByYear: countBy(pullRequests, "year"),
    pullRequestsByMonth: countBy(pullRequests, "month")
  };

  return summary;
}

module.exports = { getData, summariseContributions };
