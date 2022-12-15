import type {
  ConstructPojoOptions,
  ConstructPojoResult,
} from './PojoConstructor';
import { obtainSortedKeys } from './obtainSortedKeys';
import { PojoConstructorCacheMap } from './PojoConstructorCacheMap';
import { processCaughtInCachingProxy } from './processCaughtInCachingProxy';

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
    typeof constructPojoOptions?.cacheKeyFromConstructorInput === 'function'
      ? constructPojoOptions?.cacheKeyFromConstructorInput
      : (x?: Input) => x;

  const resolvedCache = new PojoConstructorCacheMap();
  const makeCachingProxy = (proxyInput?: Input) =>
    new Proxy(ctor, {
      get(target: PojoConstructorSync<T, Input>, key: string | symbol): any {
        return function constructPojoSync_proxyIntercepted(
          interceptedInputArg?: Input,
        ) {
          const resolvedInterceptedInput =
            interceptedInputArg === undefined
              ? proxyInput
              : interceptedInputArg;
          const cacheKey = cacheKeyFn(resolvedInterceptedInput);
          const thisProxy = makeCachingProxy(resolvedInterceptedInput);

          if (resolvedCache.has(key, cacheKey)) {
            return resolvedCache.get(key, cacheKey);
          }
          let v;
          try {
            v = (target as any)[key].call(
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
          resolvedCache.set(key, cacheKey, v);
          return v;
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
  const pojo: any = {};
  let i = 0;
  for (const k of sortedKeys) {
    if (typeof k !== 'string') {
      continue;
    }
    let v;
    try {
      v = (allPropsProxy as any)[k]();
    } catch (caught) {
      doCatch(caught, i, k);
    }
    pojo[k] = v;
    i++;
  }
  return { value: pojo as T };
}
