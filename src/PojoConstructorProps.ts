import type { PojoConstructorHelpersHost } from './PojoConstructorHelpersHost';

export type PojoKeyProcessingStage =
  | 'key-method'
  | 'glue-code'
  | 'promise-result-method'
  | 'sync-result-method'
  | 'promise'

export type PojoConstructorPropMethodValue<T> = undefined extends T
  ? {
      value?: T;
    }
  : {
      value: T;
    };

export type PojoSyncAndPromiseResult<T> = {
  sync: () => T;
  promise: () => Promise<T>;
};

export type PojoSyncResult<T> = {
  sync: () => T;
  promise?: never;
};

export type PojoPromiseResult<T> = {
  sync?: never;
  promise: () => Promise<T>;
};

export type PojoSyncOrPromiseResult<T> =
  | PojoSyncAndPromiseResult<T>
  | PojoSyncResult<T>
  | PojoPromiseResult<T>;

export type PojoConstructorCachingProxy<
  Pojo extends object,
  CtorInput = unknown,
> = {
  [K in keyof Pojo]: K extends string
    ? (
        input?: CtorInput,
      ) => PojoSyncOrPromiseResult<PojoConstructorPropMethodValue<Pojo[K]>>
    : never;
};

export type PojoConstructorProps<Pojo extends object, CtorInput> = {
  [K in keyof Pojo]: K extends string
    ? (
        input: CtorInput,
        helpers: PojoConstructorHelpersHost<Pojo, CtorInput>,
      ) => PojoSyncOrPromiseResult<PojoConstructorPropMethodValue<Pojo[K]>>
    : unknown;
};
