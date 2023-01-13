import type {
  PojoConstructorProps,
  PojoConstructorProxy,
} from './PojoConstructorProps';

export class PojoConstructorHelpersHostBase<
  Pojo extends object,
  CtorInput = unknown,
> {
  constructor(
    public readonly cache: PojoConstructorProxy<Pojo, CtorInput>,
    public readonly proxy: PojoConstructorProxy<Pojo, CtorInput>,
  ) {}

  forKey(key: string): PojoConstructorHelpersHostForKey<Pojo, CtorInput> {
    return new PojoConstructorHelpersHostForKey(key, this.cache, this.proxy);
  }
}

export class PojoConstructorHelpersHostForKey<
  Pojo extends object,
  CtorInput = unknown,
> extends PojoConstructorHelpersHostBase<Pojo, CtorInput> {
  constructor(
    public readonly key: string,
    cache: PojoConstructorProxy<Pojo, CtorInput>,
    proxy: PojoConstructorProxy<Pojo, CtorInput>,
  ) {
    super(cache, proxy);
  }

  forTarget(
    target: PojoConstructorProps<Pojo, CtorInput>,
  ): PojoConstructorHelpersHost<Pojo, CtorInput> {
    return new PojoConstructorHelpersHost(
      target,
      this.key,
      this.cache,
      this.proxy,
    );
  }
}

export class PojoConstructorHelpersHost<
  Pojo extends object,
  CtorInput = unknown,
> extends PojoConstructorHelpersHostBase<Pojo, CtorInput> {
  constructor(
    public readonly target: PojoConstructorProps<Pojo, CtorInput>,
    public readonly key: string,
    cache: PojoConstructorProxy<Pojo, CtorInput>,
    proxy: PojoConstructorProxy<Pojo, CtorInput>,
  ) {
    super(cache, proxy);
  }
}
