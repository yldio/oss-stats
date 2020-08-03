const { getContributionStats } = require('./contributions');
const { contributionsByRepository } = require('../__mocks__/contributions');
const { orgMembers } = require('../__mocks__/members');

jest.mock('./iterateUserContributions');

const iterateUserContributions = require('./iterateUserContributions');
iterateUserContributions.mockResolvedValue({ contributionsByRepository });

describe('getContributionStats', () => {
  it('Should call iterateUserContributions 1 time per member', async () => {
    await getContributionStats({
      org: 'yldio',
      token: 'mockT0k3n',
      members: orgMembers,
    });

    expect(iterateUserContributions).toHaveBeenCalledTimes(orgMembers.length);
  });
});
