import type { PojoConstructorSyncAndAsyncHelpersHost } from './PojoConstructorSyncAndAsyncHelpersHost';

export type PojoKeyProcessingStage =
  | 'key-method'
  | 'glue-code'
  | 'async-result-method'
  | 'sync-result-method'
  | 'promise';

export type PojoConstructorPropMethodValue<T> = undefined extends T
  ? {
      value?: T;
    }
  : {
      value: T;
    };

export type PojoSyncAndAsyncResult<T> = {
  sync: () => T;
  async: () => Promise<T>;
};

export type PojoSyncResult<T> = {
  sync: () => T;
  async?: never;
};

export type PojoAsyncResult<T> = {
  sync?: never;
  async: () => Promise<T>;
};

export type PojoSyncOrPromiseResult<T> =
  | PojoSyncAndAsyncResult<T>
  | PojoSyncResult<T>
  | PojoAsyncResult<T>;

export type PojoConstructorSyncAndAsyncProxy<
  Pojo extends object,
  CtorInput = unknown,
> = {
  [K in keyof Pojo]: K extends string
    ? (
        input?: CtorInput,
      ) => PojoSyncOrPromiseResult<PojoConstructorPropMethodValue<Pojo[K]>>
    : never;
};

export type PojoConstructorSyncAndAsyncProps<
  Pojo extends object,
  CtorInput = unknown,
> = {
  [K in keyof Pojo]: K extends string
    ? (
        input: CtorInput,
        helpers: PojoConstructorSyncAndAsyncHelpersHost<Pojo, CtorInput>,
      ) => PojoSyncOrPromiseResult<PojoConstructorPropMethodValue<Pojo[K]>>
    : unknown;
};
