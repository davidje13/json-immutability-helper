import context, { update, UNSET_TOKEN } from 'json-immutability-helper';
import { makeHooks } from 'json-immutability-helper/helpers/hooks';
import React, { useState } from 'react';

// this file just checks types; the code is not executed

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
assertType(update(7, ['seq', ['+', 1], ['-', 1]]))<number>();

// @ts-expect-error
update(7, ['=', 'nope']); // incorrect type
// @ts-expect-error
update(7, ['seq', ['+', 'nope'], ['-', 1]]); // nested incorrect type

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
assertType(update({ foo: 'bar' } as ObjUndef, { foo: ['=', undefined] }))<ObjUndef>();

// @ts-expect-error
update({ foo: 'bar' } as ObjUndef, { foo: ['=', 1] }); // incorrect type
// @ts-expect-error
update({ foo: 'bar' } as ObjUndef, { foo: ['unset'] }); // cannot unset required property

type ObjOptional = { foo?: string };
assertType(update({ foo: 'bar' } as ObjOptional, { foo: ['=', 'baz'] }))<ObjOptional>();
assertType(update({ foo: 'bar' } as ObjOptional, { foo: ['unset'] }))<ObjOptional>();
assertType(update({ foo: 'bar' } as ObjOptional, { foo: ['=', undefined] }))<ObjOptional>(); // TODO: ideally this would be restricted

// @ts-expect-error
update({ foo: 'bar' } as ObjOptional, { foo: ['=', 1] }); // incorrect type

// arrays

assertType(update(['foo'] as string[], { 0: ['=', 'baz'] }))<string[]>();
assertType(update(['foo'] as string[], { 0: ['unset'] }))<string[]>();
assertType(update(['foo'] as string[], ['update', ['all', ['=', 'foo']], ['=', 'baz']]))<
  string[]
>();

// @ts-expect-error
update(['foo'] as string[], { 0: ['=', 7] }); // incorrect type
// @ts-expect-error
update(['foo'] as string[], ['update', ['all', ['=', 7]], ['=', 'baz']]); // incorrect conditional type

assertType(update(['foo'] as string[], ['addUnique', 'bar']))<string[]>();

// @ts-expect-error
update([{ id: 1 }], ['addUnique', { id: 1 }]); // cannot addUnique with objects

// hook helpers

const { useJSONReducer, useWrappedJSONReducer, useScopedReducer } = makeHooks(context, React);

const reducer = useJSONReducer({ foo: 'bar', baz: 1 });
assertType(reducer.state)<{ foo: string; baz: number }>();
reducer.dispatch(['=', { foo: 'baz', baz: 2 }]);

// @ts-expect-error
reducer.dispatch(['=', 7]); // incorrect type

const scopedReducer1 = useScopedReducer(reducer, ['foo']);
assertType(scopedReducer1.state)<string>();

const scopedReducer2 = useScopedReducer(reducer, ['baz']);
assertType(scopedReducer2.state)<number>();

assertType(useScopedReducer(reducer, ['nope']).state)<unknown>(); // TODO: ideally would restrict this but it is difficult to be sure when working with complex paths

const wrappedReducer = useWrappedJSONReducer(useState(10));
assertType(wrappedReducer.state)<number>();
wrappedReducer.dispatch(['=', 1]);

// @ts-expect-error
wrappedReducer.dispatch(['=', 'nope']); // incorrect type
