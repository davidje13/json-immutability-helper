const { update } = require('../index');

describe('catastrophic backtracking protection', () => {
  it('replaceAll ignores regular expression syntax', () => {
    const tm0 = Date.now();
    update(
      '.....................................',
      ['replaceAll', '(\\.*)*n', 'x']
    );
    const tm1 = Date.now();
    expect(tm1 - tm0).toBeLessThan(50);
  });
});

describe('"billion laughs" protection', () => {
  it('replaceAll prevents recursive growth', () => {
    const tm0 = Date.now();
    expect(() => update('.', [
      'seq',
      ['replaceAll', '.', '..........'],
      ['replaceAll', '.', '..........'],
      ['replaceAll', '.', '..........'],
      ['replaceAll', '.', '..........'],
      ['replaceAll', '.', '..........'],
    ])).toThrow('too much data');
    const tm1 = Date.now();
    expect(tm1 - tm0).toBeLessThan(50);
  });

  it('updateAll prevents recursive growth', () => {
    const tm0 = Date.now();
    /* eslint-disable array-bracket-newline, comma-spacing */
    expect(() => update([], ['seq', ['push', [],[],[],[],[],[],[],[],[],[]],
      ['updateAll', ['seq', ['push', [],[],[],[],[],[],[],[],[],[]],
        ['updateAll', ['seq', ['push', [],[],[],[],[],[],[],[],[],[]],
          ['updateAll', ['seq', ['push', [],[],[],[],[],[],[],[],[],[]],
            ['updateAll', ['seq', ['push', [],[],[],[],[],[],[],[],[],[]],
              ['updateAll', ['seq', ['push', [],[],[],[],[],[],[],[],[],[]],
              ]],
            ]],
          ]],
        ]],
      ]],
    ])).toThrow('too much recursion');
    /* eslint-enable array-bracket-newline, comma-spacing */
    const tm1 = Date.now();
    expect(tm1 - tm0).toBeLessThan(50);
  });

  it('updateAll/replaceAll combination', () => {
    const tm0 = Date.now();
    /* eslint-disable array-bracket-newline, comma-spacing */
    expect(() => update([], ['seq', ['push', [],[],[],[],[],[],[],[],[],[]],
      ['updateAll', ['seq', ['push', [],[],[],[],[],[],[],[],[],[]],
        ['updateAll', ['seq', ['push', '.','.','.','.','.','.','.','.','.','.'],
          ['updateAll', ['replaceAll', '.', '..........']],
          ['updateAll', ['replaceAll', '.', '..........']],
          ['updateAll', ['replaceAll', '.', '..........']],
        ]],
      ]],
    ])).toThrow('too much recursion');
    /* eslint-enable array-bracket-newline, comma-spacing */
    const tm1 = Date.now();
    expect(tm1 - tm0).toBeLessThan(50);
  });
});

describe('rpn', () => {
  it('rejects string operations by default', () => {
    expect(() => update(0, ['rpn', 2, 'String', 'Number'])).toThrow();
  });

  it('rejects string concatenation by default', () => {
    expect(() => update(0, ['rpn', '"2"', '"3"', '+', 'Number'])).toThrow();
  });
});
