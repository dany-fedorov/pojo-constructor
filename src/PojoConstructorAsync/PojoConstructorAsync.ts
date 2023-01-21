import { PojoConstructorSyncAndAsync } from '../PojoConstructorSyncAndAsync/PojoConstructorSyncAndAsync';
import type { PojoConstructorAsyncOptions } from './PojoConstructorAsyncOptions';
import type {
  PojoConstructorAsyncProxy,
  PojoConstructorAsyncProps,
} from './PojoConstructorAsyncProps';
import type {
  PojoConstructorSyncAndAsyncProxy,
  PojoConstructorSyncAndAsyncProps,
} from '../PojoConstructorSyncAndAsync/PojoConstructorSyncAndAsyncProps';
import { PojoConstructorAsyncHelpersHost } from './PojoConstructorAsyncHelpersHost';
import { decoratePojoConstructorMethods } from '../PojoConstructorSyncAndAsync/PojoConstructorSyncAndAsyncProxiesHost';
import type { PojoConstructorSyncAndAsyncHelpersHost } from '../PojoConstructorSyncAndAsync/PojoConstructorSyncAndAsyncHelpersHost';

function cachingProxy2Async<Pojo extends object, CtorInput = unknown>(
  cachingProxy: PojoConstructorSyncAndAsyncProxy<Pojo, CtorInput>,
) {
  return decoratePojoConstructorMethods(cachingProxy, (target, key) => {
    return function PojoConstructor_cachingProxy2Async_decoratorFn(
      input: CtorInput,
    ) {
      return (target as any)[key](input).promise();
    };
  }) as PojoConstructorAsyncProxy<Pojo, CtorInput>;
}

function asyncProps2Props<Pojo extends object, CtorInput = unknown>(
  constructorProps: PojoConstructorAsyncProps<Pojo, CtorInput>,
) {
  return decoratePojoConstructorMethods(constructorProps, (target, key) => {
    return function PojoConstructor_asyncProps2Props_decoratorFn(
      input: CtorInput,
      helpers: PojoConstructorSyncAndAsyncHelpersHost<Pojo, CtorInput>,
    ) {
      return {
        promise: () => {
          return (target as any)[key](
            input,
            new PojoConstructorAsyncHelpersHost(
              target,
              helpers.key,
              cachingProxy2Async<Pojo, CtorInput>(helpers.cache),
              cachingProxy2Async<Pojo, CtorInput>(helpers.proxy),
            ),
          );
        },
      };
    };
  }) as PojoConstructorSyncAndAsyncProps<Pojo, CtorInput>;
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
  public readonly pojoConstructor: PojoConstructorSyncAndAsync<Pojo, CtorInput>;

  constructor(
    public readonly constructorProps: PojoConstructorAsyncProps<
      Pojo,
      CtorInput
    >,
    public readonly constructorOptions?: PojoConstructorAsyncOptions<
      Pojo,
      CtorInput
    >,
  ) {
    this.pojoConstructor = new PojoConstructorSyncAndAsync<Pojo, CtorInput>(
      asyncProps2Props(this.constructorProps),
      this.constructorOptions,
    );
  }

  new(
    input?: CtorInput,
    options?: PojoConstructorAsyncOptions<Pojo, CtorInput>,
  ): Promise<Pojo> {
    return this.pojoConstructor.new(input, options).promise!();
  }
}
