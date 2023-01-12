import type { PojoConstructorPropMethodValue } from '../PojoConstructor/PojoConstructorProps';
import type { PojoConstructorHelpersHostSync } from './PojoConstructorHelpersHostSync';

export type PojoConstructorCachingProxySync<
  Pojo extends object,
  CtorInput = unknown,
> = {
  [K in keyof Pojo]: K extends string
    ? (input?: CtorInput) => PojoConstructorPropMethodValue<Pojo[K]>
    : never;
};

export type PojoConstructorPropsSync<
  Pojo extends object,
  CtorInput = unknown,
> = {
  [K in keyof Pojo]: K extends string
    ? (
        input: CtorInput,
        helpers: PojoConstructorHelpersHostSync<Pojo, CtorInput>,
      ) => PojoConstructorPropMethodValue<Pojo[K]>
    : unknown;
};
