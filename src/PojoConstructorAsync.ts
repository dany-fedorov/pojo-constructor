import pMap from '@esm2cjs/p-map';
import type { ConstructPojoOptions } from './PojoConstructor';
import { obtainSortedKeys } from './obtainSortedKeys';
import { PojoConstructorCacheMap } from './PojoConstructorCacheMap';
import { processCaughtInCachingProxy } from './processCaughtInCachingProxy';

export type PojoConstructorAsyncCachingProxy<
  T extends object,
  Input = unknown,
> = {
  [K in keyof T]: (input?: Input) => Promise<T[K]>;
};

export type PojoConstructorAsync<T extends object, Input = unknown> = {
  [K in keyof T]: (
    input: Input,
    cachingProxy: PojoConstructorAsyncCachingProxy<T, Input>,
  ) => Promise<T[K]>;
};

export type ConstructPojoAsyncOptions<
  T extends object,
  Input,
> = ConstructPojoOptions<T, Input>;

export async function constructPojoFromInstanceAsync<
  T extends object,
  Input = unknown,
>(
  ctor: PojoConstructorAsync<T, Input>,
  constructPojoInput?: Input,
  constructPojoOptions?: ConstructPojoAsyncOptions<T, Input>,
): Promise<T> {
  const sortedKeys = obtainSortedKeys(ctor, constructPojoOptions);
  const cacheKeyFn =
    typeof constructPojoOptions?.cacheKeyFromConstructorInput === 'function'
      ? constructPojoOptions?.cacheKeyFromConstructorInput
      : (x?: Input) => x;

  const asyncCache = new PojoConstructorCacheMap();
  const cachingProxy = new Proxy(ctor, {
    get(target: PojoConstructorAsync<T, Input>, key: string | symbol): any {
      return async function constructPojoAsync_proxyIntercepted(
        interceptedInputArg?: Input,
      ) {
        const inputCacheKey = cacheKeyFn(interceptedInputArg);

        if (asyncCache.has(key, inputCacheKey)) {
          return asyncCache.get(key, inputCacheKey);
        }
        let vpromise;
        try {
          vpromise = (target as any)[key].call(
            cachingProxy,
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
    if (typeof constructPojoOptions?.catch !== 'function') {
      throw caught;
    }
    return constructPojoOptions?.catch(caught, {
      thrownIn: (caught as any)?.thrownIn ?? [key, 'unknown'],
      sequentialIndex: i,
    });
  };
  if (concurrency) {
    const pojo = Object.fromEntries(
      (
        await pMap(
          sortedKeys as string[],
          async (k) => {
            if (typeof k !== 'string') {
              return [];
            }
            let v;
            try {
              v = await (cachingProxy as any)[k](constructPojoInput);
            } catch (caught) {
              await doCatch(caught, null, k);
            }
            return [[k, v]];
          },
          {
            concurrency,
          },
        )
      ).flat(),
    );
    return pojo as T;
  } else {
    const pojo: any = {};
    let i = 0;
    for (const k of sortedKeys) {
      if (typeof k !== 'string') {
        continue;
      }
      let v;
      try {
        v = await (cachingProxy as any)[k](constructPojoInput);
      } catch (caught) {
        await doCatch(caught, i, k);
      }
      pojo[k] = v;
      i++;
    }
    return pojo as T;
  }
}

export async function constructPojoAsync<T extends object, Input = unknown>(
  CTorClass: { new (input?: Input): PojoConstructorAsync<T, Input> },
  constructPojoInput?: Input,
  constructPojoOptions?: ConstructPojoAsyncOptions<T, Input>,
): Promise<T> {
  return constructPojoFromInstanceAsync(
    new CTorClass(constructPojoInput),
    constructPojoInput,
    constructPojoOptions,
  );
}
