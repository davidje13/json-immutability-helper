# JSON Immutability Helper

JSON-serialisable mutability helpers.

Originally based on
[`immutability-helper`](https://github.com/kolodny/immutability-helper),
with list, string and mathematical commands added, but now uses an
alternative syntax.

## Install dependency

```bash
npm install --save git+https://github.com/davidje13/json-immutability-helper.git#semver:^2.0.0
```

## Motivation

When working with collaborative state shared over a network, it can be
desirable to share state deltas rather than full state objects. This
allows parallel editing from different editors, and reduces bandwidth
requirements.

Sharing functions between browsers and servers is not desirable, as it
introduces security concerns. Instead, this package provides a
foundational set of primitive operations which cover typical mutations.

Because the operations are intended to be shared, all inputs are
assumed to be potentially malicious, with necessary mitigations applied.

## Usage

The core function `update` takes an object and a spec, and returns an
updated object. The input object and spec are unchanged (considered
immutable).

Optimisations ensure that if any properties within the object are
unchanged, they will be returned exactly (not a copy). This helps
when detecting changes using shallow comparison.

Simple usage:

```javascript
const { update } = require('json-immutability-helper');

const initialState = { foo: 3 };

const updatedState = update(initialState, { foo: ['add', 1] });
// updatedState = { foo: 4 }
// initialState is unchanged
```

You can define arbitrary hierarchies:

```javascript
const { update } = require('json-immutability-helper');

const initialState = { foo: { bar: { baz: 1 } } };

const updatedState = update(initialState, {
  foo: {
    bar: {
      baz: ['set', 7],
    },
    extra: ['set', 1]
  },
});
// updatedState = { foo: { bar: { baz: 7 }, extra: 1 } }
```

Note that arrays in the spec define commands. To navigate to a particular
item in an array, use a number as an object key:

```javascript
const { update } = require('json-immutability-helper');

const initialState = { foo: [2, 8] };

const updatedState = update(initialState, {
  foo: {
    0: ['set', 5],
  },
});
// updatedState = { foo: [5, 8] }

// To serialise as JSON, you can quote the index:

const spec = `
{
  "foo": {
    "0": ["set", 5]
  }
}
`;
```

With list commands:

```javascript
const { update } = require('json-immutability-helper');

const initialState = {
  items: [
    { myId: 3, myThing: 'this' },
    { myId: 28, myThing: 'that' },
  ],
};

// Change the property 'myThing' of the item with myId=3
const updatedState = update(initialState, {
  items: [
    'updateWhere',
    ['myId', 3],
    { myThing: ['set', 'updated this'] },
  ],
});

// Note that the spec is fully JSON-serialisable:

const spec = `
{
  "items": [
    "updateWhere",
    ["myId", 3],
    { "myThing": ["set", "updated this"] }
  ]
}
`;
const updatedJsonState = update(initialState, JSON.parse(spec));
```

## Conditions

The main concept introduced in this project is conditions. Several
commands use conditions to decide which items to update, such as
`updateIf`, `updateWhere` and `deleteFirstWhere`, among others.

### Examples

```javascript
const items = [1, 2, 3, 4];

// Set items to 5 using the condition {equals: 3}
const updatedItems = update(items, [
  'updateWhere',
  { equals: 3 },
  ['set', 5],
]);

// The output is:
const expectedItems = [1, 2, 5, 4];
```

`equals` checks for a specific value. Other conditions are available,
for example:

```javascript
const items = [1, 2, 3, 4];

const updatedItems = update(items, [
  'updateWhere',
  { greaterThanOrEqual: 3 },
  ['set', 5],
]);

// The output is:
const expectedItems = [1, 2, 5, 5];
```

Conditions can also be combined, for example to make a range:

```javascript
const items = [1, 2, 3, 4];

const updatedItems = update(items, [
  'updateWhere',
  { greaterThan: 1, lessThan: 4 },
  ['set', 5],
]);

// The output is:
const expectedItems = [1, 5, 5, 4];
```

#### Working with objects

A common use-case is working with lists of objects. In this situation,
you can provide a `key` to test a particular property of the object:

```javascript
const items = [
  { myId: 3, myThing: 'this' },
  { myId: 28, myThing: 'that' },
];

const updatedItems = update(items, [
  'updateWhere',
  { key: 'myId', equals: 3 },
  { myThing: ['set': 'updated this'] },
]);

// The output is:
const expectedItems = [
  { myId: 3, myThing: 'updated this' }, // <-- this item has changed
  { myId: 28, myThing: 'that' },
];
```

Because this is a common use-case, a shorthand is available:

```javascript
['myProperty', myValue]

// Same as:
{key: 'myProperty', equals: myValue}
```

In both cases, this will look at the value of `myProperty` in the
current object, and check if it is equal to `myValue`.

Conditions can check multiple properties by wrapping them in an array
(these only match if all conditions are met):

```javascript
[
  {key: 'myProperty', greaterThanOrEqual: 2},
  {key: 'myOtherProperty', equals: 'something'},
]

// or, using the shorthand:
[
  {key: 'myProperty', greaterThanOrEqual: 2},
  ['myOtherProperty', 'something'],
]
```

## Condition reference

- `equals`: checks for an exact match. Note that this uses `===`
  matching, so `null` and `undefined` are distinct, and objects /
  arrays will never compare equal (only test primitive types).
- `not`: negated form of `equals`.
- `greaterThan`: checks for strictly-greater-than.
- `greaterThanOrEqual`: checks for greater-than-or-equal.
- `lessThan`: checks for strictly-less-than.
- `lessThanOrEqual`: checks for less-than-or-equal.

You can add new conditions with:

```javascript
update.extendCondition(
  'conditionName',
  (parameter) => (actualValue) => {
    // parameter is the value assigned to the condition
    // actualValue is the value of the object being tested

    // example: greaterThan
    return actualValue > parameter;
  }
);
```

## Commands reference

### Generic

- `['set', value]` alias `['=', value]`
  sets the value to the literal value given.

- `['unset']`
  deletes the value. If the parent is an object, the property is
  removed. If the parent is an array, the element is removed and
  subsequent items re-packed. If used on the root, `update` will
  return `undefined` (unless `allowUnset` is specified).

- `['updateIf', condition, spec, elseSpec?]`
  applies the given `spec` if the `condition` matches, otherwise
  applies the `elseSpec` (if provided) or does nothing.

- `['seq', specs...]`
  applies the given `spec`s sequentially. This can be used to create
  complex updates out of simple operations.

  ```javascript
  // Computes (value * 2 + 10)
  const updated = update(state, [
    'seq',
    ['multiply', 2],
    ['add', 10],
  ]);
  ```

### Array

- `['push', items...]`
  inserts one or more items at the end of the array.

- `['unshift', items...]`
  inserts one or more items at the start of the array.

- `['splice', arguments...]`
  invokes `splice` on the array repeatedly. Each argument should
  be an array of parameters to send the `splice` function;
  `[offset, length, items...]`. Note that offset can be negative
  to count from the end of the array.

- `['insertBeforeFirstWhere', condition, items...]`
  inserts one or more items before the first item which matches the
  `condition` (or at the end of the array if no items match).

- `['insertAfterFirstWhere', condition, items...]`
  inserts one or more items after the first item which matches the
  `condition` (or at the end of the array if no items match).

- `['insertBeforeLastWhere', condition, items...]`
  inserts one or more items before the last item which matches the
  `condition` (or at the start of the array if no items match).

- `['insertAfterLastWhere', condition, items...]`
  inserts one or more items after the last item which matches the
  `condition` (or at the start of the array if no items match).

- `['updateAll', spec]`
  applies the given `spec` to all items in the array individually.

- `['updateWhere', condition, spec]`
  applies the given `spec` to all items in the array which match the
  `condition`. If no item matches, does nothing. Same as
  `['updateAll', ['updateIf', condition, spec]]`.

- `['updateFirstWhere', condition, spec]`
  applies the given `spec` to the first item in the array which matches
  the `condition`. If no item matches, does nothing.

- `['updateLastWhere', condition, spec]`
  applies the given `spec` to the last item in the array which matches
  the `condition`. If no item matches, does nothing.

- `['deleteWhere', condition]`
  deletes all items in the array which match the `condition`. If no
  items match, does nothing. Same as
  `['updateWhere', condition, ['unset']]`.

- `['deleteFirstWhere', condition]`
  deletes the first item in the array which match the `condition`. If
  no item matches, does nothing. Same as
  `['updateFirstWhere', condition, ['unset']]`.

- `['deleteLastWhere', condition]`
  deletes the last item in the array which match the `condition`. If
  no item matches, does nothing. Same as
  `['updateLastWhere', condition, ['unset']]`.

### Object

- `['merge', object]`
  Merges the keys of object into the current target. Similar to
  calling `Object.assign`.

### String

- `['replaceAll', search, replace]`
  replaces all occurrences of `search` in the string with `replace`.
  Note that the `search` is used as a literal, not as a regular
  expression.

### Number

- `['add', value]` alias `['+', value]`
  adds the given `value` to the current value.

- `['subtract', value]` alias `['-', value]`
  subtracts the given `value` from the current value.

- `['multiply', value]` alias `['*', value]`
  multiplies the given `value` and the current value.

- `['divide', value]` alias `['/', value]`
  divides the current value by the given `value`.

- `['reciprocal', value]`
  divides the given `value` by the current value.

### Boolean

- `['toggle']` alias `['~']`
  toggles the current value
  (`true` &rarr; `false`; `false` &rarr; `true`).

## Other context methods

You can access the default context, or create your own scoped context:

```javascript
const defaultContext = require('json-immutability-helper');
```

```javascript
const { Context } = require('json-immutability-helper');
const myContext = new Context();
```

- `.extend(name, (object, args, context) => newValue)`
  adds a new command which can be used in the same places as built-in
  commands. `object` is the previous value for the current position.
  `args` is an array of parameters (excluding the command name).
  `context` is an object which contains the methods listed here, as
  well as `update`.

- `.extendAll(object)`
  same as calling `extend` for all key/value pairs in the given object.

- `.extendCondition(name, (param) => (actual) => boolean)`
  adds a new condition which can be used in the same places as built-in
  conditions.

- `.extendConditionAll(object)`
  same as calling `extendCondition` for all key/value pairs in the
  given object.

- `.combine(specs)`
  generates a single spec which is equivalent to applying all the given
  specs sequentially. Conceptually this is identical to using
  `['seq', ...specs]`, but `combine` optimises common paths where
  possible.
  Note that the specs must be provided in an array, not as variadic
  parameters.

- `.makeConditionPredicate(condition)`
  generates a predicate for the provided condition. This should be
  used by custom commands when filtering based on a provided
  condition is required.

- `.invariant(check, message?)`
  throws an exception if `check` is false. Includes the message if
  specified (can be a string or a function which returns a string).

The default context's `update`, `combine` and `invariant` are also
available as direct imports:

```javascript
const { update, combine, invariant } = require('json-immutability-helper');
```
