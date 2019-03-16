const update = require('../index');

describe('$add', () => {
  it('applies summation', () => {
    const updatedState = update(8, {
      $add: 2,
    });

    expect(updatedState).toEqual(10);
  });
});

describe('$subtract', () => {
  it('applies subtraction', () => {
    const updatedState = update(8, {
      $subtract: 2,
    });

    expect(updatedState).toEqual(6);
  });
});

describe('$multiply', () => {
  it('applies multiplication', () => {
    const updatedState = update(8, {
      $multiply: 2,
    });

    expect(updatedState).toEqual(16);
  });
});

describe('$divide', () => {
  it('applies division', () => {
    const updatedState = update(8, {
      $divide: 2,
    });

    expect(updatedState).toEqual(4);
  });
});

describe('$reciprocal', () => {
  it('applies reversed division', () => {
    const updatedState = update(8, {
      $reciprocal: 2,
    });

    expect(updatedState).toEqual(0.25);
  });
});
