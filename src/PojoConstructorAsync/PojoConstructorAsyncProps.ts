import type { PojoConstructorPropMethodResult } from '../PojoConstructorSyncAndAsync/PojoConstructorSyncAndAsyncProps';
import type { PojoConstructorAsyncHelpersHost } from './PojoConstructorAsyncHelpersHost';
import type { PojoConstructorAsyncUnboxedHelpersHost } from './PojoConstructorAsyncHelpersHost';

export type PojoConstructorAsyncProxy<
  Pojo extends object,
  CtorInput = unknown,
> = {
  [K in keyof Pojo]: K extends string
    ? (input?: CtorInput) => Promise<PojoConstructorPropMethodResult<Pojo[K]>>
    : never;
};

export type PojoConstructorAsyncUnboxedProxy<
  Pojo extends object,
  CtorInput = unknown,
> = {
  [K in keyof Pojo]: K extends string
    ? (input?: CtorInput) => Promise<Pojo[K]>
    : never;
};

export type PojoConstructorAsyncPropFn<
  Pojo extends object,
  V,
  CtorInput = unknown,
> = (
  input: CtorInput,
  helpers: PojoConstructorAsyncHelpersHost<Pojo, CtorInput>,
) => Promise<PojoConstructorPropMethodResult<V>>;

export type PojoConstructorAsyncProps<
  Pojo extends object,
  CtorInput = unknown,
> = {
  [K in keyof Pojo]: K extends string
    ? PojoConstructorAsyncPropFn<Pojo, Pojo[K], CtorInput>
    : unknown;
};

export type PojoConstructorAsyncUnboxedPropFn<
  Pojo extends object,
  V,
  CtorInput = unknown,
> = (
  input: CtorInput,
  helpers: PojoConstructorAsyncUnboxedHelpersHost<Pojo, CtorInput>,
) => Promise<V>;

export type PojoConstructorAsyncUnboxedProps<
  Pojo extends object,
  CtorInput = unknown,
> = {
  [K in keyof Pojo]: K extends string
    ? PojoConstructorAsyncUnboxedPropFn<Pojo, Pojo[K], CtorInput>
    : unknown;
};
