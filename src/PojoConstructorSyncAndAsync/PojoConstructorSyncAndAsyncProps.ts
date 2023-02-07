import type { PojoConstructorSyncAndAsyncHelpersHost } from './PojoConstructorSyncAndAsyncHelpersHost';

export type PojoKeyProcessingStage =
  | 'key-method'
  | 'glue-code'
  | 'async-result-method'
  | 'sync-result-method'
  | 'promise';

export type PojoConstructorPropMetadataType = unknown;

export type PojoMetadata<Pojo extends object> = Partial<
  Record<keyof Pojo, PojoConstructorPropMetadataType>
>;

export type PojoConstructorResult<Pojo extends object> = {
  value: Pojo;
  metadata?: PojoMetadata<Pojo>;
};

export type PojoConstructorPropMethodResult<V> = undefined extends V
  ? {
      value?: V;
      metadata?: PojoConstructorPropMetadataType;
    }
  : {
      value: V;
      metadata?: PojoConstructorPropMetadataType;
    };

export type PojoSyncAndAsyncResult<V> = {
  sync: () => V;
  async: () => Promise<V>;
};

export type PojoSyncResult<V> = {
  sync: () => V;
  async?: never;
};

export type PojoAsyncResult<V> = {
  sync?: never;
  async: () => Promise<V>;
};

export type PojoSyncOrPromiseResult<V> =
  | PojoSyncAndAsyncResult<V>
  | PojoSyncResult<V>
  | PojoAsyncResult<V>;

export type PojoConstructorSyncAndAsyncProxy<
  Pojo extends object,
  CtorInput = unknown,
> = {
  [K in keyof Pojo]: K extends string
    ? (
        input?: CtorInput,
      ) => PojoSyncOrPromiseResult<PojoConstructorPropMethodResult<Pojo[K]>>
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
      ) => PojoSyncOrPromiseResult<PojoConstructorPropMethodResult<Pojo[K]>>
    : unknown;
};
