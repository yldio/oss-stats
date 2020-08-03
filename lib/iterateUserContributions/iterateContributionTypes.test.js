const iterateContributionTypes = require('./iterateContributionTypes');
const {
  contributionsByRepository,
  contributionTypes,
} = require('../../__mocks__/contributions');
const { orgMembers } = require('../../__mocks__/members');

jest.mock('./iterateContributionsCollection');

const iterateContributionsCollection = require('./iterateContributionsCollection');
iterateContributionsCollection.mockResolvedValue({
  contributionsByRepository,
});

const member = orgMembers[0];

describe('iterateContributionTypes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Should call iterateContributionsCollection once when there's only 1 contribution type", async () => {
    await iterateContributionTypes({
      token: 'mockT0k3n',
      user: member,
      contributionTypes: ['commit'],
      period: member.periods[0],
    });

    expect(iterateContributionsCollection).toHaveBeenCalledTimes(1);
  });

  it('Should call iterateContributionsCollection for each contribution type', async () => {
    await iterateContributionTypes({
      token: 'mockT0k3n',
      user: member,
      contributionTypes,
      period: member.periods[0],
    });

    expect(iterateContributionsCollection).toHaveBeenCalledTimes(4);
  });
});
