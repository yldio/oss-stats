global.console = {
  // eslint-disable-next-line no-undef
  debug: jest.fn(), // console.debug are ignored in tests

  // Keep native behaviour for other methods, use those to print out things in your own tests, not `console.debug`
  error: console.error,
  warn: console.warn,
  info: console.info,
  log: console.log,
};
