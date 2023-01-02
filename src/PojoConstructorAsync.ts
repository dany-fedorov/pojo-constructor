import pMap from '@esm2cjs/p-map';
import type { ConstructPojoOptions } from './PojoConstructor';
import { getSortedKeysForPojoConstructorInstance } from './getSortedKeysForPojoConstructorInstance';
import { PojoConstructorCacheMap } from './PojoConstructorCacheMap';
import { processCaughtInCachingProxy } from './processCaughtInCachingProxy';

export type PojoConstructorAsyncCachingProxy<
  Pojo extends object,
  CtorInput = unknown,
> = {
  [K in keyof Pojo]: K extends string
    ? (input?: CtorInput) => Promise<Pojo[K]>
    : never;
};

/**
 * A generic type that makes "Async Pojo Constructor object" type from `Pojo` object type.
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
 *   a: (input, cachingProxy) => Promise<string>
 *   b: (input, cachingProxy) => Promise<number>
 * }
 * ```
 *
 * @param Pojo - A result object that will be produced by this Pojo Constructor.
 * @param CtorInput - An input type that will be passed to each property constructor method.
 */
export type PojoConstructorAsync<Pojo extends object, CtorInput = unknown> = {
  [K in keyof Pojo]: K extends string
    ? (
        input: CtorInput,
        cachingProxy: PojoConstructorAsyncCachingProxy<Pojo, CtorInput>,
      ) => Promise<Pojo[K]>
    : unknown;
};

export type ConstructPojoAsyncOptions<
  Pojo extends object,
  CtorInput,
> = ConstructPojoOptions<Pojo, CtorInput>;

/**
 * Builds an object from `ctor` in async mode by calling property constructor methods.
 *
 * @param ctor - Object conforming to {@link PojoConstructorAsync | PojoConstructorAsync<Pojo, CtorInput>}`.
 * @param constructPojoInput - An input that will be passed to each property constructor method.
 * @param constructPojoOptions
 */
export async function constructPojoFromInstanceAsync<
  Pojo extends object,
  CtorInput = unknown,
>(
  ctor: PojoConstructorAsync<Pojo, CtorInput>,
  constructPojoInput?: CtorInput,
  constructPojoOptions?: ConstructPojoAsyncOptions<Pojo, CtorInput>,
): Promise<Pojo> {
  const sortedKeys = getSortedKeysForPojoConstructorInstance(
    ctor,
    constructPojoOptions,
  );
  const cacheKeyFn =
    typeof constructPojoOptions?.cacheKeyFromConstructorInput === 'function'
      ? constructPojoOptions?.cacheKeyFromConstructorInput
      : (x?: CtorInput) => x;

  const asyncCache = new PojoConstructorCacheMap();
  const cachingProxy = new Proxy(ctor, {
    get(
      target: PojoConstructorAsync<Pojo, CtorInput>,
      key: string | symbol,
    ): any {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const propv = target[key];
      if (typeof key === 'symbol' || typeof propv !== 'function') {
        return propv;
      }
      return async function constructPojoAsync_cachingProxyIntercepted(
        interceptedInputArg?: CtorInput,
      ) {
        const inputCacheKey = cacheKeyFn(interceptedInputArg);

        if (asyncCache.has(key, inputCacheKey)) {
          return asyncCache.get(key, inputCacheKey);
        }
        let vpromise;
        try {
          vpromise = (target as any)[key].call(
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
        asyncCache.set(key, inputCacheKey, vpromise);
        let v;
        try {
          v = await vpromise;
        } catch (caught) {
          throw processCaughtInCachingProxy(caught, [key as string, 'promise']);
        }
        return v;
      };
    },
  });
  const concurrency = constructPojoOptions?.concurrency;
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
  if (concurrency) {
    const pojo = Object.fromEntries(
      (
        await pMap(
          sortedKeys,
          async (k) => {
            let v;
            let setv = false;
            try {
              v = await (cachingProxy as any)[k](constructPojoInput);
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
        v = await (cachingProxy as any)[k](constructPojoInput);
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
}

/**
 * Wrapper for {@link constructPojoFromInstanceAsync}.<br>
 * Instantiates `CTorClass` passing `constructPojoInput` to constructor.
 *
 * @param CTorClass - Class object (constructor function).
 * @param constructPojoInput - An input that will be passed to each property constructor method.
 * @param constructPojoOptions
 */
export async function constructPojoAsync<
  Pojo extends object,
  CtorInput = unknown,
>(
  CTorClass: { new (input?: CtorInput): PojoConstructorAsync<Pojo, CtorInput> },
  constructPojoInput?: CtorInput,
  constructPojoOptions?: ConstructPojoAsyncOptions<Pojo, CtorInput>,
): Promise<Pojo> {
  return constructPojoFromInstanceAsync(
    new CTorClass(constructPojoInput),
    constructPojoInput,
    constructPojoOptions,
  );
}
