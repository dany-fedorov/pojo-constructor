import type { PojoConstructorCachingProxySync } from './PojoConstructorPropsSync';

export class PojoConstructorHelpersHostSync<Pojo extends object, CtorInput = unknown> {
  constructor(
    public readonly cache: PojoConstructorCachingProxySync<Pojo, CtorInput>,
  ) {}
}
