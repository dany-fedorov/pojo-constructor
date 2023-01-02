import type { ConstructPojoOptions } from './PojoConstructor';
import { getSortedKeysForPojoConstructorInstance } from './getSortedKeysForPojoConstructorInstance';
import { PojoConstructorCacheMap } from './PojoConstructorCacheMap';
import { processCaughtInCachingProxy } from './processCaughtInCachingProxy';
import type { ConstructPojoAsyncOptions } from './PojoConstructorAsync';

export type PojoConstructorSyncCachingProxy<
  Pojo extends object,
  CtorInput = unknown,
> = {
  [K in keyof Pojo]: K extends string ? (input?: CtorInput) => Pojo[K] : never;
};

/**
 * A generic type that makes "Sync Pojo Constructor object" type from `Pojo` object type.
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
 *   a: (input, cachingProxy) => string
 *   b: (input, cachingProxy) => number
 * }
 * ```
 *
 * @param Pojo - A result object that will be produced by this Pojo Constructor.
 * @param CtorInput - An input type that will be passed to each property constructor method.
 */
export type PojoConstructorSync<Pojo extends object, CtorInput = unknown> = {
  [K in keyof Pojo]: K extends string
    ? (
        input: CtorInput,
        cachingProxy: PojoConstructorSyncCachingProxy<Pojo, CtorInput>,
      ) => Pojo[K]
    : unknown;
};

export type ConstructPojoSyncOptions<Pojo extends object, Input> = Omit<
  ConstructPojoOptions<Pojo, Input>,
  'concurrency'
>;

/**
 * Builds an object from `ctor` in sync mode by calling property constructor methods.
 *
 * @param ctor - Object conforming to {@link PojoConstructorSync | PojoConstructorSync<Pojo, CtorInput>}`.
 * @param constructPojoInput - An input that will be passed to each property constructor method.
 * @param constructPojoOptions
 */
export function constructPojoFromInstanceSync<
  Pojo extends object,
  CtorInput = unknown,
>(
  ctor: PojoConstructorSync<Pojo, CtorInput>,
  constructPojoInput?: CtorInput,
  constructPojoOptions?: ConstructPojoSyncOptions<Pojo, CtorInput>,
): Pojo {
  const sortedKeys = getSortedKeysForPojoConstructorInstance(
    ctor,
    constructPojoOptions,
  );
  const cacheKeyFn =
    typeof constructPojoOptions?.cacheKeyFromConstructorInput === 'function'
      ? constructPojoOptions?.cacheKeyFromConstructorInput
      : (x?: CtorInput) => x;

  const syncCache = new PojoConstructorCacheMap();
  const cachingProxy = new Proxy(ctor, {
    get(
      target: PojoConstructorSync<Pojo, CtorInput>,
      key: string | symbol,
    ): any {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const propv = target[key];
      if (typeof key === 'symbol' || typeof propv !== 'function') {
        return propv;
      }
      return function constructPojoSync_cachingProxyIntercepted(
        interceptedInputArg?: CtorInput,
      ) {
        const inputCacheKey = cacheKeyFn(interceptedInputArg);

        if (syncCache.has(key, inputCacheKey)) {
          return syncCache.get(key, inputCacheKey);
        }
        let v;
        try {
          v = (target as any)[key].call(
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
        syncCache.set(key, inputCacheKey, v);
        return v;
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
  const pojo: any = {};
  let i = 0;
  for (const k of sortedKeys) {
    let v;
    let setv = false;
    try {
      v = (cachingProxy as any)[k](constructPojoInput);
      setv = true;
    } catch (caught) {
      doCatch(caught, i, k);
    }
    if (setv) {
      pojo[k] = v;
    }
    i++;
  }
  return pojo as Pojo;
}

/**
 * Wrapper for {@link constructPojoFromInstanceSync}.<br>
 * Instantiates `CTorClass` passing `constructPojoInput` to constructor.
 *
 * @param CTorClass - Class object (constructor function).
 * @param constructPojoInput - An input that will be passed to each property constructor method.
 * @param constructPojoOptions
 */
export function constructPojoSync<Pojo extends object, CtorInput = unknown>(
  CTorClass: { new (input?: CtorInput): PojoConstructorSync<Pojo, CtorInput> },
  constructPojoInput?: CtorInput,
  constructPojoOptions?: ConstructPojoAsyncOptions<Pojo, CtorInput>,
): Pojo {
  return constructPojoFromInstanceSync(
    new CTorClass(constructPojoInput),
    constructPojoInput,
    constructPojoOptions,
  );
}
