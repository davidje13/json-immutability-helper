import { update } from '../src/index.mjs';

describe('toggle', () => {
  it('operates on booleans', () => {
    expect(() => update(0, ['~'])).throws('/ ~: expected target to be boolean');
  });

  it('takes no arguments', () => {
    expect(() => update(true, ['~', 'nope'])).throws('/ ~: expected [command]');
  });

  it('inverts the value', () => {
    expect(update(true, ['~'])).equals(false);
    expect(update(false, ['~'])).equals(true);
  });

  it('rejects operations on unset values', () => {
    expect(() => update(undefined, ['~'])).throws('expected target to be boolean');
  });
});
