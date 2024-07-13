import { update } from '../src/index.mjs';

describe('toggle', () => {
  it('operates on booleans', () => {
    expect(() => update(0, ['toggle'])).throws('/ toggle: expected target to be boolean');
  });

  it('takes no arguments', () => {
    expect(() => update(true, ['toggle', 'nope'])).throws('/ toggle: expected [command]');
  });

  it('inverts the value', () => {
    expect(update(true, ['toggle'])).equals(false);
    expect(update(false, ['toggle'])).equals(true);
  });

  it('rejects operations on unset values', () => {
    expect(() => update(undefined, ['toggle'])).throws('expected target to be boolean');
  });

  it('has alias ~', () => {
    expect(update(true, ['~'])).equals(false);
    expect(update(false, ['~'])).equals(true);
  });
});
