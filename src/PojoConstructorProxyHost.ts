import type {
  PojoConstructorCachingProxy,
  PojoConstructorProps,
} from './PojoConstructorProps';
import { processCaughtInCachingProxy } from './processCaughtInCachingProxy';
import {
  PojoConstructorCannotAsyncResolveError,
  PojoConstructorCannotSyncResolveError,
} from './errors';
import { PojoConstructorCacheMap } from './PojoConstructorCacheMap';
import type { PojoConstructorOptions } from './PojoConstructorOptions';
import type { PojoConstructorHelpersHost } from './PojoConstructorHelpersHost';

function makeErrorCatchingProxy<Pojo extends object, CtorInput>(
  constructorProps: PojoConstructorProps<Pojo, CtorInput>,
  helpers: PojoConstructorHelpersHost<Pojo, CtorInput>,
) {
  const errorCatchingProxy = new Proxy(constructorProps, {
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
      return function constructPojo_errorCatchingProxyIntercepted(
        interceptedInputArg?: CtorInput,
      ) {
        return {
          sync: () => {
            let res;
            try {
              res = (target as any)[key].call(
                errorCatchingProxy,
                interceptedInputArg,
                helpers,
              );
            } catch (caught) {
              throw processCaughtInCachingProxy(caught, {
                key,
                stage: 'key-method',
              });
            }
            if (typeof res.sync !== 'function') {
              throw new PojoConstructorCannotSyncResolveError(
                `${constructPojo_errorCatchingProxyIntercepted.name}->sync`,
                key as string,
                res,
              );
            }
            let v;
            try {
              v = res.sync();
            } catch (caught: unknown) {
              throw processCaughtInCachingProxy(caught, {
                key,
                stage: 'sync-result-method',
              });
            }
            return v;
          },
          promise: async () => {
            let res;
            try {
              res = (target as any)[key].call(
                errorCatchingProxy,
                interceptedInputArg,
                helpers,
              );
            } catch (caught: unknown) {
              throw processCaughtInCachingProxy(caught, {
                key,
                stage: 'key-method',
              });
            }
            let v;
            if (typeof res?.promise === 'function') {
              let vpromise;
              try {
                vpromise = res?.promise();
              } catch (caught: unknown) {
                throw processCaughtInCachingProxy(caught, {
                  key,
                  stage: 'promise-result-method',
                });
              }
              try {
                v = await vpromise;
              } catch (caught: unknown) {
                throw processCaughtInCachingProxy(caught, {
                  key,
                  stage: 'promise-resolution',
                });
              }
            } else if (typeof res?.sync === 'function') {
              try {
                v = res?.sync();
              } catch (caught: unknown) {
                throw processCaughtInCachingProxy(caught, {
                  key,
                  stage: 'sync-result-method',
                });
              }
            } else {
              throw new PojoConstructorCannotAsyncResolveError(
                `${constructPojo_errorCatchingProxyIntercepted.name}->promise`,
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
  return errorCatchingProxy as PojoConstructorProps<Pojo, CtorInput>;
}

function makeCachingProxy<Pojo extends object, CtorInput>(
  constructorProps: PojoConstructorProps<Pojo, CtorInput>,
  helpers: PojoConstructorHelpersHost<Pojo, CtorInput>,
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
            const v = (target as any)[key]
              .call(target, interceptedInputArg, helpers)
              .sync();
            syncCache.set(key, inputCacheKey, v);
            return v;
          },
          promise: async () => {
            if (asyncCache.has(key, inputCacheKey)) {
              return asyncCache.get(key, inputCacheKey);
            }
            const v = await (target as any)[key]
              .call(target, interceptedInputArg, helpers)
              .promise();
            return v;
          },
        };
      };
    },
  });
  return cachingProxy as PojoConstructorCachingProxy<Pojo, CtorInput>;
}

export class PojoConstructorProxyHost<Pojo extends object, CtorInput> {
  cachingProxy: PojoConstructorCachingProxy<Pojo, CtorInput>;
  errorCatchingProxy: PojoConstructorProps<Pojo, CtorInput>;

  constructor(
    public readonly constructorProps: PojoConstructorProps<Pojo, CtorInput>,
    helpers: PojoConstructorHelpersHost<Pojo, CtorInput>,
    options: Pick<
      PojoConstructorOptions<Pojo, CtorInput>,
      'cacheKeyFromConstructorInput'
    >,
  ) {
    this.errorCatchingProxy = makeErrorCatchingProxy(
      this.constructorProps,
      helpers,
    );
    this.cachingProxy = makeCachingProxy(
      this.errorCatchingProxy,
      helpers,
      options,
    );
  }
}
