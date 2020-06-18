const iterateUserContributions = require('./iterateUserContributions');
const addToContributionsByRepository = require('../utils/addToContributionsByRepository');

const getContributionStats = async ({ org, token, members, contributionTypes }) => {
  if (!org) {
    throw new Error(`Organization param missing, org: ${org}`);
  }
  if (!token) {
    throw new Error('Missing GitHub access token');
  }

  const contributionsPerMember = await Promise.all(
    members.map(async (member) => {
      const memberContributions = await iterateUserContributions({ token, user: member, contributionTypes });
      console.debug(
        `User ${member.login} has ${memberContributions.totalContributions} contributions:`,
      );

      memberContributions.contributionsByRepository.forEach(
        ({ contributions: { totalCount }, repository: { nameWithOwner } }) =>
          console.debug(`${totalCount} contributions to ${nameWithOwner}`),
      );

      return { member: member.login, ...memberContributions };
    }),
  );

  let totalContributions = 0;
  let contributionsByRepository = [];
  for (memberContributions of contributionsPerMember) {
    totalContributions += memberContributions.totalContributions;
    addToContributionsByRepository(
      contributionsByRepository,
      memberContributions.contributionsByRepository,
      memberContributions.member
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
