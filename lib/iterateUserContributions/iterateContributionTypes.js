const iterateContributionsCollection = require('./iterateContributionsCollection');
const addToContributionsByRepository = require('../../utils/addToContributionsByRepository');

const iterateContributionTypes = async ({
  token,
  user,
  contributionTypes = ['commit', 'issue', 'pullRequest', 'pullRequestReview'],
  period,
}) => {
  const [contributionType, ...otherContributionTypes] = contributionTypes;

  // spawn call already for parallelization
  const contributionsCollection = iterateContributionsCollection({
    token,
    user,
    contributionType,
    period,
  });

  const otherContributionsCollection = otherContributionTypes.length
    ? await iterateContributionTypes({
        token,
        user,
        contributionTypes: otherContributionTypes,
        period,
      })
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
};

module.exports = iterateContributionTypes;
