const { GitHub } = require("github-graphql-api");
const {
  map,
  get,
  set,
  size,
  flatMap,
  uniq,
  chunk,
  keyBy,
  orderBy,
  groupBy,
  countBy
} = require("lodash");

async function paginateConnection(
  client,
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

const userPullRequestsQuery = `
  query($id: ID!, $after: String) {
    node(id: $id) {
      ... on User {
        pullRequests(first: 100, after: $after) {
          nodes {
            id
            url
            createdAt
            author {
              ... on User {
                id
                login
              }
            }
            repository {
              id
              nameWithOwner
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

async function getData(org, token) {

  if(!org) { throw new Error(`'Organization param missing, org: ${org}`) }
  if(!token) { throw new Error('Missing PAT token') }

  const client = new GitHub({ token });

  const members = get(
    await paginateConnection(
      client,
      orgMembersQuery,
      { org },
      'organization.membersWithRole'
    ),
    'organization.membersWithRole.nodes'
  );;

  const pullRequests = flatMap(
    await Promise.all(
      members.map(({ id }) =>
        paginateConnection(client, userPullRequestsQuery, { id }, "node.pullRequests")
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

function summariseContributions(data) {
  return {
    repos: orderBy(data.repositories, "rank"),
    repoCount: size(data.repositories),
    pullRequestCount: size(data.pullRequests),
    pullRequestsByYear: countBy(data.pullRequests, "year"),
    pullRequestsByMonth: countBy(data.pullRequests, "month")
  };
}

function addRepositoryRanks(repos) {
  // this function mutates each object inside repos

  orderBy(repos, "pullRequestCount", "desc").forEach((r, i) => {
    r.pullRequestsRank = i;
  });

  orderBy(repos, "starCount", "desc").forEach((r, i) => {
    r.starsRank = i;
  });

  repos.forEach(r => {
    r.rank = r.pullRequestsRank + r.starsRank;
  });

  return repos;
}

function groupRepositoriesByTopic(repos) {
  const reposByTopic = {};

  for (repo of Object.values(repos)) {
    for (topic of repo.topics) {
      const group = reposByTopic[topic] || [];
      group.push(repo);
      reposByTopic[topic] = group;
    }
  }

  return reposByTopic;
}

function normalise(data) {
  /*
  {
    repositories: Map<{
      url,
      nameWithOwner,
      descriptionHTML,

      starCount,
      pullRequestCount,
      starsRank,
      pullRequestsRank,
      rank,

      topics: id[], // sorted in original github order
      pullRequests: id[], // sorted by createdAt
      contributors: id[], // sorted by number of pullRequests
    }>,

    pullRequests: Map<{
      id,
      url,
      createdAt,
      year,
      month,

      author: id,
      repository: id
    }>,

    members: Map<{
      url,
      name,
      login,

      pullRequests: id[], // sorted by createdAt
      repositoriesContributedTo: id[], // sorted by number of pullRequests
    }>,

    topics: Map<{
      url,
      name,

      repositories: id[], // sorted by popularity-significance rank
      contributors: id[] // sorted by something rank ??
    }>
  }
  */
  const pullRequestKey = "id";
  const repoKey = "nameWithOwner";
  const memberKey = "login";
  const topicKey = "topic.name";

  const normalised = {};

  normalised.pullRequests = keyBy(
    data.pullRequests.map(pr => ({
      id: pr.id,
      url: pr.url,
      createdAt: pr.createdAt,
      year: pr.createdAt.slice(0, 4),
      month: pr.createdAt.slice(0, 7),

      author: pr.author[memberKey],
      repository: pr.repository[repoKey]
    })),
    pullRequestKey
  );

  const pullRequestsByRepo = groupBy(normalised.pullRequests, "repository");
  const pullRequestsByAuthor = groupBy(normalised.pullRequests, "author");

  normalised.repositories = keyBy(
    addRepositoryRanks(
      data.repos.map(repo => {
        const pullRequests = orderBy(
          pullRequestsByRepo[repo[repoKey]],
          "createdAt"
        );
        const authorCounts = countBy(pullRequests, "author");

        return {
          url: repo.url,
          nameWithOwner: repo.nameWithOwner,
          descriptionHTML: repo.descriptionHTML,

          starCount: repo.stargazers.totalCount,
          pullRequestCount: pullRequests.length,

          topics: map(repo.repositoryTopics.nodes, topicKey),
          pullRequests: map(pullRequests, pullRequestKey),
          contributors: orderBy(
            Object.keys(authorCounts),
            k => authorCounts[k],
            "desc"
          )
        };
      })
    ),
    repoKey
  );

  normalised.members = keyBy(
    data.members.map(m => {
      const pullRequests = orderBy(
        pullRequestsByAuthor[m[memberKey]],
        "createdAt"
      );

      const repoCounts = countBy(pullRequests, "repository");

      return {
        url: m.url,
        name: m.name,
        login: m.login,

        pullRequests: map(pullRequests, pullRequestKey),
        repositoriesContributedTo: orderBy(
          Object.keys(repoCounts),
          k => repoCounts[k],
          "desc"
        )
      };
    }),
    memberKey
  );

  const repositoriesByTopic = groupRepositoriesByTopic(normalised.repositories);

  normalised.topics = keyBy(
    uniq(flatMap(data.repos, "repositoryTopics.nodes")).map(t => {
      const repositories = orderBy(repositoriesByTopic[t.topic.name], "name");
      const contributors = uniq(flatMap(repositories, "contributors"));

      return {
        url: t.url,
        name: t.topic.name,

        repositories: map(repositories, repoKey),
        contributors
      };
    }),
    "name"
  );

  return normalised;
}

module.exports = { getData, normalise, summariseContributions };
