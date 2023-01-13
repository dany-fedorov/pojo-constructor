import { PojoConstructor } from '../PojoConstructor/PojoConstructor';
import type { PojoConstructorOptionsAsync } from './PojoConstructorOptionsAsync';
import type {
  PojoConstructorProxyAsync,
  PojoConstructorPropsAsync,
} from './PojoConstructorPropsAsync';
import type {
  PojoConstructorProxy,
  PojoConstructorProps,
} from '../PojoConstructor/PojoConstructorProps';
import { PojoConstructorHelpersHostAsync } from './PojoConstructorHelpersHostAsync';
import { decoratePojoConstructorMethods } from '../PojoConstructor/PojoConstructorProxiesHost';
import type { PojoConstructorHelpersHost } from '../PojoConstructor/PojoConstructorHelpersHost';

function cachingProxy2Async<Pojo extends object, CtorInput = unknown>(
  cachingProxy: PojoConstructorProxy<Pojo, CtorInput>,
) {
  return decoratePojoConstructorMethods(cachingProxy, (target, key) => {
    return function PojoConstructor_cachingProxy2Async_decoratorFn(
      input: CtorInput,
    ) {
      return (target as any)[key](input).promise();
    };
  }) as PojoConstructorProxyAsync<Pojo, CtorInput>;
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
              target,
              helpers.key,
              cachingProxy2Async<Pojo, CtorInput>(helpers.cache),
              cachingProxy2Async<Pojo, CtorInput>(helpers.proxy),
            ),
          );
        },
      };
    };
  }) as PojoConstructorProps<Pojo, CtorInput>;
}

/**
 * Constructor methods for each of properties returns promise for `{ value }` object.
 *
 * @usage
 * ```typescript
 * const ctor = new PojoConstructorAsync<{ field: number }, number>({ field: async (input) => ({ value: input + 2 }) })
 * const obj = await ctor.new(2);
 * assert.strictEqual(obj.field, 4);
 * ```
 */
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
