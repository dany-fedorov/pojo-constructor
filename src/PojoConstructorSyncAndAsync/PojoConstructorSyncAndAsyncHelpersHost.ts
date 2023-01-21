import type {
  PojoConstructorSyncAndAsyncProps,
  PojoConstructorSyncAndAsyncProxy,
} from './PojoConstructorSyncAndAsyncProps';

export class PojoConstructorHelpersHostBase<
  Pojo extends object,
  CtorInput = unknown,
> {
  constructor(
    public readonly cache: PojoConstructorSyncAndAsyncProxy<Pojo, CtorInput>,
    public readonly proxy: PojoConstructorSyncAndAsyncProxy<Pojo, CtorInput>,
  ) {}

  forKey(key: Extract<keyof Pojo, string>): PojoConstructorHelpersHostForKey<Pojo, CtorInput> {
    return new PojoConstructorHelpersHostForKey(key, this.cache, this.proxy);
  }
}

export class PojoConstructorHelpersHostForKey<
  Pojo extends object,
  CtorInput = unknown,
> extends PojoConstructorHelpersHostBase<Pojo, CtorInput> {
  constructor(
    public readonly key: Extract<keyof Pojo, string>,
    cache: PojoConstructorSyncAndAsyncProxy<Pojo, CtorInput>,
    proxy: PojoConstructorSyncAndAsyncProxy<Pojo, CtorInput>,
  ) {
    super(cache, proxy);
  }

  forTarget(
    target: PojoConstructorSyncAndAsyncProps<Pojo, CtorInput>,
  ): PojoConstructorSyncAndAsyncHelpersHost<Pojo, CtorInput> {
    return new PojoConstructorSyncAndAsyncHelpersHost(
      target,
      this.key,
      this.cache,
      this.proxy,
    );
  }
}

export class PojoConstructorSyncAndAsyncHelpersHost<
  Pojo extends object,
  CtorInput = unknown,
> extends PojoConstructorHelpersHostBase<Pojo, CtorInput> {
  constructor(
    public readonly target: PojoConstructorSyncAndAsyncProps<Pojo, CtorInput>,
    public readonly key: Extract<keyof Pojo, string>,
    cache: PojoConstructorSyncAndAsyncProxy<Pojo, CtorInput>,
    proxy: PojoConstructorSyncAndAsyncProxy<Pojo, CtorInput>,
  ) {
    super(cache, proxy);
  }
}
