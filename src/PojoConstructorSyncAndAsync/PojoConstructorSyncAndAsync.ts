import pMap from '@esm2cjs/p-map';
import { getSortedKeysForPojoConstructorSyncAndAsyncProps } from './getSortedKeysForPojoConstructorSyncAndAsyncProps';
import type {
  PojoConstructorSyncAndAsyncProps,
  PojoSyncAndAsyncResult,
} from './PojoConstructorSyncAndAsyncProps';
import type { PojoConstructorSyncAndAsyncOptions } from './PojoConstructorSyncAndAsyncOptions';
import { PojoConstructorSyncAndAsyncProxiesHost } from './PojoConstructorSyncAndAsyncProxiesHost';
import { PojoConstructorHelpersHostBase } from './PojoConstructorSyncAndAsyncHelpersHost';

function makePojoSyncConstructor<Pojo extends object, CtorInput>(
  proxiesHost: PojoConstructorSyncAndAsyncProxiesHost<Pojo, CtorInput>,
  sortedKeys: string[],
  input: CtorInput | undefined,
  doCatch: (caught: unknown, i: number | null, key: string) => void,
) {
  return function constructPojoSync() {
    const pojo: any = {};
    let i = 0;
    for (const k of sortedKeys) {
      let v;
      let setv = false;
      try {
        v = (proxiesHost.cachingProxy as any)[k]
          .call(proxiesHost.errorCatchingProxy, input)
          .sync();
        setv = true;
      } catch (caught: unknown) {
        doCatch(caught, i, k);
      }
      if (setv && 'value' in v) {
        pojo[k] = v.value;
      }
      i++;
    }
    return pojo as Pojo;
  };
}

function makePojoPromiseConstructor<Pojo extends object, CtorInput>(
  proxiesHost: PojoConstructorSyncAndAsyncProxiesHost<Pojo, CtorInput>,
  sortedKeys: string[],
  input: CtorInput | undefined,
  doCatch: (caught: unknown, i: number | null, key: string) => void,
  effectiveOptions: PojoConstructorSyncAndAsyncOptions<Pojo, CtorInput>,
) {
  return async function constructPojoPromise() {
    const concurrency = effectiveOptions?.concurrency;
    if (concurrency) {
      const pojo = Object.fromEntries(
        (
          await pMap(
            sortedKeys,
            async (k) => {
              let v;
              let setv = false;
              try {
                v = await (proxiesHost.cachingProxy as any)[k]
                  .call(proxiesHost.errorCatchingProxy, input)
                  .async();
                setv = true;
              } catch (caught) {
                await doCatch(caught, null, k);
              }
              if (setv && 'value' in v) {
                return [[k, v.value]];
              } else {
                return [];
              }
            },
            {
              concurrency,
            },
          )
        ).flat(),
      );
      return pojo as Pojo;
    } else {
      const pojo: any = {};
      let i = 0;
      for (const k of sortedKeys) {
        let v;
        let setv = false;
        try {
          v = await (proxiesHost.cachingProxy as any)[k]
            .call(proxiesHost.errorCatchingProxy, input)
            .async();
          setv = true;
        } catch (caught) {
          await doCatch(caught, i, k);
        }
        if (setv && 'value' in v) {
          pojo[k] = v.value;
        }
        i++;
      }
      return pojo as Pojo;
    }
  };
}

/**
 * Can operate in both sync mode and async mode.<br>
 * Constructor methods for each of properties returns an object with either one of `sync`, `promise` methods or both.
 *
 * All of these are valid:<br>
 *
 * - `{ sync, promise }`.
 * - `{ sync }`.
 * - `{ promise }`.
 *
 * Where
 *
 * - `promise` - returns promise for `{ value }` object
 * - `sync` - returns `{ value }` object synchronously
 *
 * If you only specify `sync` methods, you can use them for "async mode" (calling `PojoConstructor#new().async()`),
 * but you cannot use "sync mode" (calling `PojoConstructor#new().sync()`) if you only specify `promise` methods.
 *
 * You can specify `promise` methods for some fields and still construct an object in "sync mode" if you also specify a `catch` option.
 * `catch` will be called each time constructing a property fails, but all properties that do not fail will be added to resulting object.
 *
 * @usage
 * ```typescript
 * // Sync mode
 * const ctor = new PojoConstructor<{ field: number }, number>({ field: (input) => ({ sync: () => ({ value: input + 2 })}) })
 * const obj = ctor.new(2).sync();
 * assert.strictEqual(obj.field, 4);
 * ```
 *
 * ```typescript
 * // Async mode
 * const ctor = new PojoConstructor<{ field: number }, number>({ field: (input) => ({ async: () => ({ value: input + 2 })}) })
 * const obj = await ctor.new(2).async();
 * assert.strictEqual(obj.field, 4);
 * ```
 */
export class PojoConstructorSyncAndAsync<
  Pojo extends object,
  CtorInput = unknown,
> {
  constructor(
    public readonly props: PojoConstructorSyncAndAsyncProps<Pojo, CtorInput>,
    public readonly options?: PojoConstructorSyncAndAsyncOptions<
      Pojo,
      CtorInput
    >,
  ) {}

  new(
    input?: CtorInput,
    options?: PojoConstructorSyncAndAsyncOptions<Pojo, CtorInput>,
  ): PojoSyncAndAsyncResult<Pojo> {
    const effectiveOptions: PojoConstructorSyncAndAsyncOptions<
      Pojo,
      CtorInput
    > = {
      ...(this.options ?? {}),
      ...(options ?? {}),
    };
    const sortedKeys = getSortedKeysForPojoConstructorSyncAndAsyncProps(
      this.props,
      effectiveOptions,
    );
    const helpersHost = Object.create(null) as PojoConstructorHelpersHostBase<
      Pojo,
      CtorInput
    >;
    const proxiesHost = new PojoConstructorSyncAndAsyncProxiesHost(
      this.props,
      input,
      helpersHost,
      typeof effectiveOptions.cacheKeyFromConstructorInput !== 'function'
        ? {}
        : {
            cacheKeyFromConstructorInput:
              effectiveOptions.cacheKeyFromConstructorInput,
          },
    );
    const helpersHostPrototype = new PojoConstructorHelpersHostBase(
      proxiesHost.cachingProxy,
      proxiesHost.errorCatchingProxy,
    );
    Object.setPrototypeOf(helpersHost, helpersHostPrototype);
    const doCatch = (caught: unknown, i: number | null, key: string) => {
      if (typeof effectiveOptions?.catch !== 'function') {
        throw caught;
      }
      return effectiveOptions?.catch(caught, {
        key,
        keysStack: [...((caught as any).pojoConstructorStack ?? [])],
        keySequentialIndex: i,
      });
    };
    return {
      sync: makePojoSyncConstructor<Pojo, CtorInput>(
        proxiesHost,
        sortedKeys,
        input,
        doCatch,
      ),
      async: makePojoPromiseConstructor<Pojo, CtorInput>(
        proxiesHost,
        sortedKeys,
        input,
        doCatch,
        effectiveOptions,
      ),
    };
  }
}
