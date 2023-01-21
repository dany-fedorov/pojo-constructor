import type { PojoConstructorSyncAndAsyncOptions } from '../PojoConstructorSyncAndAsync/PojoConstructorSyncAndAsyncOptions';

export type PojoConstructorSyncOptions<Pojo extends object, CtorInput> = Omit<
  PojoConstructorSyncAndAsyncOptions<Pojo, CtorInput>,
  'concurrency'
>;
