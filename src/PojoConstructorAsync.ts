import pMap from '@esm2cjs/p-map';
import type {
  ConstructPojoOptions,
  ConstructPojoResult,
} from './PojoConstructor';
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

export async function constructPojoAsync<T extends object, Input = unknown>(
  ctor: PojoConstructorAsync<T, Input>,
  constructPojoInput?: Input,
  constructPojoOptions?: ConstructPojoAsyncOptions<T, Input>,
): Promise<ConstructPojoResult<T>> {
  const sortedKeys = obtainSortedKeys(ctor, constructPojoOptions);
  const cacheKeyFn =
    typeof constructPojoOptions?.cacheKeyFromConstructorInput === 'function'
      ? constructPojoOptions?.cacheKeyFromConstructorInput
      : (x?: Input) => x;

  const resolvedCache = new PojoConstructorCacheMap();
  const promisesCache = new PojoConstructorCacheMap();
  const makeCachingProxy = (proxyInput?: Input) =>
    new Proxy(ctor, {
      get(target: PojoConstructorAsync<T, Input>, key: string | symbol): any {
        return async function constructPojoAsync_proxyIntercepted(
          interceptedInputArg?: Input,
        ) {
          const resolvedInterceptedInput =
            interceptedInputArg === undefined
              ? proxyInput
              : interceptedInputArg;
          const cachingKey = cacheKeyFn(resolvedInterceptedInput);
          const thisProxy = makeCachingProxy(resolvedInterceptedInput);

          if (resolvedCache.has(key, cachingKey)) {
            return resolvedCache.get(key, cachingKey);
          }
          if (promisesCache.has(key, cachingKey)) {
            return promisesCache.get(key, cachingKey);
          }
          let vpromise;
          try {
            vpromise = (target as any)[key].call(
              thisProxy,
              resolvedInterceptedInput,
              thisProxy,
            );
          } catch (caught) {
            throw processCaughtInCachingProxy(caught, [
              key as string,
              'key-method',
            ]);
          }
          promisesCache.set(key, cachingKey, vpromise);
          let v;
          try {
            v = await vpromise;
          } catch (caught) {
            throw processCaughtInCachingProxy(caught, [
              key as string,
              'promise',
            ]);
          }
          resolvedCache.set(key, cachingKey, v);
          return v;
        };
      },
    });
  const concurrency = constructPojoOptions?.concurrency;
  const allPropsProxy = makeCachingProxy(constructPojoInput);
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
              v = await (allPropsProxy as any)[k]();
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
    return { value: pojo as T };
  } else {
    const pojo: any = {};
    let i = 0;
    for (const k of sortedKeys) {
      if (typeof k !== 'string') {
        continue;
      }
      let v;
      try {
        v = await (allPropsProxy as any)[k]();
      } catch (caught) {
        await doCatch(caught, i, k);
      }
      pojo[k] = v;
      i++;
    }
    return { value: pojo as T };
  }
}
