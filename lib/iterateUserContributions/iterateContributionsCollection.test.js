const iterateContributionsCollection = require('./iterateContributionsCollection');
const { contributionsByRepository } = require('../../__mocks__/contributions');
const { orgMembers } = require('../../__mocks__/members');

jest.mock('got', () => ({
  post: jest.fn(),
}));

const got = require('got');

jest.spyOn(got, 'post').mockResolvedValue({
  body: {
    data: {
      node: {
        contributionsCollection: {
          hasActivityInThePast: true,
          totalPullRequestContributions: 40,
          pullRequestContributionsByRepository: contributionsByRepository,
        },
      },
    },
  },
});

describe('iterateContributionsCollection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Should call github API once if the period range is inferior to 1 year', async () => {
    const member = {
      ...orgMembers[0],
      periods: [
        {
          joinDate: 'Sep 2016',
          leaveDate: 'Feb 2017',
        },
      ],
    };

    await iterateContributionsCollection({
      token: 'mockT0k3n',
      user: member,
      contributionType: 'pullRequest',
      period: member.periods[0],
    });

    expect(got.post).toHaveBeenCalledTimes(1);
  });

  it('Should call github API N times when the period range can be contained in N years', async () => {
    const member = {
      ...orgMembers[0],
      periods: [
        {
          joinDate: 'Sep 2016',
          leaveDate: 'Feb 2019',
        },
      ],
    };

    await iterateContributionsCollection({
      token: 'mockT0k3n',
      user: member,
      contributionType: 'pullRequest',
      period: member.periods[0],
    });

    expect(got.post).toHaveBeenCalledTimes(3);
  });
});
