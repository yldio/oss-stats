const { generateMembersDataFromLog, getOrgMembers } = require('./org');
const getUserData = require('../utils/getUserData');
const membersLogMock = require('../__mocks__/membersLog');
const { membersData } = require('../__mocks__/members');

jest.mock('../utils/getUserData');
getUserData.mockImplementation((username) => {
  const { id, url } = membersData[username]
  return {
    user: {
      id,
      url
    } 
  };
})

describe('generateMembersDataFromLog', () => {
  let membersData;

  it('Should call gitHub\'s API to get to get each user additional data', async () => {
    membersData = await generateMembersDataFromLog(membersLogMock);
    expect(getUserData).toHaveBeenCalledTimes(4);
  });

  it('Should return an object containg a key per user provided', async () => {
    expect(Object.keys(membersData).length).toBe(4);
  });

  it('Should have all necessary member data', async () => {
    const memberLogin = Object.keys(membersData)[0];
    const member =membersData[memberLogin];
    const expected = membersData[memberLogin];

    expect(member.name).toBe(expected.name);
    expect(member.id).toBeDefined();
    expect(member.url).toBe(expected.url);
    expect(member.periods).toEqual(expected.periods);
  });
})


describe('getOrgMembers', () => {
  it('Should return an array with org members data', async () => {
    const orgMembers = await getOrgMembers(membersLogMock);
    const usernames = Object.keys(membersData);
    const memberLogin = usernames[0];
    const expected = membersData[memberLogin];

    expect(orgMembers.length).toEqual(usernames.length);

    expect(orgMembers[0].name).toBe(expected.name);
    expect(orgMembers[0].id).toBeDefined();
    expect(orgMembers[0].url).toBe(expected.url);
    expect(orgMembers[0].periods).toEqual(expected.periods);
    expect(orgMembers[0].login).toBe(memberLogin)
  });
})