const { update, UNSET_TOKEN } = require('../index');

describe('set', () => {
  it('takes 1 argument', () => {
    expect(() => update(1, ['set'])).throws('/ set: expected [command, value]');
  });

  it('replaces the value', () => {
    const updated = update('a', ['set', 'b']);

    expect(updated).equals('b');
  });

  it('creates new properties', () => {
    const initial = { foo: '1' };
    const updated = update(initial, { bar: ['set', '2'] });

    expect(updated).equals({ foo: '1', bar: '2' });
    expect(updated).not(same(initial));
  });

  it('sets indices in arrays', () => {
    const initial = ['a', 'b', 'c'];
    const updated = update(initial, { 1: ['set', 'B'] });

    expect(updated).equals(['a', 'B', 'c']);
    expect(updated).not(same(initial));
  });

  it('rejects indices beyond the end of the array', () => {
    const initial = ['a', 'b', 'c'];
    expect(() => update(initial, { 3: ['set', '1'] })).throws('cannot modify array property 3');
  });

  it('rejects negative indices', () => {
    const initial = ['a', 'b', 'c'];
    expect(() => update(initial, { '-1': ['set', '1'] })).throws('cannot modify array property -1');
  });

  it('rejects attempts to add properties to arrays', () => {
    const initial = ['a', 'b', 'c'];
    expect(() => update(initial, { foo: ['set', '1'] })).throws('cannot modify array property foo');
  });

  it('rejects attempts to modify array length directly', () => {
    const initial = ['a', 'b', 'c'];
    expect(() => update(initial, { length: ['set', 1] })).throws(
      'cannot modify array property length',
    );
  });

  it('rejects attempts to modify non-objects', () => {
    const initial = 'a';
    expect(() => update(initial, { foo: ['set', '1'] })).throws(
      'target must be an object or array',
    );
  });

  it('sets __proto__ as a literal value', () => {
    // JSON.parse is an easy way to get literal __proto__ properties
    const spec = JSON.parse('{ "__proto__": ["set", { "foo": 1 }] }');
    const updated = update({}, spec);

    /* eslint-disable-next-line no-proto */
    expect(updated.__proto__.foo).equals(1);
    expect(updated.foo).isUndefined();
  });

  it('does nothing if the new value is unchanged', () => {
    const initial = { foo: '1' };
    const updated = update(initial, { foo: ['set', '1'] });

    expect(updated).same(initial);
  });

  it('rejects attempts to navigate through non-existant properties', () => {
    expect(() => update({ foo: '1' }, { foo: { bar: ['set', '1'] } })).throws(
      '/foo: target must be an object or array',
    );
  });

  it('has alias =', () => {
    const updated = update('a', ['=', 'b']);

    expect(updated).equals('b');
  });
});

describe('set undefined', () => {
  it('replaces the value with undefined', () => {
    const initial = { foo: '1', bar: '2' };
    const updated = update(initial, { bar: ['set', undefined] });

    expect(updated).equals({ foo: '1', bar: undefined });
    expect(updated).hasProperty('bar');
  });

  it('creates new properties', () => {
    const initial = { foo: '1' };
    const updated = update(initial, { bar: ['set', undefined] });

    expect(updated).equals({ foo: '1', bar: undefined });
    expect(updated).hasProperty('bar');
  });

  it('sets indices in arrays', () => {
    const initial = ['a', 'b', 'c'];
    const updated = update(initial, { 1: ['set', undefined] });

    expect(updated).equals(['a', undefined, 'c']);
    expect(updated).not(same(initial));
  });

  it('does nothing if the new value is unchanged', () => {
    const initial = { foo: undefined };
    const updated = update(initial, { foo: ['set', undefined] });

    expect(updated).same(initial);
  });
});

describe('set UNSET_TOKEN', () => {
  it('removes the property', () => {
    const initial = { foo: '1', bar: '2' };
    const updated = update(initial, { bar: ['set', UNSET_TOKEN] });

    expect(updated).equals({ foo: '1' });
    expect(updated).not(hasProperty('bar'));
  });

  it('repacks arrays', () => {
    const initial = [1, 2, 3, 4, 5, 6];
    const updated = update(initial, { 2: ['set', UNSET_TOKEN] });

    expect(updated).equals([1, 2, 4, 5, 6]);
  });

  it('removes undefined properties', () => {
    const initial = { foo: '1', bar: undefined };
    const updated = update(initial, { bar: ['set', UNSET_TOKEN] });

    expect(updated).equals({ foo: '1' });
    expect(updated).not(hasProperty('bar'));
  });

  it('rejects attempts to remove properties from arrays', () => {
    const initial = ['a', 'b', 'c'];
    expect(() => update(initial, { foo: ['set', UNSET_TOKEN] })).throws(
      'cannot modify array property foo',
    );
  });

  it('rejects attempts to remove array length', () => {
    const initial = ['a', 'b', 'c'];
    expect(() => update(initial, { length: ['set', UNSET_TOKEN] })).throws(
      'cannot modify array property length',
    );
  });

  it('does nothing if a missing value is removed', () => {
    const initial = { foo: '1' };
    const updated = update(initial, { bar: ['set', UNSET_TOKEN] });

    expect(updated).same(initial);
  });

  it('returns undefined if the root value is removed', () => {
    const updated = update(1, ['set', UNSET_TOKEN]);

    expect(updated).equals(undefined);
  });

  it('returns UNSET_TOKEN if the allowUnset is specified', () => {
    const updated = update(1, ['set', UNSET_TOKEN], { allowUnset: true });

    expect(updated).same(UNSET_TOKEN);
  });
});

describe('unset', () => {
  it('takes no arguments', () => {
    expect(() => update(1, ['unset', 'nope'])).throws('/ unset: expected [command]');
  });

  it('removes the property', () => {
    const initial = { foo: '1', bar: '2' };
    const updated = update(initial, { bar: ['unset'] });

    expect(updated).equals({ foo: '1' });
    expect(updated).not(hasProperty('bar'));
  });

  it('repacks arrays', () => {
    const initial = [1, 2, 3, 4, 5, 6];
    const updated = update(initial, { 2: ['unset'] });

    expect(updated).equals([1, 2, 4, 5, 6]);
  });

  it('repacks arrays when multiple elements are removed', () => {
    const initial = [1, 2, 3, 4, 5, 6, 7, 8];
    const updated = update(initial, {
      1: ['unset'],
      5: ['unset'],
      3: ['unset'],
    });

    expect(updated).equals([1, 3, 5, 7, 8]);
  });

  it('removes undefined properties', () => {
    const initial = { foo: '1', bar: undefined };
    const updated = update(initial, { bar: ['unset'] });

    expect(updated).equals({ foo: '1' });
    expect(updated).not(hasProperty('bar'));
  });

  it('does nothing if a missing value is removed', () => {
    const initial = { foo: '1' };
    const updated = update(initial, { bar: ['unset'] });

    expect(updated).same(initial);
  });

  it('returns undefined if the root value is removed', () => {
    const updated = update(1, ['unset']);

    expect(updated).equals(undefined);
  });

  it('returns UNSET_TOKEN if the allowUnset is specified', () => {
    const updated = update(1, ['unset'], { allowUnset: true });

    expect(updated).same(UNSET_TOKEN);
  });
});

describe('init', () => {
  it('takes 1 argument', () => {
    expect(() => update(1, ['init'])).throws('/ init: expected [command, value]');
  });

  it('initialises the value if undefined', () => {
    const updated = update(undefined, ['init', 'b']);

    expect(updated).equals('b');
  });

  it('does nothing if the value is already set', () => {
    const updated = update('a', ['init', 'b']);

    expect(updated).equals('a');
  });
});
