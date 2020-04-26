const update = require('../index');

const { Context } = update;

describe('Context', () => {
  it('scopes command mutations', () => {
    const context1 = new Context();
    const context2 = new Context();
    context1.extend('foo', () => true);

    const spec = ['foo'];
    expect(() => context1.update({}, spec)).not.toThrow();
    expect(() => context2.update({}, spec)).toThrow();
  });

  it('scopes command mutations from the global update', () => {
    const context = new Context();
    context.extend('foo', () => true);

    const spec = ['foo'];
    expect(() => context.update({}, spec)).not.toThrow();
    expect(() => update({}, spec)).toThrow();
  });

  it('scopes condition mutations', () => {
    const context1 = new Context();
    const context2 = new Context();
    context1.extendCondition('scopedMultiple', (c) => (v) => ((v % c) === 0));

    const spec = ['updateIf', {scopedMultiple: 3}, ['=', 1]];
    expect(() => context1.update(9, spec)).not.toThrow();
    expect(() => context2.update(9, spec)).toThrow();
  });

  it('scopes condition mutations from the global update', () => {
    const context = new Context();
    context.extendCondition('scopedMultiple', (c) => (v) => ((v % c) === 0));

    const spec = ['updateIf', {scopedMultiple: 3}, ['=', 1]];
    expect(() => context.update(9, spec)).not.toThrow();
    expect(() => update(9, spec)).toThrow();
  });
});
