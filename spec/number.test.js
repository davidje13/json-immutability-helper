const { update } = require('../index');

describe('add', () => {
  it('operates on numbers', () => {
    expect(() => update('', ['add', 1]))
      .toThrow('/ add: expected target to be number');
  });

  it('takes an addend', () => {
    expect(() => update(0, ['add']))
      .toThrow('/ add: expected [command, number]');
  });

  it('applies summation', () => {
    const updated = update(8, ['add', 2]);

    expect(updated).toEqual(10);
  });

  it('has alias +', () => {
    const updated = update(8, ['+', 2]);

    expect(updated).toEqual(10);
  });
});

describe('subtract', () => {
  it('operates on numbers', () => {
    expect(() => update('', ['subtract', 1]))
      .toThrow('/ subtract: expected target to be number');
  });

  it('takes a subtrahend', () => {
    expect(() => update(0, ['subtract']))
      .toThrow('/ subtract: expected [command, number]');
  });

  it('applies subtraction', () => {
    const updated = update(8, ['subtract', 2]);

    expect(updated).toEqual(6);
  });

  it('has alias -', () => {
    const updated = update(8, ['-', 2]);

    expect(updated).toEqual(6);
  });
});

describe('multiply', () => {
  it('operates on numbers', () => {
    expect(() => update('', ['multiply', 1]))
      .toThrow('/ multiply: expected target to be number');
  });

  it('takes a multiplier', () => {
    expect(() => update(0, ['multiply']))
      .toThrow('/ multiply: expected [command, number]');
  });

  it('applies multiplication', () => {
    const updated = update(8, ['multiply', 2]);

    expect(updated).toEqual(16);
  });

  it('has alias *', () => {
    const updated = update(8, ['*', 2]);

    expect(updated).toEqual(16);
  });
});

describe('divide', () => {
  it('operates on numbers', () => {
    expect(() => update('', ['divide', 1]))
      .toThrow('/ divide: expected target to be number');
  });

  it('takes a divisor', () => {
    expect(() => update(0, ['divide']))
      .toThrow('/ divide: expected [command, number]');
  });

  it('applies division', () => {
    const updated = update(8, ['divide', 2]);

    expect(updated).toEqual(4);
  });

  it('returns infinity for division by zero', () => {
    const updated = update(8, ['divide', 0]);

    expect(updated).toEqual(Number.POSITIVE_INFINITY);
  });

  it('has alias /', () => {
    const updated = update(8, ['/', 2]);

    expect(updated).toEqual(4);
  });
});

describe('reciprocal', () => {
  it('operates on numbers', () => {
    expect(() => update('', ['reciprocal', 1]))
      .toThrow('/ reciprocal: expected target to be number');
  });

  it('takes a dividend', () => {
    expect(() => update(0, ['reciprocal']))
      .toThrow('/ reciprocal: expected [command, number]');
  });

  it('applies reversed division', () => {
    const updated = update(8, ['reciprocal', 2]);

    expect(updated).toEqual(0.25);
  });

  it('returns infinity for division by zero', () => {
    const updated = update(0, ['reciprocal', 2]);

    expect(updated).toEqual(Number.POSITIVE_INFINITY);
  });
});
