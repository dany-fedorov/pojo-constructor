import pMap from '@esm2cjs/p-map';
import type {
  ConstructPojoOptions,
  ConstructPojoResult,
} from './PojoConstructor';
import { obtainSortedKeys } from './obtainSortedKeys';
import { PojoConstructorCacheMap } from './PojoConstructorCacheMap';

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
    typeof constructPojoOptions?.cacheKeyFromInput === 'function'
      ? constructPojoOptions?.cacheKeyFromInput
      : (x?: Input) => x;

  const resolvedCache = new PojoConstructorCacheMap();
  const promisesCache = new PojoConstructorCacheMap();
  const makeCachingProxy = (proxyInput?: Input) =>
    new Proxy(ctor, {
      get(target: PojoConstructorAsync<T, Input>, p: string | symbol): any {
        return async function constructPojoAsync_proxyIntercepted(
          interceptedInputArg?: Input,
        ) {
          const resolvedInterceptedInput =
            interceptedInputArg === undefined
              ? proxyInput
              : interceptedInputArg;
          const key = cacheKeyFn(resolvedInterceptedInput);
          const thisProxy = makeCachingProxy(resolvedInterceptedInput);

          if (resolvedCache.has(p, key)) {
            return resolvedCache.get(p, key);
          }
          if (promisesCache.has(p, key)) {
            return promisesCache.get(p, key);
          }
          const vpromise = (target as any)[p].call(
            thisProxy,
            resolvedInterceptedInput,
            thisProxy,
          );
          promisesCache.set(p, key, vpromise);
          const v = await vpromise;
          resolvedCache.set(p, key, v);
          return v;
        };
      },
    });

  const concurrency = constructPojoOptions?.concurrency;
  const allPropsProxy = makeCachingProxy(constructPojoInput);
  if (concurrency) {
    const pojo = Object.fromEntries(
      await pMap(
        sortedKeys as string[],
        async (k) => {
          const v = await (allPropsProxy as any)[k]();
          return [k, v];
        },
        {
          concurrency,
        },
      ),
    );
    return { value: pojo as T };
  } else {
    const pojo: any = {};
    for (const k of sortedKeys) {
      const v = await (allPropsProxy as any)[k]();
      pojo[k] = v;
    }
    return { value: pojo as T };
  }
}
