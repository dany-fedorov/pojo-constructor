import { PojoConstructorSyncAndAsync } from '../PojoConstructorSyncAndAsync/PojoConstructorSyncAndAsync';
import type { PojoConstructorSyncOptions } from './PojoConstructorSyncOptions';
import type {
  PojoConstructorSyncProxy,
  PojoConstructorSyncProps,
} from './PojoConstructorSyncProps';
import type {
  PojoConstructorSyncAndAsyncProxy,
  PojoConstructorSyncAndAsyncProps,
} from '../PojoConstructorSyncAndAsync/PojoConstructorSyncAndAsyncProps';
import { decoratePojoConstructorMethods } from '../PojoConstructorSyncAndAsync/PojoConstructorSyncAndAsyncProxiesHost';
import type { PojoConstructorSyncAndAsyncHelpersHost } from '../PojoConstructorSyncAndAsync/PojoConstructorSyncAndAsyncHelpersHost';
import { PojoConstructorSyncHelpersHost } from './PojoConstructorSyncHelpersHost';

function cachingProxy2Sync<Pojo extends object, CtorInput = unknown>(
  cachingProxy: PojoConstructorSyncAndAsyncProxy<Pojo, CtorInput>,
) {
  return decoratePojoConstructorMethods(cachingProxy, (target, key) => {
    return function PojoConstructor_cachingProxy2Sync_decoratorFn(
      input: CtorInput,
    ) {
      return (target as any)[key](input).sync();
    };
  }) as PojoConstructorSyncProxy<Pojo, CtorInput>;
}

function syncProps2Props<Pojo extends object, CtorInput = unknown>(
  constructorProps: PojoConstructorSyncProps<Pojo, CtorInput>,
): PojoConstructorSyncAndAsyncProps<Pojo, CtorInput> {
  return decoratePojoConstructorMethods(constructorProps, (target, key) => {
    return function PojoConstructor_asyncProps2Props_decoratorFn(
      input: CtorInput,
      helpers: PojoConstructorSyncAndAsyncHelpersHost<Pojo, CtorInput>,
    ) {
      function PojoConstructor_asyncProps2Props_decoratorFn_sync() {
        return (target as any)[key](
          input,
          new PojoConstructorSyncHelpersHost(
            target,
            helpers.key,
            cachingProxy2Sync<Pojo, CtorInput>(helpers.cache),
            cachingProxy2Sync<Pojo, CtorInput>(helpers.proxy),
          ),
        );
      }

      function PojoConstructor_asyncProps2Props_decoratorFn_promise() {
        return Promise.resolve(
          PojoConstructor_asyncProps2Props_decoratorFn_sync(),
        );
      }

      return {
        sync: PojoConstructor_asyncProps2Props_decoratorFn_sync,
        async: PojoConstructor_asyncProps2Props_decoratorFn_promise,
      };
    };
  }) as PojoConstructorSyncAndAsyncProps<Pojo, CtorInput>;
}

/**
 * Constructor methods for each of properties returns `{ value }` object synchronously.
 *
 * @usage
 * ```typescript
 * const ctor = new PojoConstructorSync<{ field: number }, number>({ field: (input) => ({ value: input + 2 }) })
 * const obj = ctor.new(2);
 * assert.strictEqual(obj.field, 4);
 * ```
 */
export class PojoConstructorSync<Pojo extends object, CtorInput = unknown> {
  public readonly pojoConstructor: PojoConstructorSyncAndAsync<Pojo, CtorInput>;

  constructor(
    public readonly constructorProps: PojoConstructorSyncProps<Pojo, CtorInput>,
    public readonly constructorOptions?: PojoConstructorSyncOptions<
      Pojo,
      CtorInput
    >,
  ) {
    this.pojoConstructor = new PojoConstructorSyncAndAsync<Pojo, CtorInput>(
      syncProps2Props(this.constructorProps),
      this.constructorOptions,
    );
  }

  new(
    input?: CtorInput,
    options?: PojoConstructorSyncOptions<Pojo, CtorInput>,
  ): Pojo {
    return this.pojoConstructor.new(input, options).sync!();
  }
}
