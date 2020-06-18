const {
  map,
  size,
  flatMap,
  uniq,
  keyBy,
  orderBy,
} = require('lodash');

const { getContributionStats } = require('./contributions');

async function getData({ org, token, members }) {
  if (!org) {
    throw new Error(`Organization param missing, org: ${org}`);
  }
  if (!token) {
    throw new Error('Missing PAT token');
  }

  const pullRequests = await getContributionStats({
    org,
    token,
    members,
    contributionTypes: ['pullRequest']
  });

  const pullRequestsByRepo = pullRequests.contributionsByRepository.map(({ contributions, repository }) => ({
    ...repository,
    ...contributions
  }));

  return { contributionsByRepo: pullRequestsByRepo, totalContributions: pullRequests.totalContributions, members };
}

function summariseContributions(data) {
  return {
    repos: orderBy(data.repositories, 'rank'),
    repoCount: size(data.repositories),
    contributionsCount: data.totalContributions,
  };
}

function addRepositoryRanks(repos) {
  // this function mutates each object inside repos

  orderBy(repos, 'pullRequestCount', 'desc').forEach((r, i) => {
    r.pullRequestsRank = i;
  });

  orderBy(repos, 'starCount', 'desc').forEach((r, i) => {
    r.starsRank = i;
  });

  repos.forEach((r) => {
    r.rank = r.pullRequestsRank + r.starsRank;
  });

  return repos;
}

function groupRepositoriesByMember(repos) {
  const reposByMember = repos.reduce((acc, repo) => {
    Object.keys(repo.contributors).forEach(member => {
      acc[member] = {
        ...(acc[member] ? acc[member] : {}),
        [repo.nameWithOwner]: repo.contributors[member]
      };
    })

    return acc;
  }, {});

  return reposByMember;
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

function normalise({ contributionsByRepo, totalContributions, members }) {
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
      contributors: id[], // sorted by number of pullRequests
    }>,

    members: Map<{
      url,
      name,
      login,

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

  const repoKey = 'nameWithOwner';
  const memberKey = 'login';
  const topicKey = 'topic.name';

  const normalised = {};

  normalised.totalContributions = totalContributions;

  normalised.repositories = keyBy(
    addRepositoryRanks(
      contributionsByRepo.map((repo) => {
        return {
          url: repo.url,
          nameWithOwner: repo.nameWithOwner,
          descriptionHTML: repo.descriptionHTML,

          starCount: repo.stargazers.totalCount,
          pullRequestCount: repo.totalCount,

          topics: map(repo.repositoryTopics.nodes, topicKey),
          contributors: orderBy(
            Object.keys(repo.contributors),
            (k) => repo.contributors[k],
            'desc',
          ),
        };
      }),
    ),
    repoKey,
  );

  const pullRequestsByAuthor = groupRepositoriesByMember(contributionsByRepo);

  normalised.members = keyBy(
    members.map((m) => {
      return {
        url: m.url,
        name: m.name,
        login: m.login,

        repositoriesContributedTo: pullRequestsByAuthor[m.login] ? orderBy(
          Object.keys(pullRequestsByAuthor[m.login]),
          (k) => pullRequestsByAuthor[k],
          'desc',
        ) : null,
      };
    }),
    memberKey,
  );

  const repositoriesByTopic = groupRepositoriesByTopic(normalised.repositories);

  normalised.topics = keyBy(
    uniq(flatMap(contributionsByRepo, 'repositoryTopics.nodes')).map((t) => {
      const repositories = orderBy(repositoriesByTopic[t.topic.name], 'name');
      const contributors = uniq(flatMap(repositories, 'contributors'));

      return {
        url: t.url,
        name: t.topic.name,

        repositories: map(repositories, repoKey),
        contributors,
      };
    }),
    'name',
  );

  return normalised;
}

module.exports = { getData, normalise, summariseContributions };
