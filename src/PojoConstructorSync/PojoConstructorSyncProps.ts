import type { PojoConstructorPropMethodResult } from '../PojoConstructorSyncAndAsync/PojoConstructorSyncAndAsyncProps';
import type { PojoConstructorSyncHelpersHost } from './PojoConstructorSyncHelpersHost';
import type { PojoConstructorSyncUnboxedHelpersHost } from './PojoConstructorSyncHelpersHost';

export type PojoConstructorSyncProxy<
  Pojo extends object,
  CtorInput = unknown,
> = {
  [K in keyof Pojo]: K extends string
    ? (input?: CtorInput) => PojoConstructorPropMethodResult<Pojo[K]>
    : never;
};

export type PojoConstructorSyncUnboxedProxy<
  Pojo extends object,
  CtorInput = unknown,
> = {
  [K in keyof Pojo]: K extends string ? (input?: CtorInput) => Pojo[K] : never;
};

export type PojoConstructorSyncPropFn<
  Pojo extends object,
  V,
  CtorInput = unknown,
> = (
  input: CtorInput,
  helpers: PojoConstructorSyncHelpersHost<Pojo, CtorInput>,
) => PojoConstructorPropMethodResult<V>;

export type PojoConstructorSyncProps<
  Pojo extends object,
  CtorInput = unknown,
> = {
  [K in keyof Pojo]: K extends string
    ? PojoConstructorSyncPropFn<Pojo, Pojo[K], CtorInput>
    : unknown;
};

export type PojoConstructorSyncUnboxedPropFn<
  Pojo extends object,
  V,
  CtorInput = unknown,
> = (
  input: CtorInput,
  helpers: PojoConstructorSyncUnboxedHelpersHost<Pojo, CtorInput>,
) => V;

export type PojoConstructorSyncUnboxedProps<
  Pojo extends object,
  CtorInput = unknown,
> = {
  [K in keyof Pojo]: K extends string
    ? PojoConstructorSyncUnboxedPropFn<Pojo, Pojo[K], CtorInput>
    : unknown;
};
