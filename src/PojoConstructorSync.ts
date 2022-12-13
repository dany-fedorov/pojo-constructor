import type { ConstructPojoOptions } from './PojoConstructor';
import { obtainSortedKeys } from './obtainSortedKeys';

export type PojoCachingProxySync<T extends object, Input = unknown> = {
  [K in keyof T]: (input?: Input) => T[K];
};

export type PojoConstructorSyncMethodCallOptions<
  T extends object,
  Input = unknown,
> = {
  cachingProxy: PojoCachingProxySync<T, Input>;
};

export type PojoConstructorSync<T extends object, Input = unknown> = {
  [K in keyof T]: (
    input: Input,
    options: PojoConstructorSyncMethodCallOptions<T, Input>,
  ) => T[K];
};

export type ConstructPojoSyncOptions<T extends object, Input> = Omit<
  ConstructPojoOptions<T, Input>,
  'concurrency'
>;

export function constructPojoSync<T extends object, Input = unknown>(
  ctor: PojoConstructorSync<T, Input>,
  input?: Input,
  options?: ConstructPojoSyncOptions<T, Input>,
): T {
  const sortedKeys = obtainSortedKeys(ctor, options);
  const cacheKeyFn =
    typeof options?.cacheKey === 'function'
      ? options?.cacheKey
      : (x?: Input) => x;

  const resolvedMap: any = {};
  const proxy = new Proxy(ctor, {
    get(target: PojoConstructorSync<T, Input>, p: string | symbol): any {
      const syncRes = Object.prototype.hasOwnProperty.call(resolvedMap, p);
      return function constructPojoSync_proxyIntercepted(input: Input) {
        const key = cacheKeyFn(input);
        if (syncRes && resolvedMap?.[p]?.has?.(key)) {
          return resolvedMap?.[p]?.get?.(key);
        }
        const v = (target as any)[p].call(proxy, input, {
          cachingProxy: proxy,
        });
        if (!resolvedMap[p]) {
          resolvedMap[p] = new Map();
        }
        resolvedMap[p].set(key, v);
        return v;
      };
    },
  });

  const pojo: any = {};
  for (const k of sortedKeys) {
    const v = (proxy as any)[k].call(proxy, input, {
      cachingProxy: proxy,
    });
    if (!resolvedMap[k]) {
      resolvedMap[k] = new Map();
    }
    resolvedMap[k].set(cacheKeyFn(input), v);
    pojo[k] = v;
  }
  return pojo as T;
}
