const { get, set } = require('lodash');

async function paginateConnection(
  client,
  query,
  variables,
  pathToConnection,
  previousPage,
) {
  const pathToNodes = pathToConnection + '.nodes';
  const currentPage = await client.query(
    query,
    previousPage
      ? {
          ...variables,
          after: get(previousPage, pathToConnection).pageInfo.endCursor,
        }
      : variables,
  );
  if (previousPage) {
    set(currentPage, pathToNodes, [
      ...get(previousPage, pathToNodes),
      ...get(currentPage, pathToNodes),
    ]);
  }

  if (get(currentPage, pathToConnection).pageInfo.hasNextPage) {
    return paginateConnection(
      client,
      query,
      variables,
      pathToConnection,
      currentPage,
    );
  }

  return currentPage;
}

module.exports = paginateConnection;
