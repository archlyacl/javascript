const error = require('./error');

describe('Message format correctness', () => {
  test('DuplicateError', () => {
    let e = new error.DuplicateError('t1');
    expect(e.message).toBe("Entry 't1' is already in the registry.");
  });

  test('InvalidError', () => {
    let e = new error.InvalidError('t1', 't2');
    expect(e.message).toBe("Invalid value for 't1'. t2");
  });

  test('NotFoundError', () => {
    let e = new error.NotFoundError('t1');
    expect(e.message).toBe("Entry 't1' is not in registry.");
  });

  test('NullError', () => {
    let e = new error.NullError();
    expect(e.message).toBe('');

    e = new error.NullError('t1');
    expect(e.message).toBe('');
  });
});
