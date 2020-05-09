const { Context } = require('../index');

describe('without enableRiskyStringOps', () => {
  const context = new Context();
  const { update } = context;

  it('rejects rpn string operations by default', () => {
    expect(() => update('', ['rpn', '"v"'])).toThrow();
    expect(() => update(0, ['rpn', 2, 'String', 'Number'])).toThrow();
    expect(() => update(0, ['rpn', '"2"', '"3"', '+', 'Number'])).toThrow();
    expect(() => update(0, ['rpn', '"0"', 10, 'padStart', 'Number'])).toThrow();
    expect(() => update(0, ['rpn', '"0"', 10, 'padEnd', 'Number'])).toThrow();
    expect(() => update(0, ['rpn', '"0"', 10, '^', 'Number'])).toThrow();
  });

  it('rejects replaceAll by default', () => {
    expect(() => update('.', ['replaceAll', 'a', 'A'])).toThrow();
  });
});

describe('with enableRiskyStringOps', () => {
  const context = new Context();
  context.enableRiskyStringOps();
  const { update } = context;

  it('allows rpn string operations', () => {
    expect(() => update('', ['rpn', '"v"'])).not.toThrow();
    expect(() => update(0, ['rpn', 2, 'String', 'Number'])).not.toThrow();
    expect(() => update(0, ['rpn', '"2"', '"3"', '+', 'Number'])).not.toThrow();
    expect(() => update(0, ['rpn', '"0"', 10, 'padStart', 'Number']))
      .not.toThrow();
    expect(() => update(0, ['rpn', '"0"', 10, 'padEnd', 'Number']))
      .not.toThrow();
    expect(() => update(0, ['rpn', '"0"', 10, '^', 'Number'])).not.toThrow();
  });

  it('blocks rpn operations which generate lots of data', () => {
    expect(() => update('.'.repeat(10000), ['rpn', 'x', 'x', '+'])).toThrow();

    expect(() => update('.', ['rpn', 'x', 20000, 'padStart'])).toThrow();
    expect(() => update('.', ['rpn', 'x', 20000, 'padEnd'])).toThrow();
    expect(() => update('.', ['rpn', 'x', 20000, '^'])).toThrow();
    expect(() => update('.'.repeat(100), ['rpn', 'x', 200, '^'])).toThrow();
  });

  it('ignores regular expression syntax in replaceAll', () => {
    // Catastrophic backtracking protection

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
  const context = new Context();
  context.enableRiskyStringOps();
  const { update } = context;

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
