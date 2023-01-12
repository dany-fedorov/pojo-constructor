import type { PojoConstructorOptions } from '../PojoConstructor/PojoConstructorOptions';

export type PojoConstructorOptionsSync<Pojo extends object, CtorInput> = Omit<
  PojoConstructorOptions<Pojo, CtorInput>,
  'concurrency'
>;
