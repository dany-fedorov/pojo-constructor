import type { PojoConstructorSyncAndAsyncOptions } from '../PojoConstructorSyncAndAsync/PojoConstructorSyncAndAsyncOptions';

export type PojoConstructorAsyncOptions<
  Pojo extends object,
  CtorInput,
> = PojoConstructorSyncAndAsyncOptions<Pojo, CtorInput>;
