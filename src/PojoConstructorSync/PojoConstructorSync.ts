import { PojoConstructor } from '../PojoConstructor/PojoConstructor';
import type { PojoConstructorOptionsSync } from './PojoConstructorOptionsSync';
import type {
  PojoConstructorCachingProxySync,
  PojoConstructorPropsSync,
} from './PojoConstructorPropsSync';
import type {
  PojoConstructorCachingProxy,
  PojoConstructorProps,
} from '../PojoConstructor/PojoConstructorProps';
import { decoratePojoConstructorMethods } from '../PojoConstructor/PojoConstructorProxiesHost';
import type { PojoConstructorHelpersHost } from '../PojoConstructor/PojoConstructorHelpersHost';
import { PojoConstructorHelpersHostSync } from './PojoConstructorHelpersHostSync';

function cachingProxy2Sync<Pojo extends object, CtorInput = unknown>(
  cachingProxy: PojoConstructorCachingProxy<Pojo, CtorInput>,
) {
  return decoratePojoConstructorMethods(cachingProxy, (target, key) => {
    return function PojoConstructor_cachingProxy2Sync_decoratorFn(
      input: CtorInput,
    ) {
      return (target as any)[key](input).sync();
    };
  }) as PojoConstructorCachingProxySync<Pojo, CtorInput>;
}

function syncProps2Props<Pojo extends object, CtorInput = unknown>(
  constructorProps: PojoConstructorPropsSync<Pojo, CtorInput>,
): PojoConstructorProps<Pojo, CtorInput> {
  return decoratePojoConstructorMethods(constructorProps, (target, key) => {
    return function PojoConstructor_asyncProps2Props_decoratorFn(
      input: CtorInput,
      helpers: PojoConstructorHelpersHost<Pojo, CtorInput>,
    ) {
      function PojoConstructor_asyncProps2Props_decoratorFn_sync() {
        return (target as any)[key](
          input,
          new PojoConstructorHelpersHostSync(
            cachingProxy2Sync<Pojo, CtorInput>(helpers.cache),
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
        promise: PojoConstructor_asyncProps2Props_decoratorFn_promise,
      };
    };
  }) as PojoConstructorProps<Pojo, CtorInput>;
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
  public readonly pojoConstructor: PojoConstructor<Pojo, CtorInput>;

  constructor(
    public readonly constructorProps: PojoConstructorPropsSync<Pojo, CtorInput>,
    public readonly constructorOptions?: PojoConstructorOptionsSync<
      Pojo,
      CtorInput
    >,
  ) {
    this.pojoConstructor = new PojoConstructor<Pojo, CtorInput>(
      syncProps2Props(this.constructorProps),
      this.constructorOptions,
    );
  }

  new(
    input?: CtorInput,
    options?: PojoConstructorOptionsSync<Pojo, CtorInput>,
  ): Pojo {
    return this.pojoConstructor.new(input, options).sync!();
  }
}
