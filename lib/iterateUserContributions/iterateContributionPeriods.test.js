const iterateContributionPeriods = require('./iterateContributionPeriods');
const { contributionsByRepository, contributionTypes } = require('../../__mocks__/contributions');
const { orgMembers } = require('../../__mocks__/members');

jest.mock('./iterateContributionTypes');

const iterateContributionTypes = require('./iterateContributionTypes');
iterateContributionTypes.mockResolvedValue({ contributionsByRepository: contributionsByRepository });

const memberWith1Period = orgMembers[0];
const memberWith2Periods = orgMembers[3];

describe('iterateContributionPeriods', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Should call iterateContributionTypes once when there\'s only 1 contributing period', async () => {
    await iterateContributionPeriods({
      token: 'mockT0k3n',
      user: memberWith1Period,
      contributionTypes
    });

    expect(iterateContributionTypes).toHaveBeenCalledTimes(memberWith1Period.periods.length);
  });

  it('Should call iterateContributionTypes for each user contributing period', async () => {
    const baseArgs = {
      token: 'mockT0k3n',
      user: memberWith2Periods,
      contributionTypes
    };

    await iterateContributionPeriods(baseArgs);

    expect(iterateContributionTypes).toHaveBeenCalledTimes(memberWith2Periods.periods.length);
    expect(iterateContributionTypes).toHaveBeenNthCalledWith(1, { ...baseArgs, period: memberWith2Periods.periods[0] });
    expect(iterateContributionTypes).toHaveBeenNthCalledWith(2, { ...baseArgs, period: memberWith2Periods.periods[1] });
  });
})
