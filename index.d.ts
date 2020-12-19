declare module 'json-immutability-helper' {
  const SHARED_UNSET_TOKEN: unique symbol;

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

  type DirectiveFn<T> = (old: Readonly<T>, args: ReadonlyArray<any>, context: Readonly<Context>) => T | typeof SHARED_UNSET_TOKEN;
  type ConditionFn<T> = (param: T) => (actual: T) => boolean;

  interface OptionsDisallowUnset {
    path?: string;
    allowUnset?: false;
  }

  type OptionsAllowUnset = Omit<OptionsDisallowUnset, 'allowUnset'> | {
    allowUnset: true;
  }

  export class Context {
    public isEquals: (x: unknown, y: unknown) => boolean;
    public copy: <T>(o: Readonly<T>) => T;
    public readonly UNSET_TOKEN: typeof SHARED_UNSET_TOKEN;

    public constructor();

    public extend<T>(directive: string, fn: DirectiveFn<T>): void;

    public extendAll<T>(directives: { [key: string]: DirectiveFn<T> }): void;

    public enableRiskyStringOps(): void;

    public extendCondition<T>(name: string, check: ConditionFn<T>): void;

    public extendConditionAll<T>(checks: { [key: string]: ConditionFn<T> }): void;

    public update<T>(object: T, spec: Spec<T>, options?: OptionsDisallowUnset): T;
    public update<T>(object: T, spec: UnsettableSpec<T>, options: OptionsAllowUnset): T | typeof UNSET_TOKEN;

    public combine<T>(specs: Spec<T>[]): Spec<T>;

    public makeConditionPredicate<T>(condition: Condition<T>[]): (v: T) => boolean;

    public invariant(
      condition: any,
      message?: string | (() => string),
    ): asserts condition;
  }

  const defaultContext: Context;
  export const UNSET_TOKEN: typeof defaultContext.UNSET_TOKEN;
  export const update: typeof defaultContext.update;
  export const combine: typeof defaultContext.combine;
  export const invariant: typeof defaultContext.invariant;

  export default defaultContext;
}
