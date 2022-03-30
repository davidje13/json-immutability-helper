const listCommands = require('../commands/list');
const mathCommands = require('../commands/math');
const stringCommands = require('../commands/string');
const { context, UNSET_TOKEN } = require('../index');

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

function command(value) {
  if (value === UNSET_TOKEN) {
    return ['unset'];
  } else {
    return ['set', value];
  }
}

const PROTOTYPE_ATTACKS = [
  {
    name: 'set as regular property',
    attack: (key, v) => json({ [key]: command(v) }),
  },
  {
    name: 'set inside __proto__',
    attack: (key, v) => `{"__proto__":${json({ [key]: command(v) })}}`,
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
    name: 'set constructor.prototype',
    attack: (key, v) => json({
      constructor: ['set', { prototype: { [key]: v } }],
    }),
  },
  {
    name: 'set outside constructor.prototype',
    attack: (key, v) => json(['set', {
      constructor: { prototype: { [key]: v } },
    }]),
  },
  {
    name: 'merge as regular property',
    attack: (key, v) => `["merge",${json({ [key]: v })}]`,
  },
  {
    name: 'merge inside __proto__',
    attack: (key, v) => `{"__proto__":["merge",${json({ [key]: v })},{}]}`,
  },
  {
    name: 'merge outside __proto__',
    attack: (key, v) => `["merge",{"__proto__":${json({ [key]: v })}}]`,
  },
];

/* eslint-disable no-proto */
describe('global prototype pollution protection', () => {
  const { update } = context;

  PROTOTYPE_ATTACKS.forEach((test) => describe(`update: ${test.name}`, () => {
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

        expect(target.type.__proto__.injected).isUndefined();
        expect(target.type.injected).isUndefined();
        expect(target.factory().__proto__.injected).isUndefined();
        expect(target.factory().injected).isUndefined();
        expect(global.injected).isUndefined();
      });
    });

    it('does not pollute the null or undefined prototype', () => {
      runAttack(NULL_TARGET);
      runAttack(UNDEFINED_TARGET);

      expect(() => null.__proto__).throws();
      expect(() => null.injected).throws();
      expect(() => undefined.__proto__).throws();
      expect(() => undefined.injected).throws();
    });
  }));

  it('does not pollute the Object prototype from combineSpecs', () => {
    context.combine([
      {},
      JSON.parse('{"__proto__": {"injected": "gotchya"}}'),
      JSON.parse('{"constructor": {"prototype": {"injected": "gotchya"}}}'),
      JSON.parse('{"constructor": {"__proto__": {"injected": "gotchya"}}}'),
    ]);

    expect(Object.__proto__.injected).isUndefined();
    expect(Object.injected).isUndefined();
    expect(({}).__proto__.injected).isUndefined();
    expect(({}).injected).isUndefined();
    expect(global.injected).isUndefined();
  });

  afterEach(() => {
    // Do not allow failures to leak to other tests
    ATTACK_TARGETS.forEach((target) => {
      delete target.type.__proto__.injected;
      delete target.type.prototype.injected;
    });
  });
});

describe('local prototype pollution protection', () => {
  const { update } = context;

  function updateOrThrow(initial, spec) {
    try {
      return update(initial, spec);
    } catch (ignore) {
      return {}; // Throwing is OK
    }
  }

  PROTOTYPE_ATTACKS.forEach((test) => describe(`update: ${test.name}`, () => {
    it('does not pollute the local prototype of arrays', () => {
      const spec = JSON.parse(test.attack('push', 'gotchya'));
      const updated = updateOrThrow([], spec);
      expect(typeof updated.push).not(equals('string'));
    });

    it('does not pollute the local prototype of objects', () => {
      const spec = JSON.parse(test.attack('hasOwnProperty', 'gotchya'));
      const updated = updateOrThrow({}, spec);
      delete updated.hasOwnProperty; // OK if set as literal property
      expect(typeof updated.hasOwnProperty).equals('function');
      expect(updated.hasOwnProperty).same(Object.prototype.hasOwnProperty);
    });

    it('does not pollute the local prototype of objects by unsetting', () => {
      const spec = JSON.parse(test.attack('hasOwnProperty', UNSET_TOKEN));
      const updated = updateOrThrow({}, spec);
      expect(typeof updated.hasOwnProperty).equals('function');
      expect(updated.hasOwnProperty).same(Object.prototype.hasOwnProperty);
    });

    it('does not convert existing __proto__ fields into a property', () => {
      const spec = JSON.parse(test.attack('injected', 'meh'));
      const updated = updateOrThrow({ __proto__: { original: 'oops' } }, spec);
      expect(updated.__proto__.original).isUndefined();
    });
  }));

  it('does not pollute the output prototype from combineSpecs', () => {
    const result = context.combine([
      {},
      JSON.parse('{"__proto__": {"injected": "gotchya"}}'),
    ]);

    expect(result.injected).isUndefined();
  });

  afterEach(() => {
    // Do not allow failures to leak to other tests
    ATTACK_TARGETS.forEach((target) => {
      delete target.type.__proto__.injected;
      delete target.type.prototype.injected;
    });
  });
});
/* eslint-enable no-proto */

describe('condition code injection attacks', () => {
  const { update } = context;

  it('does not execute arbitrary functions', () => {
    expect(() => update({}, ['updateIf', { 'hasOwnProperty': 1 }, ['unset']]))
      .throws('unknown condition type: hasOwnProperty');
  });
});

describe('RPN code injection attacks', () => {
  const { update } = context.with(mathCommands, stringCommands);

  it('does not execute arbitrary functions', () => {
    expect(() => update(0, ['rpn', 0, '__proto__']))
      .throws('unknown function __proto__');

    expect(() => update(0, ['rpn', 0, 'constructor']))
      .throws('unknown function constructor');

    expect(() => update(0, ['rpn', 0, 'hasOwnProperty']))
      .throws('unknown function hasOwnProperty');
  });
});

describe('without string commands', () => {
  const { update } = context.with(mathCommands);

  it('rejects rpn string operations by default', () => {
    expect(() => update(0, ['rpn', 2, 'String', 'Number']))
      .throws('unknown function String');

    expect(() => update(0, ['rpn', '"0"', 10, 'padStart', 'Number']))
      .throws('unknown function padStart');

    expect(() => update(0, ['rpn', '"0"', 10, 'padEnd', 'Number']))
      .throws('unknown function padEnd');
  });

  it('rejects replaceAll by default', () => {
    expect(() => update('.', ['replaceAll', 'a', 'A']))
      .throws('replaceAll: unknown command');
  });
});

describe('with string commands', () => {
  const { update } = context.with(mathCommands, stringCommands);

  it('allows rpn string operations', () => {
    expect(() => update('', ['rpn', '"v"'])).resolves();
    expect(() => update(0, ['rpn', 2, 'String', 'Number'])).resolves();
    expect(() => update(0, ['rpn', '"2"', '"3"', 'concat', 'Number']))
      .resolves();
    expect(() => update(0, ['rpn', '"0"', 10, 'padStart', 'Number']))
      .resolves();
    expect(() => update(0, ['rpn', '"0"', 10, 'padEnd', 'Number']))
      .resolves();
    expect(() => update(0, ['rpn', '"0"', 10, 'repeat', 'Number']))
      .resolves();
  });

  it('blocks rpn operations which generate lots of data', () => {
    expect(() => update('.'.repeat(10000), ['rpn', 'x', 'x', 'concat']))
      .throws('string concatenation too long');

    expect(() => update('.', ['rpn', 'x', 20000, 'padStart']))
      .throws('unsupported padding length 20000');

    expect(() => update('.', ['rpn', 'x', 20000, 'padEnd']))
      .throws('unsupported padding length 20000');

    expect(() => update('.', ['rpn', 'x', 20000, 'repeat']))
      .throws('unsupported repeat count 20000');

    expect(() => update('.'.repeat(100), ['rpn', 'x', 200, 'repeat']))
      .throws('unsupported repeat count 200');
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
  const { update } = context.with(listCommands, mathCommands, stringCommands);

  it('replaceAll prevents recursive growth', () => {
    const tm0 = Date.now();
    expect(() => update('.', [
      'seq',
      ['replaceAll', '.', '..........'],
      ['replaceAll', '.', '..........'],
      ['replaceAll', '.', '..........'],
      ['replaceAll', '.', '..........'],
      ['replaceAll', '.', '..........'],
    ])).throws('too much data');
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
    ])).throws('too much recursion');
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
    ])).throws('too much recursion');
    /* eslint-enable array-bracket-newline, comma-spacing */
    const tm1 = Date.now();
    expect(tm1 - tm0).toBeLessThan(50);
  });
});
