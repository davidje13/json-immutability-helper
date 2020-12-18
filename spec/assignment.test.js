const { update, UNSET_TOKEN } = require('../index');

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

  it('sets indices in arrays', () => {
    const initial = ['a', 'b', 'c'];
    const updated = update(initial, { '1': ['set', 'B'] });

    expect(updated).toEqual(['a', 'B', 'c']);
    expect(updated).not.toBe(initial);
  });

  it('rejects indices beyond the end of the array', () => {
    const initial = ['a', 'b', 'c'];
    expect(() => update(initial, { '3': ['set', '1'] }))
      .toThrow('cannot modify array property 3');
  });

  it('rejects negative indices', () => {
    const initial = ['a', 'b', 'c'];
    expect(() => update(initial, { '-1': ['set', '1'] }))
      .toThrow('cannot modify array property -1');
  });

  it('rejects attempts to add properties to arrays', () => {
    const initial = ['a', 'b', 'c'];
    expect(() => update(initial, { foo: ['set', '1'] }))
      .toThrow('cannot modify array property foo');
  });

  it('rejects attempts to modify array length directly', () => {
    const initial = ['a', 'b', 'c'];
    expect(() => update(initial, { length: ['set', 1] }))
      .toThrow('cannot modify array property length');
  });

  it('rejects attempts to modify non-objects', () => {
    const initial = 'a';
    expect(() => update(initial, { foo: ['set', '1'] }))
      .toThrow('target must be an object or array');
  });

  it('sets __proto__ as a literal value', () => {
    // JSON.parse is an easy way to get literal __proto__ properties
    const spec = JSON.parse('{ "__proto__": ["set", { "foo": 1 }] }');
    const updated = update({}, spec);

    /* eslint-disable-next-line no-proto */
    expect(updated.__proto__.foo).toEqual(1);
    expect(updated.foo).toBeUndefined();
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

  it('sets indices in arrays', () => {
    const initial = ['a', 'b', 'c'];
    const updated = update(initial, { '1': ['set', undefined] });

    expect(updated).toEqual(['a', undefined, 'c']);
    expect(updated).not.toBe(initial);
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

  it('rejects attempts to remove properties from arrays', () => {
    const initial = ['a', 'b', 'c'];
    expect(() => update(initial, { foo: ['set', UNSET_TOKEN] }))
      .toThrow('cannot modify array property foo');
  });

  it('rejects attempts to remove array length', () => {
    const initial = ['a', 'b', 'c'];
    expect(() => update(initial, { length: ['set', UNSET_TOKEN] }))
      .toThrow('cannot modify array property length');
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

describe('init', () => {
  it('takes 1 argument', () => {
    expect(() => update(1, ['init']))
      .toThrow('/ init: expected [command, value]');
  });

  it('initialises the value if undefined', () => {
    const updated = update(undefined, ['init', 'b']);

    expect(updated).toEqual('b');
  });

  it('does nothing if the value is already set', () => {
    const updated = update('a', ['init', 'b']);

    expect(updated).toEqual('a');
  });
});
