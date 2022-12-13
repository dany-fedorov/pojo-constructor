import pMap from '@esm2cjs/p-map';
import type { ConstructPojoOptions } from './PojoConstructor';
import { obtainSortedKeys } from './obtainSortedKeys';

export type PojoCachingProxyAsync<T extends object, Input = unknown> = {
  [K in keyof T]: (input?: Input) => Promise<T[K]>;
};

export type PojoConstructorAsyncMethodCallOptions<
  T extends object,
  Input = unknown,
> = {
  cachingProxy: PojoCachingProxyAsync<T, Input>;
};

export type PojoConstructorAsync<T extends object, Input = unknown> = {
  [K in keyof T]: (
    input: Input,
    options: PojoConstructorAsyncMethodCallOptions<T, Input>,
  ) => Promise<T[K]>;
};

export type ConstructPojoAsyncOptions<
  T extends object,
  Input,
> = ConstructPojoOptions<T, Input>;

export async function constructPojoAsync<T extends object, Input = unknown>(
  ctor: PojoConstructorAsync<T, Input>,
  input?: Input,
  options?: ConstructPojoAsyncOptions<T, Input>,
): Promise<T> {
  const sortedKeys = obtainSortedKeys(ctor, options);
  const cacheKeyFn =
    typeof options?.cacheKey === 'function'
      ? options?.cacheKey
      : (x?: Input) => x;

  const resolvedMap: any = {};
  const promisesMap: any = {};
  const proxy = new Proxy(ctor, {
    get(target: PojoConstructorAsync<T, Input>, p: string | symbol): any {
      const syncRes = Object.prototype.hasOwnProperty.call(resolvedMap, p);
      const promiseRes = Object.prototype.hasOwnProperty.call(promisesMap, p);
      return async function constructPojoAsync_proxyIntercepted(input: Input) {
        const key = cacheKeyFn(input);
        if (syncRes && resolvedMap?.[p]?.has?.(key)) {
          return resolvedMap?.[p]?.get?.(key);
        }
        if (promiseRes && promisesMap?.[p]?.has?.(key)) {
          return promisesMap?.[p]?.get?.(key);
        }
        const vpromise = (target as any)[p].call(proxy, input, {
          cachingProxy: proxy,
        });
        if (!promisesMap[p]) {
          promisesMap[p] = new Map();
        }
        promisesMap[p].set(cacheKeyFn(input), vpromise);
        const v = await vpromise;
        if (!resolvedMap[p]) {
          resolvedMap[p] = new Map();
        }
        resolvedMap[p].set(cacheKeyFn(input), v);
        return v;
      };
    },
  });

  const concurrency = options?.concurrency;
  if (concurrency) {
    const pojo = Object.fromEntries(
      await pMap(
        sortedKeys as string[],
        async (k) => {
          const fnp = (proxy as any)[k].call(proxy, input, {
            cachingProxy: proxy,
          });
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
      const fnp = (proxy as any)[k].call(proxy, input, {
        cachingProxy: proxy,
      });
      const v = await fnp;
      pojo[k] = v;
    }
    return pojo as T;
  }
}
