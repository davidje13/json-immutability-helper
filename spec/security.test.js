const { Context, UNSET_TOKEN } = require('../index');

const ATTACK_TARGETS = [
  { type: Object, factory: () => ({}) },
  { type: Array, factory: () => [] },
  { type: String, factory: () => '' },
  { type: Number, factory: () => 0 },
  { type: BigInt, factory: () => BigInt(0) },
  { type: Boolean, factory: () => false },
  { type: Function, factory: () => function() { /* Nothing */ } },
  { type: Symbol, factory: () => Symbol('x') },
  { type: Date, factory: () => new Date() },
];

const NULL_TARGET = { type: null, factory: () => null };
const UNDEFINED_TARGET = { type: undefined, factory: () => undefined };

const json = JSON.stringify;

function jsonCommand(value) {
  if (value === UNSET_TOKEN) {
    return '["unset"]';
  } else {
    return json(['set', value]);
  }
}

const PROTOTYPE_ATTACKS = [
  {
    name: 'set as regular property',
    attack: (key, v) => `{${json(key)}:${jsonCommand(v)}}`,
  },
  {
    name: 'set inside __proto__',
    attack: (key, v) => `{"__proto__":{${json(key)}:${jsonCommand(v)}}}`,
  },
  {
    name: 'set __proto__',
    attack: (key, v) => `{"__proto__":["set",${json({ [key]: v })}]}`,
  },
  {
    name: 'set outside __proto__',
    attack: (key, v) => `["set",{"__proto__":${json({ [key]: v })}}]`,
  },
  {
    name: 'merge as regular property',
    attack: (key, v) => `["merge",${json({ [key]: v })}]`,
  },
  {
    name: 'merge inside __proto__',
    attack: (key, v) => `{"__proto__":["merge",${json({ [key]: v })}]}`,
  },
  {
    name: 'merge outside __proto__',
    attack: (key, v) => `["merge",{"__proto__":${json({ [key]: v })}}]`,
  },
];

describe('global prototype pollution protection', () => {
  const context = new Context();
  const { update } = context;

  PROTOTYPE_ATTACKS.forEach((test) => describe(`update: ${test.name}`, () => {
    /* eslint-disable no-proto */

    function runAttack(target) {
      const input = target.factory();
      const spec = JSON.parse(test.attack('injected', 'gotchya'));
      try {
        update(input, spec);
      } catch (ignore) {
        // Throwing is OK
      }
    }

    ATTACK_TARGETS.forEach((target) => {
      it(`does not pollute the ${target.type.name} prototype`, () => {
        runAttack(target);

        expect(target.type.__proto__.injected).toBeUndefined();
        expect(target.type.injected).toBeUndefined();
        expect(target.factory().__proto__.injected).toBeUndefined();
        expect(target.factory().injected).toBeUndefined();
        expect(global.injected).toBeUndefined();
      });
    });

    it('does not pollute the null or undefined prototype', () => {
      runAttack(NULL_TARGET);
      runAttack(UNDEFINED_TARGET);

      expect(() => null.__proto__).toThrow();
      expect(() => null.injected).toThrow();
      expect(() => undefined.__proto__).toThrow();
      expect(() => undefined.injected).toThrow();
    });

    afterEach(() => {
      // Do not allow failures to leak to other tests
      ATTACK_TARGETS.forEach((target) => {
        delete target.type.__proto__.injected;
        delete target.type.prototype.injected;
      });
    });

    /* eslint-enable no-proto */
  }));
});

describe('local prototype pollution protection', () => {
  const context = new Context();
  const { update } = context;

  PROTOTYPE_ATTACKS.forEach((test) => describe(`update: ${test.name}`, () => {
    it('does not pollute the local prototype of arrays', () => {
      const spec = JSON.parse(test.attack('push', 'gotchya'));
      let updated = [];
      try {
        updated = update([], spec);
      } catch (ignore) {
        // Throwing is OK
      }
      expect(typeof updated.push).not.toEqual('string');
    });

    it('does not pollute the local prototype of objects', () => {
      const spec = JSON.parse(test.attack('hasOwnProperty', 'gotchya'));
      const updated = update({}, spec);
      delete updated.hasOwnProperty; // OK if set as literal property
      expect(typeof updated.hasOwnProperty).toEqual('function');
      expect(updated.hasOwnProperty).toBe(Object.prototype.hasOwnProperty);
    });

    it('does not pollute the local prototype of objects by unsetting', () => {
      const spec = JSON.parse(test.attack('hasOwnProperty', UNSET_TOKEN));
      const updated = update({}, spec);
      expect(typeof updated.hasOwnProperty).toEqual('function');
      expect(updated.hasOwnProperty).toBe(Object.prototype.hasOwnProperty);
    });
  }));
});

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
