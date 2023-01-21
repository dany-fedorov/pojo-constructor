import type { PojoConstructorPropMethodValue } from '../PojoConstructorSyncAndAsync/PojoConstructorSyncAndAsyncProps';
import type { PojoConstructorSyncHelpersHost } from './PojoConstructorSyncHelpersHost';

export type PojoConstructorSyncProxy<
  Pojo extends object,
  CtorInput = unknown,
> = {
  [K in keyof Pojo]: K extends string
    ? (input?: CtorInput) => PojoConstructorPropMethodValue<Pojo[K]>
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
      ) => PojoConstructorPropMethodValue<Pojo[K]>
    : unknown;
};
