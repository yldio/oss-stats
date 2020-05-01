const { subYears } = require('date-fns');
const { GitHub } = require('github-graphql-api');
const got = require('got');
const pRetry = require('p-retry');

const getOrgMembers = require('./utils/org');

const addToContributionsByRepository = (
  contributionsByRepository,
  otherContributionsByRepository,
) => {
  otherContributionsByRepository.forEach((otherRepositoryEntry) => {
    const repositoryEntry = contributionsByRepository.find(
      ({ repository }) => repository.id === otherRepositoryEntry.repository.id,
    );
    if (repositoryEntry) {
      repositoryEntry.contributions.totalCount +=
        otherRepositoryEntry.contributions.totalCount;
    } else {
      contributionsByRepository.push(otherRepositoryEntry);
    }
  });
};

const contributionsTotalField = (contributionType) =>
  'total' +
  contributionType[0].toUpperCase() +
  contributionType.slice(1) +
  'Contributions';
const contributionsByRepositoryField = (contributionType) =>
  contributionType + 'ContributionsByRepository';
const userContributionsQuery = (contributionType) => `
  query ($userId: ID!, $from: DateTime!, $to: DateTime!, $maxRepositories: Int!) {
    node(id: $userId) {
      ... on User {
        contributionsCollection(from: $from, to: $to) {
          hasActivityInThePast
          ${contributionsTotalField(contributionType)}
          ${contributionsByRepositoryField(
            contributionType,
          )}(maxRepositories: $maxRepositories) {
            contributions {
              totalCount
            }
            repository {
              id
              url
              nameWithOwner
              descriptionHTML
              stargazers {
                totalCount
              }
            }
          }
        }
      }
    }
  }
`;
/**
 * @param {'commit' | 'issue' | 'pullRequest' | 'pullRequestReview'} contributionType
 */
async function iterateContributionsCollection(
  token,
  user,
  contributionType,
  to = new Date(),
) {
  // API limit, we may lose some if a user contributions to many different repositories in a year
  // Could shorten the interval to less than a year at the expense of making more calls
  const maxRepositories = 100;
  const from = subYears(to, 1);

  const query = userContributionsQuery(contributionType);
  const variables = {
    userId: user.id,
    from,
    to,
    maxRepositories,
  };
  let data, errors;
  // Even before hitting the hourly rate limit,
  // GitHub's API sometimes 403s if you make too many requests.
  // Retry a bunch of times just in case.
  await pRetry(async () => {
    try {
      // We don't use github-graphql-api because its error messages are useless
      ({
        body: { data },
        errors,
      } = await got.post('https://api.github.com/graphql', {
        json: { query, variables },
        responseType: 'json',
        headers: {
          authorization: `Bearer ${token}`,
        },
        timeout: 10000,
      }));
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
  let {
    node: {
      contributionsCollection: {
        hasActivityInThePast,
        [contributionsTotalField(contributionType)]: totalContributions,
        [contributionsByRepositoryField(
          contributionType,
        )]: contributionsByRepository,
      },
    },
  } = data;
  console.debug(
    `User ${user.login} has ${totalContributions} ${contributionType} contributions between ${from} and ${to}`,
  );

  if (hasActivityInThePast) {
    const previousContributions = await iterateContributionsCollection(
      token,
      user,
      contributionType,
      from,
    );
    totalContributions += previousContributions.totalContributions;
    addToContributionsByRepository(
      contributionsByRepository,
      previousContributions.contributionsByRepository,
    );
  }

  return { totalContributions, contributionsByRepository };
}

async function iterateContributionTypes(
  token,
  user,
  [contributionType, ...otherContributionTypes] = [
    'commit',
    'issue',
    'pullRequest',
    'pullRequestReview',
  ],
) {
  // spawn call already for parallelization
  let contributionsCollection = iterateContributionsCollection(
    token,
    user,
    contributionType,
  );

  const otherContributionsCollection = otherContributionTypes.length
    ? await iterateContributionTypes(token, user, otherContributionTypes)
    : { totalContributions: 0, contributionsByRepository: [] };

  let {
    totalContributions,
    contributionsByRepository,
  } = await contributionsCollection;
  console.debug(
    `User ${user.login} has ${totalContributions} ${contributionType} contributions`,
  );

  totalContributions += otherContributionsCollection.totalContributions;
  addToContributionsByRepository(
    contributionsByRepository,
    otherContributionsCollection.contributionsByRepository,
  );

  return { totalContributions, contributionsByRepository };
}

async function getContributionStats(org, token) {
  if (!org) {
    throw new Error(`Organization param missing, org: ${org}`);
  }
  if (!token) {
    throw new Error('Missing GitHub access token');
  }

  const client = new GitHub({ token });

  const members = await getOrgMembers(client, org);

  const contributionsPerMember = await Promise.all(
    members.map(async (member) => {
      const memberContributions = await iterateContributionTypes(token, member);
      console.debug(
        `User ${member.login} has ${memberContributions.totalContributions} contributions:`,
      );
      memberContributions.contributionsByRepository.forEach(
        ({ contributions: { totalCount }, repository: { nameWithOwner } }) =>
          console.debug(`${totalCount} contributions to ${nameWithOwner}`),
      );

      return memberContributions;
    }),
  );

  let totalContributions = 0;
  let contributionsByRepository = [];
  for (memberContributions of contributionsPerMember) {
    totalContributions += memberContributions.totalContributions;
    addToContributionsByRepository(
      contributionsByRepository,
      memberContributions.contributionsByRepository,
    );
  }
  console.debug(`Org ${org} has ${totalContributions} contributions:`);
  contributionsByRepository.forEach(
    ({ contributions: { totalCount }, repository: { nameWithOwner } }) =>
      console.debug(`${totalCount} contributions to ${nameWithOwner}`),
  );

  return { totalContributions, contributionsByRepository };
}

module.exports = { getContributionStats };
