import { PojoConstructor } from '../PojoConstructor/PojoConstructor';
import type { PojoConstructorOptionsAsync } from './PojoConstructorOptionsAsync';
import type {
  PojoConstructorCachingProxyAsync,
  PojoConstructorPropsAsync,
} from './PojoConstructorPropsAsync';
import type {
  PojoConstructorCachingProxy,
  PojoConstructorProps,
} from '../PojoConstructor/PojoConstructorProps';
import { PojoConstructorHelpersHostAsync } from './PojoConstructorHelpersHostAsync';
import { decoratePojoConstructorMethods } from '../PojoConstructor/PojoConstructorProxiesHost';
import type { PojoConstructorHelpersHost } from '../PojoConstructor/PojoConstructorHelpersHost';

function cachingProxy2Async<Pojo extends object, CtorInput = unknown>(
  cachingProxy: PojoConstructorCachingProxy<Pojo, CtorInput>,
) {
  return decoratePojoConstructorMethods(cachingProxy, (target, key) => {
    return function PojoConstructor_cachingProxy2Async_decoratorFn(
      input: CtorInput,
    ) {
      return (target as any)[key](input).promise();
    };
  }) as PojoConstructorCachingProxyAsync<Pojo, CtorInput>;
}

function asyncProps2Props<Pojo extends object, CtorInput = unknown>(
  constructorProps: PojoConstructorPropsAsync<Pojo, CtorInput>,
) {
  return decoratePojoConstructorMethods(constructorProps, (target, key) => {
    return function PojoConstructor_asyncProps2Props_decoratorFn(
      input: CtorInput,
      helpers: PojoConstructorHelpersHost<Pojo, CtorInput>,
    ) {
      return {
        promise: () => {
          return (target as any)[key](
            input,
            new PojoConstructorHelpersHostAsync(
              cachingProxy2Async<Pojo, CtorInput>(helpers.cache),
            ),
          );
        },
      };
    };
  }) as PojoConstructorProps<Pojo, CtorInput>;
}

export class PojoConstructorAsync<Pojo extends object, CtorInput = unknown> {
  public readonly pojoConstructor: PojoConstructor<Pojo, CtorInput>;

  constructor(
    public readonly constructorProps: PojoConstructorPropsAsync<
      Pojo,
      CtorInput
    >,
    public readonly constructorOptions?: PojoConstructorOptionsAsync<
      Pojo,
      CtorInput
    >,
  ) {
    this.pojoConstructor = new PojoConstructor<Pojo, CtorInput>(
      asyncProps2Props(this.constructorProps),
      this.constructorOptions,
    );
  }

  new(
    input?: CtorInput,
    options?: PojoConstructorOptionsAsync<Pojo, CtorInput>,
  ): Promise<Pojo> {
    return this.pojoConstructor.new(input, options).promise!();
  }
}
