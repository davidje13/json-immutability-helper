import defaultContext from '../src/index.mjs';

describe('with', () => {
  it('scopes command mutations', () => {
    const context1 = defaultContext.with({ commands: { foo: () => true } });
    const context2 = defaultContext.with();

    const spec = ['foo'];
    expect(() => context1.update({}, spec)).resolves();
    expect(() => context2.update({}, spec)).throws();
  });

  it('scopes command mutations from the global update', () => {
    const context = defaultContext.with({ commands: { foo: () => true } });

    const spec = ['foo'];
    expect(() => context.update({}, spec)).resolves();
    expect(() => defaultContext.update({}, spec)).throws();
  });

  it('scopes condition mutations', () => {
    const context1 = defaultContext.with({
      conditions: {
        scopedMultiple: (c) => (v) => v % c === 0,
      },
    });
    const context2 = defaultContext.with();

    const spec = ['if', ['scopedMultiple', 3], ['=', 1]];
    expect(() => context1.update(9, spec)).resolves();
    expect(() => context2.update(9, spec)).throws();
  });

  it('scopes condition mutations from the global update', () => {
    const context = defaultContext.with({
      conditions: {
        scopedMultiple: (c) => (v) => v % c === 0,
      },
    });

    const spec = ['if', ['scopedMultiple', 3], ['=', 1]];
    expect(() => context.update(9, spec)).resolves();
    expect(() => defaultContext.update(9, spec)).throws();
  });
});
