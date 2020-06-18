const iterateContributionTypes = require('./iterateContributionTypes');
const addToContributionsByRepository = require('../../utils/addToContributionsByRepository');

const iterateContributionPeriods = async ({
  token,
  user,
  periodIdx = 0,
  contributionTypes
}) => {
  // spawn call already for parallelization
  let contributionsTypesCollection = iterateContributionTypes({ token, user, contributionTypes, period: user.periods[periodIdx] });

  const otherContributionsTypesCollection = user.periods[periodIdx + 1]
    ? await iterateContributionPeriods({
      token,
      user,
      periodIdx: periodIdx + 1,
      contributionTypes
    }) : { totalContributions: 0, contributionsByRepository: [] };

  let {
    totalContributions,
    contributionsByRepository,
  } = await contributionsTypesCollection;

  totalContributions += otherContributionsTypesCollection.totalContributions;
  addToContributionsByRepository(
    contributionsByRepository,
    otherContributionsTypesCollection.contributionsByRepository,
  );

  return { totalContributions, contributionsByRepository };
}

module.exports = iterateContributionPeriods;