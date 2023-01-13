import type { PojoConstructorProxyAsync } from './PojoConstructorPropsAsync';

export class PojoConstructorHelpersHostAsync<
  Pojo extends object,
  CtorInput = unknown,
> {
  constructor(
    public readonly cache: PojoConstructorProxyAsync<Pojo, CtorInput>,
    public readonly proxy: PojoConstructorProxyAsync<Pojo, CtorInput>,
  ) {}
}
