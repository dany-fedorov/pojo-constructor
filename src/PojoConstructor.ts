import pMap from '@esm2cjs/p-map';
import {
  PojoConstructorCannotAsyncResolveError,
  PojoConstructorCannotSyncResolveError,
  PojoKeyProcessingStage,
} from './errors';
import { obtainSortedKeys } from './obtainSortedKeys';
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

export type PojoConstructorCachingProxy<T extends object, Input = unknown> = {
  [K in keyof T]: (input?: Input) => PojoSyncOrPromiseResult<T[K]>;
};

export type PojoConstructor<T extends object, Input = unknown> = {
  [K in keyof T]: (
    input: Input,
    cachingProxy: PojoConstructorCachingProxy<T, Input>,
  ) => PojoSyncOrPromiseResult<T[K]>;
};

export type ConstructPojoCatchFnOptions = {
  thrownIn: [string, PojoKeyProcessingStage][];
  sequentialIndex: number | null;
};

export type ConstructPojoOptions<T extends object, Input> = {
  keys?: () => (keyof T)[];
  sortKeys?: (keys: (keyof T)[]) => (keyof T)[];
  concurrency?: number;
  cacheKeyFromConstructorInput?: (input?: Input) => unknown;
  catch?: (caught: unknown, options: ConstructPojoCatchFnOptions) => unknown;
};

export type ConstructPojoResult<T extends object> = {
  value: T;
};

export function constructPojo<T extends object, Input = unknown>(
  ctor: PojoConstructor<T, Input>,
  constructPojoInput?: Input,
  constructPojoOptions?: ConstructPojoOptions<T, Input>,
): PojoSyncAndPromiseResult<ConstructPojoResult<T>> {
  const sortedKeys = obtainSortedKeys(ctor, constructPojoOptions);
  const cacheKeyFn =
    typeof constructPojoOptions?.cacheKeyFromConstructorInput === 'function'
      ? constructPojoOptions?.cacheKeyFromConstructorInput
      : (x?: Input) => x;

  const resolvedCache = new PojoConstructorCacheMap();
  const promisesCache = new PojoConstructorCacheMap();
  const makeCachingProxy = (proxyInput?: Input) =>
    new Proxy(ctor, {
      get(target: PojoConstructor<T, Input>, key: string | symbol): any {
        return function constructPojo_proxyIntercepted(
          interceptedInputArg?: Input,
        ) {
          const resolvedInterceptedInput =
            interceptedInputArg === undefined
              ? proxyInput
              : interceptedInputArg;
          const cacheKey = cacheKeyFn(resolvedInterceptedInput);
          const thisProxy = makeCachingProxy(resolvedInterceptedInput);
          return {
            sync: () => {
              if (resolvedCache.has(key, cacheKey)) {
                return resolvedCache.get(key, cacheKey);
              }
              let res;
              try {
                res = (target as any)[key].call(
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
              if (!res.sync) {
                throw new PojoConstructorCannotSyncResolveError(
                  `${constructPojo_proxyIntercepted.name}->sync`,
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
              resolvedCache.set(key, cacheKey, v);
              return v;
            },
            promise: async () => {
              if (resolvedCache.has(key, cacheKey)) {
                return resolvedCache.get(key, cacheKey);
              }
              if (promisesCache.has(key, cacheKey)) {
                return promisesCache.get(key, cacheKey);
              }
              let res;
              try {
                res = (target as any)[key].call(
                  thisProxy,
                  resolvedInterceptedInput,
                  thisProxy,
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
                promisesCache.set(key, cacheKey, vpromise);
                try {
                  v = await vpromise;
                } catch (caught: unknown) {
                  throw processCaughtInCachingProxy(caught, [
                    key as string,
                    'promise',
                  ]);
                }
                resolvedCache.set(key, cacheKey, v);
              } else if (typeof res?.sync === 'function') {
                try {
                  v = res?.sync();
                } catch (caught: unknown) {
                  throw processCaughtInCachingProxy(caught, [
                    key as string,
                    'sync-result-method',
                  ]);
                }
                resolvedCache.set(key, cacheKey, v);
              } else {
                throw new PojoConstructorCannotAsyncResolveError(
                  `${constructPojo_proxyIntercepted.name}->promise`,
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
  const constructPojoSync = () => {
    const pojo: any = {};
    let i = 0;
    for (const k of sortedKeys) {
      if (typeof k !== 'string') {
        continue;
      }
      let v;
      try {
        v = (allPropsProxy as any)[k]().sync();
      } catch (caught: unknown) {
        doCatch(caught, i, k);
      }
      pojo[k] = v;
      i++;
    }
    return { value: pojo as T };
  };
  const constructPojoPromise = async () => {
    const concurrency = constructPojoOptions?.concurrency;
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
                v = await (allPropsProxy as any)[k]().promise();
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
          v = await (allPropsProxy as any)[k]().promise();
        } catch (caught) {
          await doCatch(caught, i, k);
        }
        pojo[k] = v;
        i++;
      }
      return { value: pojo as T };
    }
  };
  return {
    sync: constructPojoSync,
    promise: constructPojoPromise,
  };
}
