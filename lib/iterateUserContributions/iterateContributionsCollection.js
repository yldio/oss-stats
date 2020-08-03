const { subYears, addMonths } = require('date-fns');
const got = require('got');
const pRetry = require('p-retry');

const addToContributionsByRepository = require('../../utils/addToContributionsByRepository');

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
      }
    }
  }
`;

/**
 * @param {'commit' | 'issue' | 'pullRequest' | 'pullRequestReview'} contributionType
 */
const iterateContributionsCollection = async ({
  token,
  user,
  contributionType,
  period,
  toDate = new Date(),
}) => {
  // API limit, we may lose some if a user contributions to many different repositories in a year
  // Could shorten the interval to less than a year at the expense of making more calls
  const maxRepositories = 100;

  const joinDate = new Date(period.joinDate);
  const leaveDate = period.leaveDate
    ? addMonths(new Date(period.leaveDate), 1)
    : new Date();

  const to = toDate > leaveDate ? leaveDate : toDate;
  const from = joinDate > subYears(to, 1) ? joinDate : subYears(to, 1);

  const query = userContributionsQuery(contributionType);

  const variables = {
    userId: user.id,
    from,
    to,
    maxRepositories,
  };
  let data;
  let errors;

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

  if (!data.node) {
    return { totalContributions: 0, contributionsByRepository: [] };
  }

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

  if (hasActivityInThePast && to > from && from > joinDate) {
    const previousContributions = await iterateContributionsCollection({
      token,
      user,
      contributionType,
      period,
      toDate: from,
    });
    totalContributions += previousContributions.totalContributions;
    addToContributionsByRepository(
      contributionsByRepository,
      previousContributions.contributionsByRepository,
    );
  }

  return { totalContributions, contributionsByRepository };
};

module.exports = iterateContributionsCollection;
