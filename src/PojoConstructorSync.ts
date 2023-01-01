import type { ConstructPojoOptions } from './PojoConstructor';
import { getSortedKeysForPojoConstructorInstance } from './getSortedKeysForPojoConstructorInstance';
import { PojoConstructorCacheMap } from './PojoConstructorCacheMap';
import { processCaughtInCachingProxy } from './processCaughtInCachingProxy';
import type { ConstructPojoAsyncOptions } from './PojoConstructorAsync';

export type PojoConstructorSyncCachingProxy<
  T extends object,
  Input = unknown,
> = {
  [K in keyof T]: K extends string ? (input?: Input) => T[K] : never;
};

export type PojoConstructorSync<T extends object, Input = unknown> = {
  [K in keyof T]: K extends string
    ? (
        input: Input,
        cachingProxy: PojoConstructorSyncCachingProxy<T, Input>,
      ) => T[K]
    : unknown;
};

export type ConstructPojoSyncOptions<T extends object, Input> = Omit<
  ConstructPojoOptions<T, Input>,
  'concurrency'
>;

export function constructPojoFromInstanceSync<
  T extends object,
  Input = unknown,
>(
  ctor: PojoConstructorSync<T, Input>,
  constructPojoInput?: Input,
  constructPojoOptions?: ConstructPojoSyncOptions<T, Input>,
): T {
  const sortedKeys = getSortedKeysForPojoConstructorInstance(
    ctor,
    constructPojoOptions,
  );
  const cacheKeyFn =
    typeof constructPojoOptions?.cacheKeyFromConstructorInput === 'function'
      ? constructPojoOptions?.cacheKeyFromConstructorInput
      : (x?: Input) => x;

  const syncCache = new PojoConstructorCacheMap();
  const cachingProxy = new Proxy(ctor, {
    get(target: PojoConstructorSync<T, Input>, key: string | symbol): any {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const propv = target[key];
      if (typeof key === 'symbol' || typeof propv !== 'function') {
        return propv;
      }
      return function constructPojoSync_proxyIntercepted(
        interceptedInputArg?: Input,
      ) {
        const inputCacheKey = cacheKeyFn(interceptedInputArg);

        if (syncCache.has(key, inputCacheKey)) {
          return syncCache.get(key, inputCacheKey);
        }
        let v;
        try {
          v = (target as any)[key].call(
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
        syncCache.set(key, inputCacheKey, v);
        return v;
      };
    },
  });

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
      v = (cachingProxy as any)[k](constructPojoInput);
    } catch (caught) {
      doCatch(caught, i, k);
    }
    pojo[k] = v;
    i++;
  }
  return pojo as T;
}

export function constructPojoSync<T extends object, Input = unknown>(
  CTorClass: { new (input?: Input): PojoConstructorSync<T, Input> },
  constructPojoInput?: Input,
  constructPojoOptions?: ConstructPojoAsyncOptions<T, Input>,
): T {
  return constructPojoFromInstanceSync(
    new CTorClass(constructPojoInput),
    constructPojoInput,
    constructPojoOptions,
  );
}
