const express = require("express");
const http = require("http");

const { getData, summariseContributions } = require("./");

const app = express();

const org = "yldio";
const dataP = getData(org).then(summariseContributions, console.log);

app.get("/", async (req, res) => {
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
          }
          .repo > div {
            margin-bottom: 10px;
          }
          .repo-name {
            font-weight: 500;
          }
        </style>
      </head>
      <body>
  `);

  const data = await dataP;

  res.write(
    `<div class="big"><b>${org}</b> has made<br /><b>${
      data.pullRequestsCount
    }</b> contributions<br /> to <b>${
      data.reposCount
    }</b> open source projects.</div>`
  );

  res.write(`<div class="big">Top projects:</div>`);

  res.write(`
<div class="repo-container">
  ${data.repos
    .map(
      repo => `<div class="repo">
  <div class="repo-name">${repo.nameWithOwner}</div>
  <div>${repo.stargazers.totalCount} stars</div>
  <div>${repo.pullRequestsCount} contributions</div>
</div>`
    )
    .join("")}
</div>
`);

  res.write(`</body></html>`);
  res.end();
});

const server = http.createServer(app);
const port = process.env.PORT || 3000;
server.listen(port, function() {
  console.log("Express server running on *:" + port);
});
