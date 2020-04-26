const { update } = require('../index');

const initial = { foo: '1', bar: '2' };

describe('unknown command', () => {
  it('throws an error', () => {
    expect(() => update(0, ['nope']))
      .toThrow('/ nope: unknown command');
  });

  it('includes the path to the command', () => {
    expect(() => update({ a: { b: 1 } }, { a: { b: ['nope'] } }))
      .toThrow('/a/b nope: unknown command');
  });
});

describe('merge', () => {
  it('operates on objects', () => {
    expect(() => update(0, ['merge', {}]))
      .toThrow('/ merge: expected target to be object');
  });

  it('takes an object to merge', () => {
    expect(() => update({}, ['merge']))
      .toThrow('/ merge: expected [command, object]');
  });

  it('adds new values', () => {
    const updated = update(initial, ['merge', { abc: '3', def: '4' }]);

    expect(updated).toEqual({ foo: '1', bar: '2', abc: '3', def: '4' });
    expect(updated).not.toBe(initial);
  });

  it('replaces existing values', () => {
    const updated = update(initial, ['merge', { bar: '3' }]);

    expect(updated).toEqual({ foo: '1', bar: '3' });
    expect(updated).not.toBe(initial);
  });

  it('removes values if set to UNSET_TOKEN', () => {
    const updated = update(initial, ['merge', { bar: update.UNSET_TOKEN }]);

    expect(updated).toEqual({ foo: '1' });
    expect(updated).not.toBe(initial);
  });
});
