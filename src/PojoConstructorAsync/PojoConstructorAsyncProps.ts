import type { PojoConstructorPropMethodValue } from '../PojoConstructorSyncAndAsync/PojoConstructorSyncAndAsyncProps';
import type { PojoConstructorAsyncHelpersHost } from './PojoConstructorAsyncHelpersHost';

export type PojoConstructorAsyncProxy<
  Pojo extends object,
  CtorInput = unknown,
> = {
  [K in keyof Pojo]: K extends string
    ? (input?: CtorInput) => Promise<PojoConstructorPropMethodValue<Pojo[K]>>
    : never;
};

export type PojoConstructorAsyncProps<Pojo extends object, CtorInput = unknown> = {
  [K in keyof Pojo]: K extends string
    ? (
        input: CtorInput,
        helpers: PojoConstructorAsyncHelpersHost<Pojo, CtorInput>,
      ) => Promise<PojoConstructorPropMethodValue<Pojo[K]>>
    : unknown;
};
