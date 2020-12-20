const SHARED_UNSET_TOKEN: unique symbol;

type DirectiveFn = <T>(old: Readonly<T>, args: ReadonlyArray<unknown>, context: Readonly<Context>) => T | typeof SHARED_UNSET_TOKEN;
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

interface Extension {
  commands?: Record<string, DirectiveFn>;
  conditions?: Record<string, ConditionFn>;
  rpnOperators?: Record<string, RpnOperator>;
  rpnConstants?: Record<string, RpnValue>;
  limits?: Partial<Limits>;
  isEquals?: EqualFn;
  copy?: CopyFn;
}

declare module 'json-immutability-helper' {
  interface ConditionValue<T> {
    equals?: T;
    greaterThanOrEqual?: T;
    lessThanOrEqual?: T;
    greaterThan?: T;
    lessThan?: T;
    not?: T;
    notNullish?: null,
  }

  interface ConditionKeyValue<K, V> extends ConditionValue<V> {
    key: K;
  }

  type ConditionKey<T, K extends keyof T> = ConditionKeyValue<K, T[K]> | [K, T[K]];

  type ConditionEntry<T> = ConditionValue<T> | ConditionKey<T, keyof T>;

  type Condition<T> = ConditionEntry<T> | ConditionEntry<T>[];

  export type Spec<T> = (
    T extends string ? StringSpec :
      T extends boolean ? BooleanSpec :
        T extends number ? NumberSpec :
          T extends (ReadonlyArray<infer U>) ? ArraySpec<U> :
            ObjectSpec<T>
  ) |
  ['=', T] | ['set', T] |
  (T extends undefined ? ['unset'] : never) |
  ['init', T] |
  ['updateIf', Condition<T>, Spec<T>, Spec<T>?] |
  ['seq', ...Spec<T>[]];

  type UnsettableSpec<T> = Spec<T> | ['unset'];

  type StringSpec =
    ['replaceAll', string, string] |
    ['rpn', ...(number | string)[]];

  type BooleanSpec =
    ['~'] | ['toggle'];

  type NumberSpec =
    ['+', number] | ['add', number] |
    ['-', number] | ['subtract', number] |
    ['rpn', ...(number | string)[]];

  type ArraySpec<T> =
    ['push', ...T[]] |
    ['unshift', ...T[]] |
    ['splice', ...([number, number?] | [number, number, ...T[]])[]] |
    ['insertBeforeFirstWhere', Condition<T>, ...T[]] |
    ['insertAfterFirstWhere', Condition<T>, ...T[]] |
    ['insertBeforeLastWhere', Condition<T>, ...T[]] |
    ['insertAfterLastWhere', Condition<T>, ...T[]] |
    ['updateAll', UnsettableSpec<T>] |
    ['updateWhere', Condition<T>, UnsettableSpec<T>] |
    ['updateFirstWhere', Condition<T>, UnsettableSpec<T>] |
    ['updateLastWhere', Condition<T>, UnsettableSpec<T>] |
    ['deleteWhere', Condition<T>] |
    ['deleteFirstWhere', Condition<T>] |
    ['deleteLastWhere', Condition<T>] |
    { [index: number]: UnsettableSpec<T> };

  type ObjectSpec<T> =
    ['merge', Partial<Readonly<T>>, Readonly<T>?] |
    { [K in keyof T]?: Spec<T[K]> };

  interface OptionsDisallowUnset {
    path?: string;
    allowUnset?: false;
  }

  type OptionsAllowUnset = Omit<OptionsDisallowUnset, 'allowUnset'> | {
    allowUnset: true;
  }

  type CombineFn = <T>(specs: Spec<T>[]) => Spec<T>;

  function update<T>(object: T, spec: Spec<T>, options?: OptionsDisallowUnset): T;
  function update<T>(object: T, spec: UnsettableSpec<T>, options: OptionsAllowUnset): T | typeof SHARED_UNSET_TOKEN;
  type Update = typeof update & {
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

    public invariant(
      condition: unknown,
      message?: string | (() => string),
    ): asserts condition;
  }

  export const context: Context;
  export const update: typeof context.update;
  export const combine: typeof context.combine;
  export const invariant: typeof context.invariant;
  export const UNSET_TOKEN: typeof context.UNSET_TOKEN;

  export default context;
}

declare module 'json-immutability-helper/commands/list' {
  export const listCommands: Readonly<Extension>;
}

declare module 'json-immutability-helper/commands/math' {
  export const mathCommands: Readonly<Extension>;
}

declare module 'json-immutability-helper/commands/string' {
  export const stringCommands: Readonly<Extension>;
}
