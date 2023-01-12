import type { PojoConstructorCachingProxy } from './PojoConstructorProps';

export class PojoConstructorHelpersHost<Pojo extends object, CtorInput = unknown> {
  constructor(
    public readonly cache: PojoConstructorCachingProxy<Pojo, CtorInput>,
  ) {}
}
