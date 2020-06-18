const topic1 = {
  "url": "https://github.com/topics/babel",
  "topic": {
          "name": "babel"
  }
};

const topic2 = {
  "url": "https://github.com/topics/documentation",
  "topic": {
          "name": "documentation"
  }
};

const topic3 = {
  "url": "https://github.com/topics/javascript",
  "topic": {
          "name": "javascript"
  }
};

const contributionsByRepository = [
  {
      "contributions": {
          "totalCount": 7,
          "contributors": {
            "sergioramos": 7
          }
      },
      "repository": {
          "id": "already-existant-repo",
          "nameWithOwner": "yldio/already-existant",
          "descriptionHTML": "<div>Already Existant Repo</div>",
          "url": "https://github.com/yldio/already-existant",
          "repositoryTopics": {
              "nodes": [topic1, topic2]
          },
          "stargazers": {
              "totalCount": 43
          }
      }
  },
  {
      "contributions": {
          "totalCount": 11,
          "contributors": {
            "sergioramos": 3,
            "fabiommmoreira": 8
          }
      },
      "repository": {
          "id": "already-existant-repo2",
          "nameWithOwner": "yldio/already-existant2",
          "descriptionHTML": "<div>Already Existant Repo 2</div>",
          "url": "https://github.com/yldio/already-existant2",
          "repositoryTopics": {
              "nodes": [topic1, topic3]
          },
          "stargazers": {
              "totalCount": 55
          }
      }
  },
];

const otherContributionsByRepository = [
    {
        "contributions": {
            "totalCount": 2,
        },
        "repository": {
            "id": "already-existant-repo",
            "nameWithOwner": "yldio/already-existant",
            "descriptionHTML": "<div>Already Existant Repo</div>",
            "url": "https://github.com/yldio/already-existant",
            "repositoryTopics": {
                "nodes": [topic1, topic2]
            },
            "stargazers": {
                "totalCount": 43
            }
        }
    },
    {
        "contributions": {
            "totalCount": 9,
            "contributors": {
                "fabiommmoreira": 9
            }
        },
        "repository": {
            "id": "new-repo",
            "nameWithOwner": "yldio/new-repo",
            "descriptionHTML": "<div>New Repo</div>",
            "url": "https://github.com/yldio/new-repo",
            "repositoryTopics": {
                "nodes": [topic2]
            },
            "stargazers": {
                "totalCount": 13
            }
        }
    }
];

const contributionTypes = [
  'commit',
  'issue',
  'pullRequest',
  'pullRequestReview',
];

module.exports = { contributionsByRepository, otherContributionsByRepository, contributionTypes }