import listCommands from '../src/commands/list.mjs';
import context from '../src/index.mjs';
const { update } = context.with(listCommands);

const initial = [10, 9, 11, 9, -1];

describe('move', () => {
  it('operates on arrays', () => {
    expect(() => update(0, ['move', ['first', ['=', 10]], 'after', ['first', ['=', 11]]])).throws(
      '/ move: expected target to be array',
    );
  });

  it('moves the matching item', () => {
    const updated = update(initial, ['move', ['first', ['=', 10]], 'after', ['first', ['=', 11]]]);
    expect(updated).equals([9, 11, 10, 9, -1]);
    expect(updated).not(same(initial));
  });

  it('moves multiple items, preserving order', () => {
    const updated = update(initial, ['move', ['all', ['>', 9]], 'before', ['first', ['=', -1]]]);
    expect(updated).equals([9, 9, 10, 11, -1]);
    expect(updated).not(same(initial));
  });

  it('does nothing if the first locator matches nothing', () => {
    const updated = update(initial, ['move', ['first', ['=', 2]], 'after', ['first', ['=', 11]]]);
    expect(updated).equals([10, 9, 11, 9, -1]);
    expect(updated).same(initial);
  });

  it('does nothing if the second locator matches nothing', () => {
    const updated = update(initial, ['move', ['first', ['=', 10]], 'after', ['first', ['=', 2]]]);
    expect(updated).equals([10, 9, 11, 9, -1]);
    expect(updated).same(initial);
  });

  it('does nothing if both locators find the same entry', () => {
    const updated = update(initial, ['move', ['first', ['=', 11]], 'after', ['last', ['>', 10]]]);
    expect(updated).equals([10, 9, 11, 9, -1]);
    expect(updated).same(initial);
  });
});
