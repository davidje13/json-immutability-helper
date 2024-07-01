declare module 'json-immutability-helper' {
  const SHARED_UNSET_TOKEN: unique symbol;

  type DirectiveFn = <T>(
    old: Readonly<T>,
    args: ReadonlyArray<unknown>,
    context: Readonly<Context>,
  ) => T | typeof SHARED_UNSET_TOKEN;
  type ConditionFn = <T>(param: T) => (actual: T) => boolean;
  type EqualFn = (x: unknown, y: unknown) => boolean;
  type CopyFn = <T>(o: Readonly<T>) => T;

  interface Limits {
    stringLength: number;
    recursionDepth: number;
    recursionBreadth: number;
  }

  type RpnValue = number | string;
  type RpnOperator = [number, number, (...args: RpnValue[]) => RpnValue];

  export interface Extension {
    commands?: Record<string, DirectiveFn>;
    conditions?: Record<string, ConditionFn>;
    rpnOperators?: Record<string, RpnOperator>;
    rpnConstants?: Record<string, RpnValue>;
    limits?: Partial<Limits>;
    isEquals?: EqualFn;
    copy?: CopyFn;
  }

  interface ConditionValue<T> {
    equals?: T;
    greaterThanOrEqual?: T;
    lessThanOrEqual?: T;
    greaterThan?: T;
    lessThan?: T;
    not?: T;
    notNullish?: null;
  }

  interface ConditionKeyValue<K, V> extends ConditionValue<V> {
    key: K;
  }

  type ConditionKey<T, K extends keyof T> = ConditionKeyValue<K, T[K]> | [K, T[K]];

  type ConditionEntry<T> = ConditionValue<T> | ConditionKey<T, keyof T>;

  export type Condition<T> = ConditionEntry<T> | ConditionEntry<T>[];

  type If<T, True> = T extends true ? True : never;

  export type Spec<T, Unsettable extends boolean = false> =
    | (T extends string
        ? StringSpec
        : T extends boolean
          ? BooleanSpec
          : T extends number
            ? NumberSpec
            : T extends ReadonlyArray<infer U>
              ? ArraySpec<U>
              : ObjectSpec<T>)
    | ['=' | 'set', T | If<Unsettable, typeof SHARED_UNSET_TOKEN>]
    | ['init', T]
    | ['updateIf', Condition<T>, Spec<T, Unsettable>, Spec<T, Unsettable>?]
    | ['seq', ...Spec<T, Unsettable>[]]
    | If<Unsettable, ['unset']>;

  type StringSpec = ['replaceAll', string, string] | ['rpn', ...(number | string)[]];

  type BooleanSpec = ['~'] | ['toggle'];

  type NumberSpec =
    | ['+' | 'add', number]
    | ['-' | 'subtract', number]
    | ['rpn', ...(number | string)[]];

  type ArraySpec<T> =
    | ['push', ...T[]]
    | ['unshift', ...T[]]
    | ['splice', ...([number, number?] | [number, number, ...T[]])[]]
    | ['insertBeforeFirstWhere', Condition<T>, ...T[]]
    | ['insertAfterFirstWhere', Condition<T>, ...T[]]
    | ['insertBeforeLastWhere', Condition<T>, ...T[]]
    | ['insertAfterLastWhere', Condition<T>, ...T[]]
    | ['updateAll', Spec<T, true>]
    | ['updateWhere', Condition<T>, Spec<T, true>, T?]
    | ['updateFirstWhere', Condition<T>, Spec<T, true>, T?]
    | ['updateLastWhere', Condition<T>, Spec<T, true>, T?]
    | ['deleteWhere', Condition<T>]
    | ['deleteFirstWhere', Condition<T>]
    | ['deleteLastWhere', Condition<T>]
    | { [index: number]: Spec<T, true> };

  type ObjectSpec<T> =
    | ['merge', Partial<Readonly<T>>, Readonly<T>?]
    | { [K in keyof T]?: Spec<T[K], {} extends Pick<T, K> ? true : false> };

  interface Options {
    path?: string;
  }

  type CombineFn = <T, Unsettable extends boolean>(
    specs: Spec<T, Unsettable>[],
  ) => Spec<T, Unsettable>;

  function updateFn<T>(
    object: T,
    spec: Spec<T, false>,
    options?: Options & { allowUnset?: false },
  ): T;

  function updateFn<T>(
    object: T,
    spec: Spec<T, true>,
    options?: Options & { allowUnset?: false },
  ): T | undefined;

  function updateFn<T>(
    object: T,
    spec: Spec<T, true>,
    options: Options & { allowUnset: true },
  ): T | typeof SHARED_UNSET_TOKEN;

  type Update = typeof updateFn & {
    readonly context: Context;
    readonly combine: CombineFn;
    readonly UNSET_TOKEN: typeof SHARED_UNSET_TOKEN;
    readonly with: (...extensions: Extension[]) => Update;
  };

  class Context {
    public readonly isEquals: EqualFn;
    public readonly copy: CopyFn;
    public readonly update: Update;
    public readonly combine: CombineFn;
    public readonly limits: Readonly<Limits>;
    public readonly UNSET_TOKEN: typeof SHARED_UNSET_TOKEN;

    public with(...extensions: Extension[]): Context;

    public makeConditionPredicate<T>(condition: Condition<T>[]): (v: T) => boolean;

    public invariant(condition: unknown, message?: string | (() => string)): asserts condition;
  }

  export const context: Context;
  export const update: typeof context.update;
  export const combine: typeof context.combine;
  export const invariant: typeof context.invariant;
  export const UNSET_TOKEN: typeof context.UNSET_TOKEN;

  export default context;
}

declare module 'json-immutability-helper/commands/list' {
  import type { Extension } from 'json-immutability-helper';
  const extension: Readonly<Extension>;
  export default extension;
}

declare module 'json-immutability-helper/commands/math' {
  import type { Extension } from 'json-immutability-helper';
  const extension: Readonly<Extension>;
  export default extension;
}

declare module 'json-immutability-helper/commands/string' {
  import type { Extension } from 'json-immutability-helper';
  const extension: Readonly<Extension>;
  export default extension;
}

declare module 'json-immutability-helper/helpers/scoped' {
  import type { context, Spec, Condition } from 'json-immutability-helper';

  type Context = typeof context;

  type SubSpecOptions<T> = { initialisePath?: boolean; initialiseValue?: T };

  type ArrayPath<T> = number | Condition<T>;
  type UnknownPath = string | ArrayPath<unknown>;

  type Reducer<T> = { state: T; dispatch: (s: Spec<T>) => void };

  export function makeScopedSpec<T>(path: [], spec: Spec<T>, options?: SubSpecOptions<T>): Spec<T>;
  export function getScopedState<T>(c: Context, state: T, path: [], defaultValue?: T): T;
  export function makeScopedReducer<T>(
    c: Context,
    reducer: Reducer<T>,
    path: [],
    defaultValue?: T,
  ): Reducer<T>;

  export function makeScopedSpec<T>(
    path: [ArrayPath<T>],
    spec: Spec<T>,
    options?: SubSpecOptions<T>,
  ): Spec<T[]>;
  export function getScopedState<T>(
    c: Context,
    state: T[],
    path: [ArrayPath<T>],
    defaultValue?: T,
  ): T;
  export function makeScopedReducer<T>(
    c: Context,
    reducer: Reducer<T[]>,
    path: [ArrayPath<T>],
    defaultValue?: T,
  ): Reducer<T>;

  export function makeScopedSpec<T, K extends keyof T>(
    path: [K],
    spec: Spec<T[K]>,
    options?: SubSpecOptions<T>,
  ): Spec<T>;
  export function getScopedState<T, K extends keyof T>(
    c: Context,
    state: T,
    path: [K],
    defaultValue?: T[K],
  ): T[K];
  export function makeScopedReducer<T, K extends keyof T>(
    c: Context,
    reducer: Reducer<T>,
    path: [K],
    defaultValue?: T[K],
  ): Reducer<T[K]>;

  export function makeScopedSpec<T, U>(
    path: UnknownPath[],
    spec: Spec<U>,
    options?: SubSpecOptions<U>,
  ): Spec<T>;
  export function getScopedState<T, U>(
    c: Context,
    state: T,
    path: UnknownPath[],
    defaultValue?: U,
  ): U;
  export function makeScopedReducer<T, U>(
    c: Context,
    reducer: Reducer<T>,
    path: UnknownPath[],
    defaultValue?: U,
  ): Reducer<U>;
}

declare module 'json-immutability-helper/helpers/hooks' {
  import type { context, Spec, Condition } from 'json-immutability-helper';

  type ArrayPath<T> = number | Condition<T>;
  type UnknownPath = string | ArrayPath<unknown>;

  type Reducer<T, S> = [T, (s: S) => void];
  type SpecReducer<T> = { state: T; dispatch: (s: Spec<T>) => void };
  type State<T> = Reducer<T, T | ((o: T) => T)>;

  type UseState = <T>(init: T | (() => T)) => State<T>;
  type UseEvent = <Fn>(fn: Fn) => Fn;
  type UseReducer = <T, S>(
    reducer: (v: T, s: S) => T,
    initialArg: T,
    init?: (v: T) => T,
  ) => Reducer<T, S>;
  type UseEffect = (fn: () => void, deps: unknown[]) => void;
  type UseRef = <T>(init: T) => { current: T };

  type InputHooks = {
    useState: UseState;
    useReducer?: UseReducer;
  } & (
    | { useEvent: UseEvent }
    | ({ useRef: UseRef } & ({ useLayoutEffect: UseEffect } | { useEffect: UseEffect }))
  );

  interface ScopedReducerOptions<T> {
    initialisePath?: boolean;
    initialiseValue?: T;
  }

  type UseScopedReducer =
    | (<T>(next: SpecReducer<T>, path: [], options?: ScopedReducerOptions<T>) => SpecReducer<T>)
    | (<T>(
        next: SpecReducer<T[]>,
        path: [ArrayPath<T>],
        options?: ScopedReducerOptions<T>,
      ) => SpecReducer<T>)
    | (<T, K extends keyof T>(
        next: SpecReducer<T>,
        path: [K],
        options?: ScopedReducerOptions<T[K]>,
      ) => SpecReducer<T[K]>)
    | (<T, U>(
        next: SpecReducer<T>,
        path: UnknownPath[],
        options?: ScopedReducerOptions<U>,
      ) => SpecReducer<U>);

  export function makeHooks(
    c: typeof context,
    hooks: InputHooks,
  ): {
    useEvent: UseEvent;
    useJSONReducer: <T>(initialArg: T, init?: (v: T) => T) => SpecReducer<T>;
    useWrappedJSONReducer: <T>(next: State<T>) => SpecReducer<T>;
    useScopedReducer: UseScopedReducer;
  };
}
