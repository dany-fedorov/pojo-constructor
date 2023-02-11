import type {
  PojoConstructorSyncAndAsyncProps,
  PojoConstructorSyncAndAsyncProxy,
  PojoConstructorSyncAndAsyncUnboxedProps,
  PojoConstructorSyncAndAsyncUnboxedProxy,
} from './PojoConstructorSyncAndAsyncProps';

export class PojoConstructorSyncAndAsyncHelpersHostBase<
  Pojo extends object,
  CtorInput = unknown,
> {
  constructor(
    public readonly constructorName: string,
    public readonly cache: PojoConstructorSyncAndAsyncProxy<Pojo, CtorInput>,
    public readonly proxy: PojoConstructorSyncAndAsyncProxy<Pojo, CtorInput>,
  ) {}

  forKey(
    key: Extract<keyof Pojo, string>,
  ): PojoConstructorSyncAndAsyncHelpersHostForKey<Pojo, CtorInput> {
    return new PojoConstructorSyncAndAsyncHelpersHostForKey(
      key,
      this.constructorName,
      this.cache,
      this.proxy,
    );
  }
}

export class PojoConstructorSyncAndAsyncUnboxedHelpersHostBase<
  Pojo extends object,
  CtorInput = unknown,
> {
  constructor(
    public readonly cache: PojoConstructorSyncAndAsyncUnboxedProxy<
      Pojo,
      CtorInput
    >,
    public readonly proxy: PojoConstructorSyncAndAsyncUnboxedProxy<
      Pojo,
      CtorInput
    >,
  ) {}

  forKey(
    key: Extract<keyof Pojo, string>,
  ): PojoConstructorSyncAndAsyncUnboxedHelpersHostForKey<Pojo, CtorInput> {
    return new PojoConstructorSyncAndAsyncUnboxedHelpersHostForKey(
      key,
      this.cache,
      this.proxy,
    );
  }
}

export class PojoConstructorSyncAndAsyncHelpersHostForKey<
  Pojo extends object,
  CtorInput = unknown,
> extends PojoConstructorSyncAndAsyncHelpersHostBase<Pojo, CtorInput> {
  constructor(
    public readonly key: Extract<keyof Pojo, string>,
    name: string,
    cache: PojoConstructorSyncAndAsyncProxy<Pojo, CtorInput>,
    proxy: PojoConstructorSyncAndAsyncProxy<Pojo, CtorInput>,
  ) {
    super(name, cache, proxy);
  }

  forTarget(
    target: PojoConstructorSyncAndAsyncProps<Pojo, CtorInput>,
  ): PojoConstructorSyncAndAsyncHelpersHost<Pojo, CtorInput> {
    return new PojoConstructorSyncAndAsyncHelpersHost(
      target,
      this.key,
      this.constructorName,
      this.cache,
      this.proxy,
    );
  }
}

export class PojoConstructorSyncAndAsyncUnboxedHelpersHostForKey<
  Pojo extends object,
  CtorInput = unknown,
> extends PojoConstructorSyncAndAsyncUnboxedHelpersHostBase<Pojo, CtorInput> {
  constructor(
    public readonly key: Extract<keyof Pojo, string>,
    cache: PojoConstructorSyncAndAsyncUnboxedProxy<Pojo, CtorInput>,
    proxy: PojoConstructorSyncAndAsyncUnboxedProxy<Pojo, CtorInput>,
  ) {
    super(cache, proxy);
  }

  forTarget(
    target: PojoConstructorSyncAndAsyncUnboxedProps<Pojo, CtorInput>,
  ): PojoConstructorSyncAndAsyncUnboxedHelpersHost<Pojo, CtorInput> {
    return new PojoConstructorSyncAndAsyncUnboxedHelpersHost(
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
> extends PojoConstructorSyncAndAsyncHelpersHostBase<Pojo, CtorInput> {
  constructor(
    public readonly target: PojoConstructorSyncAndAsyncProps<Pojo, CtorInput>,
    public readonly key: Extract<keyof Pojo, string>,
    constructorName: string,
    cache: PojoConstructorSyncAndAsyncProxy<Pojo, CtorInput>,
    proxy: PojoConstructorSyncAndAsyncProxy<Pojo, CtorInput>,
  ) {
    super(constructorName, cache, proxy);
  }
}

export class PojoConstructorSyncAndAsyncUnboxedHelpersHost<
  Pojo extends object,
  CtorInput = unknown,
> extends PojoConstructorSyncAndAsyncUnboxedHelpersHostBase<Pojo, CtorInput> {
  constructor(
    public readonly target: PojoConstructorSyncAndAsyncUnboxedProps<
      Pojo,
      CtorInput
    >,
    public readonly key: Extract<keyof Pojo, string>,
    cache: PojoConstructorSyncAndAsyncUnboxedProxy<Pojo, CtorInput>,
    proxy: PojoConstructorSyncAndAsyncUnboxedProxy<Pojo, CtorInput>,
  ) {
    super(cache, proxy);
  }
}
