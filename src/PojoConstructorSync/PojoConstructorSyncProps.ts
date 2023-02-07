import type { PojoConstructorPropMethodResult } from '../PojoConstructorSyncAndAsync/PojoConstructorSyncAndAsyncProps';
import type { PojoConstructorSyncHelpersHost } from './PojoConstructorSyncHelpersHost';

export type PojoConstructorSyncProxy<
  Pojo extends object,
  CtorInput = unknown,
> = {
  [K in keyof Pojo]: K extends string
    ? (input?: CtorInput) => PojoConstructorPropMethodResult<Pojo[K]>
    : never;
};

export type PojoConstructorSyncProps<
  Pojo extends object,
  CtorInput = unknown,
> = {
  [K in keyof Pojo]: K extends string
    ? (
        input: CtorInput,
        helpers: PojoConstructorSyncHelpersHost<Pojo, CtorInput>,
      ) => PojoConstructorPropMethodResult<Pojo[K]>
    : unknown;
};
