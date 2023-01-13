import type { PojoConstructorProxy } from './PojoConstructorProps';

export class PojoConstructorHelpersHost<
  Pojo extends object,
  CtorInput = unknown,
> {
  constructor(
    public readonly cache: PojoConstructorProxy<Pojo, CtorInput>,
    public readonly proxy: PojoConstructorProxy<Pojo, CtorInput>,
  ) {}
}
