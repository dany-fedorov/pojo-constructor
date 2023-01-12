import type { PojoConstructorOptions } from '../PojoConstructor/PojoConstructorOptions';

export type PojoConstructorOptionsAsync<
  Pojo extends object,
  CtorInput,
> = PojoConstructorOptions<Pojo, CtorInput>;
