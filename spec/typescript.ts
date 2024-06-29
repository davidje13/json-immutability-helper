import { update, UNSET_TOKEN } from 'json-immutability-helper';

// assertion helper
type Equals<A, B> =
  (<G>() => G extends A ? 1 : 2) extends <G>() => G extends B ? 1 : 2 ? [] : ['nope'];
const assertType =
  <Actual>(_: Actual) =>
  <Expected>(..._typesDoNotMatch: Equals<Actual, Expected>) => {};

// simple value

assertType(update(7, ['=', 8]))<number>();
assertType(update(7, ['unset']))<number | undefined>();
assertType(update(7, ['unset'], { allowUnset: false }))<number | undefined>();
assertType(update(7, ['unset'], { allowUnset: true }))<number | typeof UNSET_TOKEN>();

assertType(update(7, ['+', 1]))<number>();
assertType(update(7, ['-', 1]))<number>();
assertType(update(7, ['seq', ['add', 1], ['subtract', 1]]))<number>();

// @ts-expect-error
update(7, ['=', 'nope']); // incorrect type
// @ts-expect-error
update(7, ['seq', ['add', 'nope'], ['subtract', 1]]); // nested incorrect type

// properties in objects

type ObjRequired = { foo: string };
assertType(update({ foo: 'bar' } as ObjRequired, { foo: ['=', 'baz'] }))<ObjRequired>();

// @ts-expect-error
update({ foo: 'bar' } as ObjRequired, { foo: ['unset'] }); // cannot unset required property
// @ts-expect-error
update({ foo: 'bar' } as ObjRequired, { foo: ['=', 1] }); // incorrect type
// @ts-expect-error
update({ foo: 'bar' } as ObjRequired, { foo: ['=', undefined] }); // cannot set required property to undefined

type ObjUndef = { foo: string | undefined };
assertType(update({ foo: 'bar' } as ObjUndef, { foo: ['=', 'baz'] }))<ObjUndef>();
assertType(update({ foo: 'bar' } as ObjUndef, { foo: ['unset'] }))<ObjUndef>(); // TODO: ideally this would be restricted
assertType(update({ foo: 'bar' } as ObjUndef, { foo: ['=', undefined] }))<ObjUndef>();

// @ts-expect-error
update({ foo: 'bar' } as ObjUndef, { foo: ['=', 1] }); // incorrect type

type ObjOptional = { foo?: string };
assertType(update({ foo: 'bar' } as ObjOptional, { foo: ['=', 'baz'] }))<ObjOptional>();
assertType(update({ foo: 'bar' } as ObjOptional, { foo: ['unset'] }))<ObjOptional>();
assertType(update({ foo: 'bar' } as ObjOptional, { foo: ['=', undefined] }))<ObjOptional>(); // TODO: ideally this would be restricted

// @ts-expect-error
update({ foo: 'bar' } as ObjOptional, { foo: ['=', 1] }); // incorrect type

// arrays

assertType(update(['foo'] as string[], { 0: ['=', 'baz'] }))<string[]>();
assertType(update(['foo'] as string[], { 0: ['unset'] }))<string[]>();
assertType(update(['foo'] as string[], ['updateWhere', { equals: 'foo' }, ['=', 'baz']]))<
  string[]
>();

// @ts-expect-error
update(['foo'] as string[], { 0: ['=', 7] }); // incorrect type
// @ts-expect-error
update(['foo'] as string[], ['updateWhere', { equals: 7 }, ['=', 'baz']]); // incorrect conditional type
