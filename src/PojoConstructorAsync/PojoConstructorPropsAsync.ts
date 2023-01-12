import type { PojoConstructorPropMethodValue } from '../PojoConstructor/PojoConstructorProps';
import type { PojoConstructorHelpersHostAsync } from './PojoConstructorHelpersHostAsync';

export type PojoConstructorCachingProxyAsync<
  Pojo extends object,
  CtorInput = unknown,
> = {
  [K in keyof Pojo]: K extends string
    ? (input?: CtorInput) => Promise<PojoConstructorPropMethodValue<Pojo[K]>>
    : never;
};

export type PojoConstructorPropsAsync<Pojo extends object, CtorInput = unknown> = {
  [K in keyof Pojo]: K extends string
    ? (
        input: CtorInput,
        helpers: PojoConstructorHelpersHostAsync<Pojo, CtorInput>,
      ) => Promise<PojoConstructorPropMethodValue<Pojo[K]>>
    : unknown;
};
