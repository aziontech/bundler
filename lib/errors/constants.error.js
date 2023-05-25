const ErrorCode = {
  Ok: 0,
  Unknown: 100,
  NotADirectory: 1020,
};

const ErrorMessage = {
  [ErrorCode.Ok]: 'Operation successful.',
  [ErrorCode.Unknown]: 'An unknown error has occurred.',
  [ErrorCode.NotADirectory]: 'The file is not a directory: {0}',
};

export { ErrorCode, ErrorMessage };
