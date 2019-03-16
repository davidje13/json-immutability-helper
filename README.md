# JSON Immutability Helper

JSON-serialisable mutability helpers, built on
[`immutability-helper`](https://github.com/kolodny/immutability-helper).

Primarily adds list commands, along with simple string and mathematical
commands.

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

This builds on top of
[`immutability-helper`](https://github.com/kolodny/immutability-helper),
so see that project's documentation for the basics of the API.

Simple usage:

```javascript
const update = require('json-immutability-helper');

const initialState = {
  items: [
    {myId: 3, myThing: 'this'},
    {myId: 28, myThing: 'that'},
  ],
};

// Change the property 'myThing' of the item with myId=3
const updatedState = update(initialState, {
  items: {
    $updateWhere: [['myId', 3], {
      myThing: {$set: 'updated this'},
    }],
  },
});

// Note that the spec is fully JSON-serialisable:

const spec = `
{
  "items": {
    "$updateWhere": [["myId", 3], {
      "myThing": {"$set": "updated this"},
    }],
  },
}
`;
const updatedJsonState = update(initialState, JSON.parse(spec));
```

## Conditions

The main concept introduced in this project is conditions. Several
commands use conditions to decide which items to update, such as
`$updateIf`, `$updateWhere` and `$deleteFirstWhere`, among others.

### Examples

```javascript
const items = [1, 2, 3, 4];

// Set items to 5 using the condition {equals: 3}
const updatedItems = update(items, {
  $updateWhere: [{equals: 3}, {$set: 5}],
});

// The output is:
const expectedItems = [1, 2, 5, 4];
```

`equals` checks for a specific value. Other conditions are available,
for example:

```javascript
const items = [1, 2, 3, 4];

const updatedItems = update(items, {
  $updateWhere: [{greaterThanOrEqual: 3}, {$set: 5}],
});

// The output is:
const expectedItems = [1, 2, 5, 5];
```

Conditions can also be combined, for example to make a range:

```javascript
const items = [1, 2, 3, 4];

const updatedItems = update(items, {
  $updateWhere: [{greaterThan: 1, lessThan: 4}, {$set: 5}],
});

// The output is:
const expectedItems = [1, 5, 5, 4];
```

#### Working with objects

A common use-case is working with lists of objects. In this situation,
you can provide a `key` to test a particular property of the object:

```javascript
const items = [
  {myId: 3, myThing: 'this'},
  {myId: 28, myThing: 'that'},
];

const updatedItems = update(items, {
  $updateWhere: [{key: 'myId', equals: 3}, {
    myThing: {$set: 'updated this'},
  }],
});

// The output is:
const expectedItems = [
  {myId: 3, myThing: 'updated this'}, // <-- this item has changed
  {myId: 28, myThing: 'that'},
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

Note that all commands (except `$apply` and its short-hand form) from
[`immutability-helper`](https://github.com/kolodny/immutability-helper)
are available. In addition:

### Generic

- `{$updateIf: [condition, spec, elseSpec]}`
  applies the given `spec` if the `condition` matches, otherwise
  applies the `elseSpec` (if provided) or does nothing.

### Array

- `{$insertBeforeFirstWhere: [condition, items...]}`
  inserts one or more items before the first item which matches the
  `condition` (or at the end of the array if no items match).

- `{$insertAfterFirstWhere: [condition, items...]}`
  inserts one or more items after the first item which matches the
  `condition` (or at the end of the array if no items match).

- `{$insertBeforeLastWhere: [condition, items...]}`
  inserts one or more items before the last item which matches the
  `condition` (or at the start of the array if no items match).

- `{$insertAfterLastWhere: [condition, items...]}`
  inserts one or more items after the last item which matches the
  `condition` (or at the start of the array if no items match).

- `{$updateAll: spec}`
  applies the given `spec` to all items in the array individually.

- `{$updateWhere: [condition, spec]}`
  applies the given `spec` to all items in the array which match the
  `condition`. If no item matches, does nothing.

- `{$updateFirstWhere: [condition, spec]}`
  applies the given `spec` to the first item in the array which matches
  the `condition`. If no item matches, does nothing.

- `{$updateLastWhere: [condition, spec]}`
  applies the given `spec` to the last item in the array which matches
  the `condition`. If no item matches, does nothing.

- `{$deleteWhere: condition}`
  deletes all items in the array which match the `condition`. If no
  items match, does nothing.

- `{$deleteFirstWhere: condition}`
  deletes the first item in the array which match the `condition`. If
  no item matches, does nothing.

- `{$deleteLastWhere: condition}`
  deletes the last item in the array which match the `condition`. If
  no item matches, does nothing.

### String

- `{$replaceAll: [search, replace]}`
  replaces all occurrences of `search` in the string with `replace`.
  Note that the `search` is used as a literal, not as a regular
  expression.

### Numeric

- `{$add: value}`
  adds the given `value` to the current value.

- `{$subtract: value}`
  subtracts the given `value` from the current value.

- `{$multiply: value}`
  multiplies the given `value` and the current value.

- `{$divide: value}`
  divides the current value by the given `value`.

- `{$reciprocal: value}`
  divides the given `value` by the current value.
