import type { PojoConstructorProps } from './PojoConstructorProps';
import { processCaughtInCachingProxy } from './processCaughtInCachingProxy';
import {
  PojoConstructorCannotAsyncResolveError,
  PojoConstructorCannotSyncResolveError,
} from './errors';
import { PojoConstructorCacheMap } from './PojoConstructorCacheMap';
import type { PojoConstructorOptions } from './PojoConstructorOptions';

function makeCachingProxy<Pojo extends object, CtorInput>(
  constructorProps: PojoConstructorProps<Pojo, CtorInput>,
  options: Pick<
    PojoConstructorOptions<Pojo, CtorInput>,
    'cacheKeyFromConstructorInput'
  >,
) {
  const cacheKeyFn =
    typeof options?.cacheKeyFromConstructorInput === 'function'
      ? options?.cacheKeyFromConstructorInput
      : (x?: CtorInput) => x;

  const syncCache = new PojoConstructorCacheMap();
  const asyncCache = new PojoConstructorCacheMap();
  const cachingProxy = new Proxy(constructorProps, {
    get(
      target: PojoConstructorProps<Pojo, CtorInput>,
      key: string | symbol,
    ): any {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const propv = target[key];
      if (typeof key === 'symbol' || typeof propv !== 'function') {
        return propv;
      }
      return function constructPojo_cachingProxyIntercepted(
        interceptedInputArg?: CtorInput,
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
  return cachingProxy;
}

export class PojoConstructorProxyHost<Pojo extends object, CtorInput> {
  cachingProxy: PojoConstructorProps<Pojo, CtorInput>;

  constructor(
    public readonly constructorProps: PojoConstructorProps<Pojo, CtorInput>,
    private readonly options: Pick<
      PojoConstructorOptions<Pojo, CtorInput>,
      'cacheKeyFromConstructorInput'
    >,
  ) {
    this.cachingProxy = makeCachingProxy(this.constructorProps, this.options);
  }
}
