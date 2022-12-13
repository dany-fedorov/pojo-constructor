import pMap from '@esm2cjs/p-map';
import {
  PojoConstructorCannotAsyncResolveError,
  PojoConstructorCannotSyncResolveError,
} from './errors';
import { obtainSortedKeys } from './obtainSortedKeys';

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

export type PojoConstructorMethodCallOptions<
  T extends object,
  Input = unknown,
> = {
  cachingProxy: PojoCachingProxy<T, Input>;
};

export type PojoCachingProxy<T extends object, Input = unknown> = {
  [K in keyof T]: (input?: Input) => PojoSyncOrPromiseResult<T[K]>;
};

export type PojoConstructor<T extends object, Input = unknown> = {
  [K in keyof T]: (
    input: Input,
    options: PojoConstructorMethodCallOptions<T, Input>,
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
  input?: Input,
  options?: ConstructPojoOptions<T, Input>,
): PojoSyncAndPromiseResult<T> {
  const sortedKeys = obtainSortedKeys(ctor, options);

  const resolvedMap: any = {};
  const promisesMap: any = {};
  const cacheKeyFn =
    typeof options?.cacheKey === 'function'
      ? options?.cacheKey
      : (x?: Input) => x;
  const proxy = new Proxy(ctor, {
    get(target: PojoConstructor<T, Input>, p: string | symbol): any {
      const syncRes = Object.prototype.hasOwnProperty.call(resolvedMap, p);
      const promiseRes = Object.prototype.hasOwnProperty.call(promisesMap, p);
      // console.log('proxyGet', { syncRes, p });
      return function constructPojo_proxyIntercepted(
        input: Input,
        options: PojoConstructorMethodCallOptions<T, Input>,
      ) {
        const key = cacheKeyFn(input);
        return {
          sync: () => {
            if (syncRes && resolvedMap?.[p]?.has?.(key)) {
              return resolvedMap?.[p]?.get?.(key);
            }
            const v = (target as any)[p].call(proxy, input, options).sync();
            if (!resolvedMap[p]) {
              resolvedMap[p] = new Map();
            }
            resolvedMap[p].set(key, v);
            return v;
          },
          promise: async () => {
            if (syncRes && resolvedMap?.[p]?.has?.(key)) {
              return resolvedMap?.[p]?.get?.(key);
            }
            if (promiseRes && promisesMap?.[p]?.has?.(key)) {
              return promisesMap?.[p]?.get?.(key);
            }
            const res = (target as any)[p].call(proxy, input, options);
            const fn =
              typeof res?.promise === 'function' ? res.promise : res?.sync;
            if (typeof fn !== 'function') {
              throw new PojoConstructorCannotAsyncResolveError(
                `${constructPojo_proxyIntercepted.name}->promise`,
                p as string,
                res,
              );
            }
            const vpromise = await fn();
            if (!promisesMap[p]) {
              promisesMap[p] = new Map();
            }
            promisesMap[p].set(key, vpromise);
            const v = await vpromise;
            if (!resolvedMap[p]) {
              resolvedMap[p] = new Map();
            }
            resolvedMap[p].set(key, v);
            return v;
          },
        };
      };
    },
  });
  const sync = () => {
    const pojo: any = {};
    for (const k of sortedKeys) {
      const res = (proxy as any)[k].call(proxy, input, { cachingProxy: proxy });
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
  const promise = async () => {
    const concurrency = options?.concurrency;
    if (concurrency) {
      const pojo = Object.fromEntries(
        await pMap(
          sortedKeys as string[],
          async (k) => {
            const res = (proxy as any)[k].call(proxy, input, {
              cachingProxy: proxy,
            });
            const fn =
              typeof res?.promise === 'function' ? res.promise : res?.sync;
            if (typeof fn !== 'function') {
              throw new PojoConstructorCannotAsyncResolveError(
                `${constructPojo.name}->promise`,
                k,
                res,
              );
            }
            const fnp = fn();
            const v = await fnp;
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
        const res = (proxy as any)[k].call(proxy, input, {
          cachingProxy: proxy,
        });
        const fn = typeof res?.promise === 'function' ? res.promise : res?.sync;
        if (typeof fn !== 'function') {
          throw new PojoConstructorCannotAsyncResolveError(
            `${constructPojo.name}->promise`,
            k as string,
            res,
          );
        }
        const fnp = fn();
        const v = await fnp;
        pojo[k] = v;
      }
      return pojo as T;
    }
  };
  return {
    sync,
    promise,
  };
}
