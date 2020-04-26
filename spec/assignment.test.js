const update = require('../index');

const { UNSET_TOKEN } = update;

describe('set', () => {
  it('takes 1 argument', () => {
    expect(() => update(1, ['set']))
      .toThrow('/ set: expected [command, value]');
  });

  it('replaces the value', () => {
    const updated = update('a', ['set', 'b']);

    expect(updated).toEqual('b');
  });

  it('creates new properties', () => {
    const initial = { foo: '1' };
    const updated = update(initial, { bar: ['set', '2'] });

    expect(updated).toEqual({ foo: '1', bar: '2' });
    expect(updated).not.toBe(initial);
  });

  it('does nothing if the new value is unchanged', () => {
    const initial = { foo: '1' };
    const updated = update(initial, { foo: ['set', '1'] });

    expect(updated).toBe(initial);
  });

  it('rejects attempts to navigate through non-existant properties', () => {
    expect(() => update({ foo: '1' }, { foo: { bar: ['set', '1'] } }))
      .toThrow('/foo: target must be an object or array');
  });

  it('has alias =', () => {
    const updated = update('a', ['=', 'b']);

    expect(updated).toEqual('b');
  });
});

describe('set undefined', () => {
  it('replaces the value with undefined', () => {
    const initial = { foo: '1', bar: '2' };
    const updated = update(initial, { bar: ['set', undefined] });

    expect(updated).toEqual({ foo: '1', bar: undefined });
    expect(updated).toHaveProperty('bar');
  });

  it('creates new properties', () => {
    const initial = { foo: '1' };
    const updated = update(initial, { bar: ['set', undefined] });

    expect(updated).toEqual({ foo: '1', bar: undefined });
    expect(updated).toHaveProperty('bar');
  });

  it('does nothing if the new value is unchanged', () => {
    const initial = { foo: undefined };
    const updated = update(initial, { foo: ['set', undefined] });

    expect(updated).toBe(initial);
  });
});

describe('set UNSET_TOKEN', () => {
  it('removes the property', () => {
    const initial = { foo: '1', bar: '2' };
    const updated = update(initial, { bar: ['set', UNSET_TOKEN] });

    expect(updated).toEqual({ foo: '1' });
    expect(updated).not.toHaveProperty('bar');
  });

  it('repacks arrays', () => {
    const initial = [1, 2, 3, 4, 5, 6];
    const updated = update(initial, { 2: ['set', UNSET_TOKEN] });

    expect(updated).toEqual([1, 2, 4, 5, 6]);
  });

  it('removes undefined properties', () => {
    const initial = { foo: '1', bar: undefined };
    const updated = update(initial, { bar: ['set', UNSET_TOKEN] });

    expect(updated).toEqual({ foo: '1' });
    expect(updated).not.toHaveProperty('bar');
  });

  it('does nothing if a missing value is removed', () => {
    const initial = { foo: '1' };
    const updated = update(initial, { bar: ['set', UNSET_TOKEN] });

    expect(updated).toBe(initial);
  });

  it('returns undefined if the root value is removed', () => {
    const updated = update(1, ['set', UNSET_TOKEN]);

    expect(updated).toEqual(undefined);
  });

  it('returns UNSET_TOKEN if the allowUnset is specified', () => {
    const updated = update(1, ['set', UNSET_TOKEN], { allowUnset: true });

    expect(updated).toBe(UNSET_TOKEN);
  });
});

describe('unset', () => {
  it('takes no arguments', () => {
    expect(() => update(1, ['unset', 'nope']))
      .toThrow('/ unset: expected [command]');
  });

  it('removes the property', () => {
    const initial = { foo: '1', bar: '2' };
    const updated = update(initial, { bar: ['unset'] });

    expect(updated).toEqual({ foo: '1' });
    expect(updated).not.toHaveProperty('bar');
  });

  it('repacks arrays', () => {
    const initial = [1, 2, 3, 4, 5, 6];
    const updated = update(initial, { 2: ['unset'] });

    expect(updated).toEqual([1, 2, 4, 5, 6]);
  });

  it('repacks arrays when multiple elements are removed', () => {
    const initial = [1, 2, 3, 4, 5, 6, 7, 8];
    const updated = update(initial, {
      1: ['unset'],
      5: ['unset'],
      3: ['unset'],
    });

    expect(updated).toEqual([1, 3, 5, 7, 8]);
  });

  it('removes undefined properties', () => {
    const initial = { foo: '1', bar: undefined };
    const updated = update(initial, { bar: ['unset'] });

    expect(updated).toEqual({ foo: '1' });
    expect(updated).not.toHaveProperty('bar');
  });

  it('does nothing if a missing value is removed', () => {
    const initial = { foo: '1' };
    const updated = update(initial, { bar: ['unset'] });

    expect(updated).toBe(initial);
  });

  it('returns undefined if the root value is removed', () => {
    const updated = update(1, ['unset']);

    expect(updated).toEqual(undefined);
  });

  it('returns UNSET_TOKEN if the allowUnset is specified', () => {
    const updated = update(1, ['unset'], { allowUnset: true });

    expect(updated).toBe(UNSET_TOKEN);
  });
});
