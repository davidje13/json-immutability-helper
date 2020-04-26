const { update } = require('../index');

describe('toggle', () => {
  it('operates on booleans', () => {
    expect(() => update(0, ['toggle']))
      .toThrow('/ toggle: expected target to be boolean');
  });

  it('takes no arguments', () => {
    expect(() => update(true, ['toggle', 'nope']))
      .toThrow('/ toggle: expected [command]');
  });

  it('inverts the value', () => {
    expect(update(true, ['toggle'])).toEqual(false);
    expect(update(false, ['toggle'])).toEqual(true);
  });

  it('rejects operations on unset values', () => {
    expect(() => update(undefined, ['toggle'])).toThrow();
  });

  it('has alias ~', () => {
    expect(update(true, ['~'])).toEqual(false);
    expect(update(false, ['~'])).toEqual(true);
  });
});
