import pMap from '@esm2cjs/p-map';
import {
  PojoConstructorCannotAsyncResolveError,
  PojoConstructorCannotSyncResolveError,
  PojoKeyProcessingStage,
} from './errors';
import { getSortedKeysForPojoConstructorInstance } from './getSortedKeysForPojoConstructorInstance';
import { PojoConstructorCacheMap } from './PojoConstructorCacheMap';
import { processCaughtInCachingProxy } from './processCaughtInCachingProxy';

export type PojoSyncAndPromiseResult<T> = {
  sync: () => T;
  promise: () => Promise<T>;
};

export type PojoSyncResult<T> = {
  sync: () => T;
  promise?: never;
};

export type PojoPromiseResult<T> = {
  sync?: never;
  promise: () => Promise<T>;
};

export type PojoSyncOrPromiseResult<T> =
  | PojoSyncAndPromiseResult<T>
  | PojoSyncResult<T>
  | PojoPromiseResult<T>;

export type PojoConstructorCachingProxy<
  Pojo extends object,
  CtorInput = unknown,
> = {
  [K in keyof Pojo]: K extends string
    ? (input?: CtorInput) => PojoSyncOrPromiseResult<Pojo[K]>
    : never;
};

/**
 * A generic type that makes "Combined Sync + Async Pojo Constructor object" type from `Pojo` object type.
 *
 * Turns
 * ```typescript
 * type Pojo = {
 *   a: string;
 *   b: number;
 * }
 * ```
 *
 * To
 * ```typescript
 * type PojoCtor = {
 *   a: (input, cachingProxy) => PojoSyncOrPromiseResult<string>
 *   b: (input, cachingProxy) => PojoSyncOrPromiseResult<number>
 * }
 * ```
 *
 * Check out documentation in README for working example with this type.
 *
 * @param Pojo - A result object that will be produced by this Pojo Constructor.
 * @param CtorInput - An input type that will be passed to each property constructor method.
 */
export type PojoConstructor<Pojo extends object, CtorInput = unknown> = {
  [K in keyof Pojo]: K extends string
    ? (
        input: CtorInput,
        cachingProxy: PojoConstructorCachingProxy<Pojo, CtorInput>,
      ) => PojoSyncOrPromiseResult<Pojo[K]>
    : unknown;
};

export type ConstructPojoCatchFnOptions = {
  pojoConstructorThrownInKey: string;
  pojoConstructorThrownIn: [string, PojoKeyProcessingStage][];
  pojoConstructorSequentialIndex: number | null;
};

export type ConstructPojoOptions<Pojo extends object, CtorInput> = {
  /**
   * A function that produces a list of string property names that should be applied to the Pojo Constructor.
   *
   * @default
   * By default, {@link extractMethodKeysForPojoConstructorInstance} function is applied.<br>
   * It works like this:
   * - Use Object.getOwnPropertyNames on ctor
   * - Keep only typeof "function" properties and exclude "constructor" property
   * - Exclude keys that are not string
   * - Recur for prototype of ctor
   */
  keys?: () => Extract<keyof Pojo, string>[];
  /**
   * A function that takes property names produces either by `keys` function or by default {@link extractMethodKeysForPojoConstructorInstance} function
   * and returns them sorted.
   * Property names will be processed in this order, unless `concurrency` option is set.
   *
   * @default
   * By default property names are sorted lexicographically.
   */
  sortKeys?: (
    keys: Extract<keyof Pojo, string>[],
  ) => Extract<keyof Pojo, string>[];
  /**
   * Minimum num value is `1`.
   *
   * If this option is set, uses [p-map](https://www.npmjs.com/package/p-map) to process properties in async mode.
   * This is passed through as `concurrency` option of [p-map](https://www.npmjs.com/package/p-map) lib.
   */
  concurrency?: number;
  /**
   * Function that should produce a cache key from constructor input.
   * Used by `cachingProxy` to only evaluate property once.
   * Default is identity function - `(x) => x`
   */
  cacheKeyFromConstructorInput?: (input?: CtorInput) => unknown;
  /**
   * Is called when property constructor method throws an error.
   */
  catch?: (caught: unknown, options: ConstructPojoCatchFnOptions) => unknown;
};

/**
 * Returns object with `sync`, `promise` functions that can be called to build
 * an object from `ctor` in sync or async mode.
 *
 * In sync mode, only `sync` functions returned by property methods are called.
 * In async mode, `promise` functions returned by property methods are called, but when there is no `promise` function, async mode falls back to `sync` function.
 *
 * @param ctor - Object conforming to {@link PojoConstructor | PojoConstructor<Pojo, CtorInput>}`.
 * @param constructPojoInput - An input that will be passed to each property constructor method.
 * @param constructPojoOptions
 */
export function constructPojoFromInstance<
  Pojo extends object,
  CtorInput = unknown,
>(
  ctorInstance: PojoConstructor<Pojo, CtorInput>,
  constructPojoInput?: CtorInput,
  constructPojoOptions?: ConstructPojoOptions<Pojo, CtorInput>,
): PojoSyncAndPromiseResult<Pojo> {
  const sortedKeys = getSortedKeysForPojoConstructorInstance(
    ctorInstance,
    constructPojoOptions,
  );
  const cacheKeyFn =
    typeof constructPojoOptions?.cacheKeyFromConstructorInput === 'function'
      ? constructPojoOptions?.cacheKeyFromConstructorInput
      : (x?: CtorInput) => x;

  const syncCache = new PojoConstructorCacheMap();
  const asyncCache = new PojoConstructorCacheMap();
  const cachingProxy = new Proxy(ctorInstance, {
    get(target: PojoConstructor<Pojo, CtorInput>, key: string | symbol): any {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const propv = target[key];
      if (typeof key === 'symbol' || typeof propv !== 'function') {
        return propv;
      }
      return function constructPojo_cachingProxyIntercepted(
        interceptedInputArg?: CtorInput,
      ) {
        const inputCacheKey = cacheKeyFn(interceptedInputArg);
        return {
          sync: () => {
            if (syncCache.has(key, inputCacheKey)) {
              return syncCache.get(key, inputCacheKey);
            }
            let res;
            try {
              res = (target as any)[key].call(
                target,
                interceptedInputArg,
                cachingProxy,
              );
            } catch (caught) {
              throw processCaughtInCachingProxy(caught, [
                key as string,
                'key-method',
              ]);
            }
            if (!res.sync) {
              throw new PojoConstructorCannotSyncResolveError(
                `${constructPojo_cachingProxyIntercepted.name}->sync`,
                key as string,
                res,
              );
            }
            let v;
            try {
              v = res.sync();
            } catch (caught: unknown) {
              throw processCaughtInCachingProxy(caught, [
                key as string,
                'sync-result-method',
              ]);
            }
            syncCache.set(key, inputCacheKey, v);
            return v;
          },
          promise: async () => {
            if (asyncCache.has(key, inputCacheKey)) {
              return asyncCache.get(key, inputCacheKey);
            }
            let res;
            try {
              res = (target as any)[key].call(
                target,
                interceptedInputArg,
                cachingProxy,
              );
            } catch (caught: unknown) {
              throw processCaughtInCachingProxy(caught, [
                key as string,
                'key-method',
              ]);
            }
            let v;
            if (typeof res?.promise === 'function') {
              let vpromise;
              try {
                vpromise = res?.promise();
              } catch (caught: unknown) {
                throw processCaughtInCachingProxy(caught, [
                  key as string,
                  'promise-result-method',
                ]);
              }
              asyncCache.set(key, inputCacheKey, vpromise);
              try {
                v = await vpromise;
              } catch (caught: unknown) {
                throw processCaughtInCachingProxy(caught, [
                  key as string,
                  'promise',
                ]);
              }
            } else if (typeof res?.sync === 'function') {
              try {
                v = res?.sync();
              } catch (caught: unknown) {
                throw processCaughtInCachingProxy(caught, [
                  key as string,
                  'sync-result-method',
                ]);
              }
              syncCache.set(key, inputCacheKey, v);
            } else {
              throw new PojoConstructorCannotAsyncResolveError(
                `${constructPojo_cachingProxyIntercepted.name}->promise`,
                key as string,
                res,
              );
            }
            return v;
          },
        };
      };
    },
  });
  const doCatch = (caught: unknown, i: number | null, key: string) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    caught.pojoConstructorThrownInKey = key;
    if (typeof constructPojoOptions?.catch !== 'function') {
      throw caught;
    }
    return constructPojoOptions?.catch(caught, {
      pojoConstructorThrownInKey: key,
      pojoConstructorThrownIn: (caught as any)?.pojoConstructorThrownIn ?? [
        key,
        'unknown',
      ],
      pojoConstructorSequentialIndex: i,
    });
  };
  const constructPojoSync = () => {
    const pojo: any = {};
    let i = 0;
    for (const k of sortedKeys) {
      let v;
      let setv = false;
      try {
        v = (cachingProxy as any)[k](constructPojoInput).sync();
        setv = true;
      } catch (caught: unknown) {
        doCatch(caught, i, k);
      }
      if (setv) {
        pojo[k] = v;
      }
      i++;
    }
    return pojo as Pojo;
  };
  const constructPojoPromise = async () => {
    const concurrency = constructPojoOptions?.concurrency;
    if (concurrency) {
      const pojo = Object.fromEntries(
        (
          await pMap(
            sortedKeys,
            async (k) => {
              let v;
              let setv = false;
              try {
                v = await (cachingProxy as any)
                  [k](constructPojoInput)
                  .promise();
                setv = true;
              } catch (caught) {
                await doCatch(caught, null, k);
              }
              if (setv) {
                return [[k, v]];
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
          v = await (cachingProxy as any)[k](constructPojoInput).promise();
          setv = true;
        } catch (caught) {
          await doCatch(caught, i, k);
        }
        if (setv) {
          pojo[k] = v;
        }
        i++;
      }
      return pojo as Pojo;
    }
  };
  return {
    sync: constructPojoSync,
    promise: constructPojoPromise,
  };
}

/**
 * Wrapper for {@link constructPojoFromInstance}.<br>
 * Instantiates `CTorClass` passing `constructPojoInput` to constructor.
 *
 * @param CTorClass - Class object (constructor function).
 * @param constructPojoInput - An input that will be passed to each property constructor method.
 * @param constructPojoOptions
 */
export function constructPojo<Pojo extends object, CtorInput = unknown>(
  CTorClass: { new (input?: CtorInput): PojoConstructor<Pojo, CtorInput> },
  constructPojoInput?: CtorInput,
  constructPojoOptions?: ConstructPojoOptions<Pojo, CtorInput>,
): PojoSyncAndPromiseResult<Pojo> {
  return constructPojoFromInstance(
    new CTorClass(constructPojoInput),
    constructPojoInput,
    constructPojoOptions,
  );
}
