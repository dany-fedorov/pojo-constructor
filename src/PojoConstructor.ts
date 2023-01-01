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

export type PojoConstructorCachingProxy<T extends object, Input = unknown> = {
  [K in keyof T]: K extends string
    ? (input?: Input) => PojoSyncOrPromiseResult<T[K]>
    : never;
};

export type PojoConstructor<T extends object, Input = unknown> = {
  [K in keyof T]: K extends string
    ? (
        input: Input,
        cachingProxy: PojoConstructorCachingProxy<T, Input>,
      ) => PojoSyncOrPromiseResult<T[K]>
    : unknown;
};

export type ConstructPojoCatchFnOptions = {
  pojoConstructorThrownInKey: string;
  pojoConstructorThrownIn: [string, PojoKeyProcessingStage][];
  pojoConstructorSequentialIndex: number | null;
};

export type ConstructPojoOptions<T extends object, Input> = {
  keys?: () => (keyof T)[];
  sortKeys?: (keys: (keyof T)[]) => (keyof T)[];
  concurrency?: number;
  cacheKeyFromConstructorInput?: (input?: Input) => unknown;
  catch?: (caught: unknown, options: ConstructPojoCatchFnOptions) => unknown;
};

export function constructPojoFromInstance<T extends object, Input = unknown>(
  ctorInstance: PojoConstructor<T, Input>,
  constructPojoInput?: Input,
  constructPojoOptions?: ConstructPojoOptions<T, Input>,
): PojoSyncAndPromiseResult<T> {
  const sortedKeys = getSortedKeysForPojoConstructorInstance(
    ctorInstance,
    constructPojoOptions,
  );
  const cacheKeyFn =
    typeof constructPojoOptions?.cacheKeyFromConstructorInput === 'function'
      ? constructPojoOptions?.cacheKeyFromConstructorInput
      : (x?: Input) => x;

  const syncCache = new PojoConstructorCacheMap();
  const asyncCache = new PojoConstructorCacheMap();
  const cachingProxy = new Proxy(ctorInstance, {
    get(target: PojoConstructor<T, Input>, key: string | symbol): any {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const propv = target[key];
      if (typeof key === 'symbol' || typeof propv !== 'function') {
        return propv;
      }
      return function constructPojo_cachingProxyIntercepted(
        interceptedInputArg?: Input,
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
    return pojo as T;
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
      return pojo as T;
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
      return pojo as T;
    }
  };
  return {
    sync: constructPojoSync,
    promise: constructPojoPromise,
  };
}

export function constructPojo<T extends object, Input = unknown>(
  CTorClass: { new (input?: Input): PojoConstructor<T, Input> },
  constructPojoInput?: Input,
  constructPojoOptions?: ConstructPojoOptions<T, Input>,
): PojoSyncAndPromiseResult<T> {
  return constructPojoFromInstance(
    new CTorClass(constructPojoInput),
    constructPojoInput,
    constructPojoOptions,
  );
}
