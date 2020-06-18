const addToContributionsByRepository = (
  contributionsByRepository,
  otherContributionsByRepository,
  member
) => {
  otherContributionsByRepository.forEach((otherRepositoryEntry) => {
    const repositoryEntry = contributionsByRepository.find(
      ({ repository }) => repository.id === otherRepositoryEntry.repository.id,
    );

    if (repositoryEntry) {
      repositoryEntry.contributions.totalCount +=
        otherRepositoryEntry.contributions.totalCount;

      if (member) {
        repositoryEntry.contributions.contributors = {
          ...(repositoryEntry.contributions.contributors ? repositoryEntry.contributions.contributors : {}),
          [member]: otherRepositoryEntry.contributions.totalCount
        }
      }
    } else {
      if (member) {
        otherRepositoryEntry.contributions.contributors = {
          [member]: otherRepositoryEntry.contributions.totalCount
        }
      }
      contributionsByRepository.push(otherRepositoryEntry);
    }
  });
};

module.exports = addToContributionsByRepository;