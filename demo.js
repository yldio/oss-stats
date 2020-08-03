const express = require('express');
const http = require('http');

const {
  pullRequests: { getData, normalise, summariseContributions },
  org: { getOrgMembers },
} = require('./');

const membersLog = require('./__mocks__/membersLog');

const app = express();

const org = 'yldio';

// const contributionsPromise = async () => {
//   const members = await getOrgMembers(membersLog);

//   const contributions = await getContributionStats({
//     org,
//     token: process.env.GITHUB_TOKEN,
//     members,
//   });

//   console.log('contributions: ', contributions);

//   return contributions;
// }

// return contributionsPromise();

const summaryPromise = getOrgMembers(membersLog)
  .then((members) => getData({ org, token: process.env.GITHUB_TOKEN, members }))
  .then(normalise)
  .then(summariseContributions)
  .catch(console.log);

app.get('/', async (req, res) => {
  res.status(200);
  res.write(`
    <!DOCTYPE html>
    <html lang="en" dir="ltr">
      <head>
        <meta charset="utf-8">
        <title>Open Source Stats</title>
        <style>
          body {
            font-family: -apple-system;
            margin: 40px;
          }
          * {
            box-sizing: border-box;
          }
          .big {
            font-size: 35px;
            margin-bottom: 30px;
            max-width: 400px;
          }
          .repo-container {
            display: flex;
            flex-direction: row;
            flex-wrap: wrap;
          }
          .repo {
            border: 1px solid black;
            width: 250px;
            height: 250px;
            padding: 20px;
            font-size: 20px;
            margin: 5px;
            overflow: hidden;
          }
          .repo > div {
            margin-bottom: 10px;
          }
          .repo-name {
            font-weight: 500;
          }
          .topics {
            display: flex;
            flex-direction: row;
            flex-wrap: wrap;
          }
          .topic {
            padding: 5px;
            border: 1px solid rgba(0,0,0,0.5);
            margin-right: 5px;
            margin-bottom: 5px;
          }
        </style>
      </head>
      <body>
  `);

  const summary = await summaryPromise;

  res.write(
    `<div class="big"><b>${org}</b> has made<br /><b>${summary.contributionsCount}</b> contributions<br /> to <b>${summary.repoCount}</b> open source projects.</div>`,
  );

  res.write(`<div class="big">Top projects:</div>`);

  res.write(`
<div class="repo-container">
  ${summary.repos
    .map(
      (repo) => `<div class="repo">
  <div class="repo-name">${repo.nameWithOwner}</div>
  <div>${repo.starCount} stars</div>
  <div>${repo.pullRequestCount} contributions</div>
  <div class="topics">${repo.topics
    .map((t) => `<div class="topic">${t}</div>`)
    .slice(0, 5)
    .join('')}</div>
</div>`,
    )
    .join('')}
</div>
`);

  res.write(`</body></html>`);
  res.end();
});

const server = http.createServer(app);
const port = process.env.PORT || 3000;
server.listen(port, function () {
  console.log('Express server running on *:' + port);
});
