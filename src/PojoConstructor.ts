import pMap from '@esm2cjs/p-map';
import {
  PojoConstructorCannotAsyncResolveError,
  PojoConstructorCannotSyncResolveError,
} from './errors';
import { obtainSortedKeys } from './obtainSortedKeys';
import { PojoConstructorCacheMap } from './PojoConstructorCacheMap';

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

export type PojoConstructorCachingProxy<T extends object, Input = unknown> = {
  [K in keyof T]: (input?: Input) => PojoSyncOrPromiseResult<T[K]>;
};

export type PojoConstructor<T extends object, Input = unknown> = {
  [K in keyof T]: (
    input: Input,
    cachingProxy: PojoConstructorCachingProxy<T, Input>,
  ) => PojoSyncOrPromiseResult<T[K]>;
};

export type ConstructPojoOptions<T extends object, Input> = {
  keys?: () => (keyof T)[];
  sortKeys?: (keys: (keyof T)[]) => (keyof T)[];
  concurrency?: number;
  cacheKey?: (input?: Input) => unknown;
};

export function constructPojo<T extends object, Input = unknown>(
  ctor: PojoConstructor<T, Input>,
  constructPojoInput?: Input,
  constructPojoOptions?: ConstructPojoOptions<T, Input>,
): PojoSyncAndPromiseResult<T> {
  const sortedKeys = obtainSortedKeys(ctor, constructPojoOptions);
  const cacheKeyFn =
    typeof constructPojoOptions?.cacheKey === 'function'
      ? constructPojoOptions?.cacheKey
      : (x?: Input) => x;

  const resolvedCache = new PojoConstructorCacheMap();
  const promisesCache = new PojoConstructorCacheMap();
  const proxy = (proxyInput?: Input) =>
    new Proxy(ctor, {
      get(target: PojoConstructor<T, Input>, p: string | symbol): any {
        return function constructPojo_proxyIntercepted(
          interceptedInputArg?: Input,
        ) {
          const resolvedInterceptedInput =
            interceptedInputArg === undefined
              ? proxyInput
              : interceptedInputArg;
          const key = cacheKeyFn(resolvedInterceptedInput);
          const thisProxy = proxy(resolvedInterceptedInput);
          return {
            sync: () => {
              if (resolvedCache.has(p, key)) {
                return resolvedCache.get(p, key);
              }
              const res = (target as any)[p].call(
                thisProxy,
                resolvedInterceptedInput,
                thisProxy,
              );
              if (!res.sync) {
                throw new PojoConstructorCannotSyncResolveError(
                  `${constructPojo_proxyIntercepted.name}->sync`,
                  p as string,
                  res,
                );
              }
              const v = res.sync();
              resolvedCache.set(p, key, v);
              return v;
            },
            promise: async () => {
              if (resolvedCache.has(p, key)) {
                return resolvedCache.get(p, key);
              }
              if (promisesCache.has(p, key)) {
                return promisesCache.get(p, key);
              }
              const res = (target as any)[p].call(
                thisProxy,
                resolvedInterceptedInput,
                thisProxy,
              );
              let v;
              if (typeof res?.promise === 'function') {
                const vpromise = res?.promise();
                promisesCache.set(p, key, vpromise);
                v = await vpromise;
                resolvedCache.set(p, key, v);
              } else if (typeof res?.sync === 'function') {
                v = res?.sync();
                resolvedCache.set(p, key, v);
              } else {
                throw new PojoConstructorCannotAsyncResolveError(
                  `${constructPojo_proxyIntercepted.name}->promise`,
                  p as string,
                  res,
                );
              }
              return v;
            },
          };
        };
      },
    });
  const allPropsProxy = proxy(constructPojoInput);
  const constructPojoSync = () => {
    const pojo: any = {};
    for (const k of sortedKeys) {
      const res = (allPropsProxy as any)[k]();
      if (typeof res?.sync !== 'function') {
        throw new PojoConstructorCannotSyncResolveError(
          `${constructPojo.name}->sync`,
          k as string,
          res,
        );
      }
      const v = res.sync();
      pojo[k] = v;
    }
    return pojo as T;
  };
  const constructPojoPromise = async () => {
    const concurrency = constructPojoOptions?.concurrency;
    if (concurrency) {
      const pojo = Object.fromEntries(
        await pMap(
          sortedKeys as string[],
          async (k) => {
            const v = await (allPropsProxy as any)[k]().promise();
            return [k, v];
          },
          {
            concurrency,
          },
        ),
      );
      return pojo as T;
    } else {
      const pojo: any = {};
      for (const k of sortedKeys) {
        const v = await (allPropsProxy as any)[k]().promise();
        pojo[k] = v;
      }
      return pojo as T;
    }
  };
  return {
    sync: constructPojoSync,
    promise: constructPojoPromise,
  };
}
