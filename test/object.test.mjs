import { update } from '../src/index.mjs';

const initial = { foo: '1', bar: '2' };

describe('unknown command', () => {
  it('throws an error', () => {
    expect(() => update(0, ['nope'])).throws('/ nope: unknown command');
  });

  it('includes the path to the command', () => {
    expect(() => update({ a: { b: 1 } }, { a: { b: ['nope'] } })).throws(
      '/a/b nope: unknown command',
    );
  });
});

describe('merge', () => {
  it('operates on objects', () => {
    expect(() => update(0, ['merge', {}])).throws('/ merge: expected target to be object');
  });

  it('takes an object to merge', () => {
    expect(() => update({}, ['merge'])).throws('/ merge: expected [command, merge, initial?]');
  });

  it('adds new values', () => {
    const updated = update(initial, ['merge', { abc: '3', def: '4' }]);

    expect(updated).equals({ foo: '1', bar: '2', abc: '3', def: '4' });
    expect(updated).not(same(initial));
  });

  it('replaces existing values', () => {
    const updated = update(initial, ['merge', { bar: '3' }]);

    expect(updated).equals({ foo: '1', bar: '3' });
    expect(updated).not(same(initial));
  });

  it('sets indices in arrays', () => {
    const initArr = ['a', 'b', 'c', 'd'];
    const updated = update(initArr, ['merge', { 1: 'B', 2: 'C' }]);

    expect(updated).equals(['a', 'B', 'C', 'd']);
    expect(updated).not(same(initArr));
  });

  it('rejects attempts to add properties to arrays', () => {
    const initArr = ['a', 'b', 'c'];
    expect(() => update(initArr, ['merge', { foo: 1 }])).throws('cannot modify array property foo');
  });

  it('rejects attempts to modify array length directly', () => {
    const initArr = ['a', 'b', 'c'];
    expect(() => update(initArr, ['merge', { length: 1 }])).throws(
      'cannot modify array property length',
    );
  });

  it('sets __proto__ as a literal value', () => {
    // JSON.parse is an easy way to get literal __proto__ properties
    const spec = JSON.parse('["merge", { "__proto__": { "foo": 1 } }]');
    const updated = update({}, spec);

    /* eslint-disable-next-line no-proto */
    expect(updated.__proto__.foo).equals(1);
    expect(updated.foo).isUndefined();
  });

  it('makes no change if no value has changed', () => {
    const updated = update(initial, ['merge', { foo: '1' }]);

    expect(updated).equals({ foo: '1', bar: '2' });
    expect(updated).same(initial);
  });

  it('ignores values which are set to undefined', () => {
    const updated = update(initial, ['merge', { foo: undefined, abc: undefined }]);

    expect(updated).equals({ foo: '1', bar: '2' });
    expect(updated).same(initial);
  });

  it('removes values if set to UNSET_TOKEN', () => {
    const updated = update(initial, ['merge', { bar: update.UNSET_TOKEN }]);

    expect(updated).equals({ foo: '1' });
    expect(updated).not(same(initial));
  });

  it('ignores requests to unset values which are not set', () => {
    const updated = update(initial, ['merge', { nope: update.UNSET_TOKEN }]);

    expect(updated).same(initial);
  });

  it('repacks arrays after removing indices', () => {
    const initArr = ['a', 'b', 'c', 'd'];
    const updated = update(initArr, [
      'merge',
      {
        1: update.UNSET_TOKEN,
        2: update.UNSET_TOKEN,
      },
    ]);

    expect(updated).equals(['a', 'd']);
    expect(updated).not(same(initArr));
  });

  it('ignores the default if there is already a value', () => {
    const updated = update(initial, ['merge', { abc: '3' }, { nope: 'no' }]);

    expect(updated).equals({ foo: '1', bar: '2', abc: '3' });
  });

  it('uses the default if the value is undefined', () => {
    const updated = update(undefined, ['merge', { abc: '3' }, { init: 'yup' }]);

    expect(updated).equals({ init: 'yup', abc: '3' });
  });
});
