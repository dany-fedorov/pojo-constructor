import type {
  ConstructPojoOptions,
  ConstructPojoResult,
} from './PojoConstructor';
import { obtainSortedKeys } from './obtainSortedKeys';
import { PojoConstructorCacheMap } from './PojoConstructorCacheMap';

export type PojoConstructorSyncCachingProxy<
  T extends object,
  Input = unknown,
> = {
  [K in keyof T]: (input?: Input) => T[K];
};

export type PojoConstructorSync<T extends object, Input = unknown> = {
  [K in keyof T]: (
    input: Input,
    cachingProxy: PojoConstructorSyncCachingProxy<T, Input>,
  ) => T[K];
};

export type ConstructPojoSyncOptions<T extends object, Input> = Omit<
  ConstructPojoOptions<T, Input>,
  'concurrency'
>;

export function constructPojoSync<T extends object, Input = unknown>(
  ctor: PojoConstructorSync<T, Input>,
  constructPojoInput?: Input,
  constructPojoOptions?: ConstructPojoSyncOptions<T, Input>,
): ConstructPojoResult<T> {
  const sortedKeys = obtainSortedKeys(ctor, constructPojoOptions);
  const cacheKeyFn =
    typeof constructPojoOptions?.cacheKeyFromInput === 'function'
      ? constructPojoOptions?.cacheKeyFromInput
      : (x?: Input) => x;

  const resolvedCache = new PojoConstructorCacheMap();
  const makeCachingProxy = (proxyInput?: Input) =>
    new Proxy(ctor, {
      get(target: PojoConstructorSync<T, Input>, p: string | symbol): any {
        return function constructPojoSync_proxyIntercepted(
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
          const v = (target as any)[p].call(
            thisProxy,
            resolvedInterceptedInput,
            thisProxy,
          );
          resolvedCache.set(p, key, v);
          return v;
        };
      },
    });

  const allPropsProxy = makeCachingProxy(constructPojoInput);
  const pojo: any = {};
  for (const k of sortedKeys) {
    const v = (allPropsProxy as any)[k]();
    pojo[k] = v;
  }
  return { value: pojo as T };
}
