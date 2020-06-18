const { flatten, get } = require('lodash');

const { getData, normalise, summariseContributions } = require('./pull-requests');
const contributions = require('./contributions');
const { orgMembers } = require('../__mocks__/members');
const { contributionsByRepository } = require('../__mocks__/contributions');

jest.mock('./contributions', () => ({
  getContributionStats: jest.fn()
}));

const totalContributions = 10;

contributions.getContributionStats.mockResolvedValue({ contributionsByRepository, totalContributions });

let pullRequests, normalisedData;

describe('getData', () => {
  const args = {
    org: 'yldio',
    token: 'm0ckT0k3n',
    members: orgMembers
  }

  it('Should call getContributionStats with only pull request as contribution type', async () => {
    pullRequests = await getData(args);
    expect(contributions.getContributionStats).toHaveBeenCalledWith({...args, contributionTypes: ['pullRequest']});
  });

  it('Should return pullRequestsByRepo, totalContributions and members (to be consumed by normalise func) ', () => {
    expect(pullRequests.contributionsByRepo.length).toBe(contributionsByRepository.length);
    expect(pullRequests.totalContributions).toBe(totalContributions);
    expect(pullRequests.members).toBe(orgMembers);
  });
})

describe('normalise', () => {
  let repo1, repo2, contributor1, contributor2;
  it('Should return correctly ranked repositories', () => {
    normalisedData = normalise(pullRequests);
  
    const normalisedRepos = normalisedData.repositories
    const [repo1Key, repo2Key] = Object.keys(normalisedRepos);
    repo1 = normalisedRepos[repo1Key];
    repo2 = normalisedRepos[repo2Key];

    if (repo1.starCount > repo2.starCount) {
      expect(repo1.starsRank).toBeLessThan(repo2.starsRank);
    } else {
      expect(repo1.starsRank).toBeGreaterThan(repo2.starsRank);
    }

    if (repo1.pullRequestCount > repo2.pullRequestCount) {
      expect(repo1.pullRequestsRank).toBeLessThan(repo2.pullRequestsRank);
    } else {
      expect(repo1.pullRequestsRank).toBeGreaterThan(repo2.pullRequestsRank);
    }

    expect(repo1.rank).toBe(repo1.starsRank + repo1.pullRequestsRank);
  });

  it('Should return contributors ordered by number of repo contributions', () => {
    const contributionsCount = contributionsByRepository[1].contributions.contributors;

    [contributor1, contributor2] = repo2.contributors;
    expect(contributionsCount[contributor1]).toBeGreaterThan(contributionsCount[contributor2]);
  });

  it('Should return a list of the org members with the repositories they\'ve contributed to', () => {
    const { members } = normalisedData;
    expect(members[contributor1].repositoriesContributedTo).toBeDefined();
    expect(members[contributor2].repositoriesContributedTo).toBeDefined();
  });

  it('Should return a list of the topics with contributions and associated repos', () => {
    const { topics } = normalisedData;
    const [topic1, topic2, topic3] = Object.keys(topics);
    const repoTopicsCount = flatten(contributionsByRepository.map(contribution => {
      return get(contribution, 'repository.repositoryTopics.nodes')
        .map(({ topic: { name } }) => name)}))
        .reduce((acc, topic) => {
          acc[topic] = acc[topic] ? acc[topic] + 1 : 1;
          return acc;
        }, {})

    expect(topics[topic1].repositories.length).toBe(repoTopicsCount[topic1]);
    expect(topics[topic2].repositories.length).toBe(repoTopicsCount[topic2]);
    expect(topics[topic3].repositories.length).toBe(repoTopicsCount[topic3]);
  });
})

describe('summariseContributions', () => {
  it('Should summarise contributions considering all repositories', () => {
    const { repos, repoCount, contributionsCount } = summariseContributions(normalisedData);

    expect(repos.length).toBe(contributionsByRepository.length);
    expect(repoCount).toBe(contributionsByRepository.length);
    expect(contributionsCount).toBe(normalisedData.totalContributions);
  });
})