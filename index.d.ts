declare module 'json-immutability-helper' {
  const SHARED_UNSET_TOKEN: unique symbol;

  type DirectiveFn = <T>(
    old: Readonly<T>,
    args: ReadonlyArray<unknown>,
    context: Readonly<Context>,
  ) => T | typeof SHARED_UNSET_TOKEN;
  type ConditionFn = (
    args: ReadonlyArray<unknown>,
    context: Readonly<Context>,
  ) => (actual: unknown) => boolean;
  type EqualFn = (x: unknown, y: unknown) => boolean;
  type CopyFn = <T>(o: Readonly<T>) => T;

  interface Limits {
    stringLength: number;
    recursionDepth: number;
    recursionBreadth: number;
  }

  type RpnValue = number | string;
  type RpnOperator = [number, number, (...args: RpnValue[]) => RpnValue];

  type Primitive = undefined | boolean | number | bigint | string | null;

  export interface Extension {
    commands?: Record<string, DirectiveFn>;
    conditions?: Record<string, ConditionFn>;
    rpnOperators?: Record<string, RpnOperator>;
    rpnConstants?: Record<string, RpnValue>;
    limits?: Partial<Limits>;
    isEquals?: EqualFn;
    copy?: CopyFn;
  }

  export type Condition<T> =
    | (T extends Primitive
        ? ['=' | '!=' | '~=' | '!~=', ...T[]]
        : T extends ReadonlyArray<infer U>
          ? ArrayCondition<U>
          : ObjectCondition<T>)
    | (T extends number ? ['>' | '>=' | '<' | '<=', number] : never)
    | ['and' | 'or', ...Condition<T>[]]
    | ['not', Condition<T>]
    | ['exists'];

  type ArrayCondition<T> =
    | ['length', Condition<number>]
    | ['some' | 'every' | 'none', Condition<T>]
    | { [index: number]: Condition<T> };

  type ObjectCondition<T> = { [K in keyof T]?: Condition<T[K]> };

  type Locator<T, R> = [R, Condition<T>] | R;
  export type SingleLocator<T> = Locator<T, 'first' | 'last' | number>;
  export type MultiLocator<T> = Locator<T, 'first' | 'last' | 'all' | number>;

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
    | ['=', T | If<Unsettable, typeof SHARED_UNSET_TOKEN>]
    | ['init', T]
    | ['if', Condition<T>, Spec<T, Unsettable>, Spec<T, Unsettable>?]
    | ['seq', ...Spec<T, Unsettable>[]]
    | If<Unsettable, ['unset']>;

  type StringSpec = ['replaceAll', string, string] | ['rpn', ...(number | string)[]];

  type BooleanSpec = ['~'];

  type NumberSpec = ['+', number] | ['-', number] | ['rpn', ...(number | string)[]];

  type ArraySpec<T> =
    | ['push', ...T[]]
    | ['unshift', ...T[]]
    | (T extends Primitive ? ['addUnique', ...T[]] : never)
    | ['splice', ...([number, number?] | [number, number, ...T[]])[]]
    | ['insert', 'before' | 'after', MultiLocator<T>, ...T[]]
    | ['update', MultiLocator<T>, Spec<T, true>, T?]
    | ['delete', MultiLocator<T>]
    | ['swap', SingleLocator<T>, SingleLocator<T>]
    | ['move', MultiLocator<T>, 'before' | 'after', SingleLocator<T>]
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
  type State<T> = [T, (value: T | ((prevState: T) => T)) => void];

  type UseState = <T>(initialValue: T | (() => T)) => State<T>;
  type UseEvent = <Fn>(fn: Fn) => Fn;
  type UseReducer = (<T, S, I>(
    reducer: (v: T, s: S) => T,
    initializerArg: I,
    initializer: (v: I) => T,
  ) => Reducer<T, S>) &
    (<T, S>(
      reducer: (v: T, s: S) => T,
      initializerArg: T,
      initializer?: undefined,
    ) => Reducer<T, S>);
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

  type UseJSONReducer = (<T, I>(initializerArg: I, initializer: (v: I) => T) => SpecReducer<T>) &
    (<T>(initializerArg: T, initializer?: undefined) => SpecReducer<T>);

  type UseScopedReducer = (<T>(
    next: SpecReducer<T>,
    path: [],
    options?: ScopedReducerOptions<T>,
  ) => SpecReducer<T>) &
    (<T>(
      next: SpecReducer<T[]>,
      path: [ArrayPath<T>],
      options?: ScopedReducerOptions<T>,
    ) => SpecReducer<T>) &
    (<T, K extends keyof T>(
      next: SpecReducer<T>,
      path: [K],
      options?: ScopedReducerOptions<T[K]>,
    ) => SpecReducer<T[K]>) &
    (<T, U>(
      next: SpecReducer<T>,
      path: UnknownPath[],
      options?: ScopedReducerOptions<U>,
    ) => SpecReducer<U>);

  export function makeHooks(
    c: typeof context,
    hooks: InputHooks,
  ): {
    useEvent: UseEvent;
    useJSONReducer: UseJSONReducer;
    useWrappedJSONReducer: <T>(next: State<T>) => SpecReducer<T>;
    useScopedReducer: UseScopedReducer;
  };
}
