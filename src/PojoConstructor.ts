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

export type PojoConstructor<T extends object, Input = unknown> = {
  [K in keyof T]: (input: Input) => PojoSyncOrPromiseResult<T[K]>;
};

export type ConstructPojoOptions<T extends object, Input> = {
  input?: Input;
  keys?: () => (keyof T)[];
  sortKeys?: (keys: (keyof T)[]) => (keyof T)[];
  concurrency?: number;
};

export function pojoFrom<T extends object, Input = unknown>(
  ctor: PojoConstructor<T, Input>,
  options?: ConstructPojoOptions<T, Input>,
): PojoSyncAndPromiseResult<T> {
  const sortedKeys = obtainSortedKeys(ctor, options);

  const resolvedMap: any = {};
  const promisesMap: any = {};
  const proxy = new Proxy(ctor, {
    get(target: PojoConstructor<T, Input>, p: string | symbol): any {
      const syncRes = Object.prototype.hasOwnProperty.call(resolvedMap, p);
      const promiseRes = Object.prototype.hasOwnProperty.call(promisesMap, p);
      if (syncRes || promiseRes) {
        return function pojoFrom_proxyIntercepted() {
          return {
            ...(!syncRes ? {} : { sync: () => resolvedMap[p] }),
            ...(!promiseRes ? {} : { promise: () => promisesMap[p] }),
          };
        };
      }
      return (target as any)[p];
    },
  });
  const sync = () => {
    const pojo: any = {};
    for (const k of sortedKeys) {
      const res = (proxy as any)[k](options?.input);
      if (typeof res?.sync !== 'function') {
        throw new PojoConstructorCannotSyncResolveError(
          `${pojoFrom.name}->sync`,
          k as string,
          res,
        );
      }
      const v = res.sync(options?.input);
      resolvedMap[k] = v;
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
            const res = (proxy as any)[k](options?.input);
            const fn =
              typeof res?.promise === 'function' ? res.promise : res?.sync;
            if (typeof fn !== 'function') {
              throw new PojoConstructorCannotAsyncResolveError(
                `${pojoFrom.name}->promise`,
                k,
                res,
              );
            }
            const fnp = fn();
            promisesMap[k] = fnp;
            const v = await fnp;
            resolvedMap[k] = v;
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
        const res = (proxy as any)[k](options?.input);
        const fn = typeof res?.promise === 'function' ? res.promise : res?.sync;
        if (typeof fn !== 'function') {
          throw new PojoConstructorCannotAsyncResolveError(
            `${pojoFrom.name}->promise`,
            k as string,
            res,
          );
        }
        const fnp = fn();
        promisesMap[k] = fnp;
        const v = await fnp;
        resolvedMap[k] = v;
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
