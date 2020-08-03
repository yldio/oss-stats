const {
  contributionsByRepository,
  otherContributionsByRepository,
} = require('../__mocks__/contributions');
const addToContributionsByRepository = require('./addToContributionsByRepository');

describe('addToContributionsByRepository', () => {
  const contributionsByRepositoryMock = [...contributionsByRepository];
  const otherContributionsByRepositoryMock = otherContributionsByRepository;
  const member = 'fabiommmoreira';

  const alreadyExistantRepoId = 'already-existant-repo';
  const newRepoId = 'new-repo';

  const getTargetContributions = (target) => (id) =>
    target.find(({ repository }) => repository.id === id);

  const getContributionsByRepoId = getTargetContributions(
    contributionsByRepositoryMock,
  );
  const getOtherContributionsByRepoId = getTargetContributions(
    otherContributionsByRepositoryMock,
  );

  const {
    contributions: { totalCount: initialExistantRepoContributionsCount },
  } = getContributionsByRepoId(alreadyExistantRepoId);
  const {
    contributions: { totalCount: initialExistantRepoOtherContributionsCount },
  } = getOtherContributionsByRepoId(alreadyExistantRepoId);

  const {
    contributions: { totalCount: newRepoOtherContributionsCount },
  } = getOtherContributionsByRepoId(newRepoId);

  addToContributionsByRepository(
    contributionsByRepositoryMock,
    otherContributionsByRepositoryMock,
    member,
  );

  const {
    contributions: {
      totalCount: finalExistantRepoContributionsCount,
      contributors,
    },
  } = getContributionsByRepoId(alreadyExistantRepoId);
  const {
    contributions: { totalCount: finalNewRepoContributionsCount },
  } = getContributionsByRepoId(newRepoId);

  it('Should add additional contributions to an already existant repo', () => {
    expect(finalExistantRepoContributionsCount).toBe(
      initialExistantRepoContributionsCount +
        initialExistantRepoOtherContributionsCount,
    );
  });

  it('Should add a new repo contribution', () => {
    expect(finalNewRepoContributionsCount).toBe(newRepoOtherContributionsCount);
  });

  it('Should add member to repo contributors', () => {
    expect(contributors[member]).toBe(
      initialExistantRepoOtherContributionsCount,
    );
  });
});
