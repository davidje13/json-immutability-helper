declare module 'json-immutability-helper' {
  interface ConditionValue<T> {
    equals?: T;
    greaterThanOrEqual?: T;
    lessThanOrEqual?: T;
    greaterThan?: T;
    lessThan?: T;
    not?: T;
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
  ['updateIf', Condition<T>, Spec<T>, Spec<T>?] |
  ['seq', ...Spec<T>[]];

  type UnsettableSpec<T> = Spec<T> | ['unset'];

  type StringSpec =
    ['replaceAll', string, string];

  type BooleanSpec =
    ['~'] | ['toggle'];

  type NumberSpec =
    ['+', number] | ['add', number] |
    ['-', number] | ['subtract', number] |
    ['*', number] | ['multiply', number] |
    ['/', number] | ['divide', number] |
    ['reciprocal', number];

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
    ['merge', Partial<Readonly<T>>] |
    { [K in keyof T]?: Spec<T[K]> };

  type DirectiveFn<T> = (param: any, old: T) => T;
  type ConditionFn<T> = (param: T) => (actual: T) => boolean;

  interface OptionsDisallowUnset {
    path?: string;
    allowUnset?: false;
  }

  type OptionsAllowUnset = Omit<OptionsDisallowUnset, 'allowUnset'> | {
    allowUnset: true;
  }

  type UNSET_TOKEN = {};

  type Update = (
    (<T>(object: T, spec: Spec<T>, options?: OptionsDisallowUnset) => T) |
    (<T>(object: T, spec: UnsettableSpec<T>, options: OptionsAllowUnset) => T | UNSET_TOKEN)
  );

  export class Context {
    public isEquals: (x: any, y: any) => boolean;
    public copy: <T>(o: T) => T;
    public readonly UNSET_TOKEN: UNSET_TOKEN;

    public constructor();

    public extend<T>(directive: string, fn: DirectiveFn<T>): void;

    public extendAll<T>(directives: { [key: string]: DirectiveFn<T> }): void;

    public extendCondition<T>(name: string, check: ConditionFn<T>): void;

    public extendConditionAll<T>(checks: { [key: string]: ConditionFn<T> }): void;

    public update<T>(object: T, spec: Spec<T>): T;

    public combine<T>(specs: Spec<T>[]): Spec<T>;

    public makeConditionPredicate<T>(condition: Condition<T>[]): (v: T) => boolean;

    public invariant(
      condition: any,
      message?: string | (() => string),
    ): asserts condition;
  }

  export function invariant(
    condition: any,
    message?: string | (() => string),
  ): asserts condition;

  const update: Context & Update;
  export default update;
}
