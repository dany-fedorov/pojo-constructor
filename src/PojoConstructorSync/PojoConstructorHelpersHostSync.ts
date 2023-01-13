import type { PojoConstructorProxySync } from './PojoConstructorPropsSync';

export class PojoConstructorHelpersHostSync<Pojo extends object, CtorInput = unknown> {
  constructor(
    public readonly cache: PojoConstructorProxySync<Pojo, CtorInput>,
    public readonly proxy: PojoConstructorProxySync<Pojo, CtorInput>,
  ) {}
}
