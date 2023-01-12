import type { PojoConstructorCachingProxyAsync } from './PojoConstructorPropsAsync';

export class PojoConstructorHelpersHostAsync<Pojo extends object, CtorInput = unknown> {
  constructor(
    public readonly cache: PojoConstructorCachingProxyAsync<Pojo, CtorInput>,
  ) {}
}
