import type {
  PojoConstructorProxy,
  PojoConstructorProps,
} from './PojoConstructorProps';
import { processCaughtInCachingProxy } from './processCaughtInCachingProxy';
import {
  PojoConstructorCannotAsyncResolveError,
  PojoConstructorCannotSyncResolveError,
} from './errors';
import { PojoConstructorCacheMap } from './PojoConstructorCacheMap';
import type { PojoConstructorOptions } from './PojoConstructorOptions';
import { PojoConstructorHelpersHost } from './PojoConstructorHelpersHost';

export function isPropProxiable(
  target: object,
  propName: string | symbol,
): boolean {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return typeof propName === 'string' && typeof target[propName] === 'function';
}

export function decoratePojoConstructorMethods<T extends object>(
  obj: T,
  makeDecorator: (target: T, key: string) => (...args: any[]) => unknown,
): unknown {
  const proxy = new Proxy(obj, {
    get(target: T, propName: string | symbol): unknown {
      if (!isPropProxiable(target, propName)) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return target[propName];
      }
      return makeDecorator(target, propName as string);
    },
  });
  return proxy;
}

function makeErrorCatchingProxy<Pojo extends object, CtorInput>(
  constructorProps: PojoConstructorProps<Pojo, CtorInput>,
  input: CtorInput | undefined,
  helpers: PojoConstructorHelpersHost<Pojo, CtorInput>,
) {
  const errorCatchingProxy = decoratePojoConstructorMethods(
    constructorProps,
    (target, key) => {
      return function PojoConstructor_errorCatchingProxy_decoratorFn(
        interceptedInputArg?: CtorInput,
        interceptedHelpersArg?: PojoConstructorHelpersHost<Pojo, CtorInput>,
      ) {
        const effectiveInput =
          interceptedInputArg !== undefined ? interceptedInputArg : input;
        const effectiveHelpers =
          interceptedHelpersArg instanceof PojoConstructorHelpersHost
            ? interceptedHelpersArg
            : helpers;
        return {
          sync: () => {
            let res;
            try {
              res = (target as any)[key].call(
                errorCatchingProxy,
                effectiveInput,
                effectiveHelpers,
              );
            } catch (caught) {
              throw processCaughtInCachingProxy(caught, {
                key,
                stage: 'key-method',
              });
            }
            if (typeof res.sync !== 'function') {
              throw new PojoConstructorCannotSyncResolveError(
                `${PojoConstructor_errorCatchingProxy_decoratorFn.name}->sync`,
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
                `${PojoConstructor_errorCatchingProxy_decoratorFn.name}->promise`,
                key as string,
                res,
              );
            }
            return v;
          },
        };
      };
    },
  );
  return errorCatchingProxy as PojoConstructorProxy<Pojo, CtorInput>;
}

function makeCachingProxy<Pojo extends object, CtorInput>(
  constructorProps: PojoConstructorProxy<Pojo, CtorInput>,
  input: CtorInput | undefined,
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
  const cachingProxy = decoratePojoConstructorMethods(
    constructorProps,
    (target, key) => {
      return function PojoConstructor_cachingProxy_decoratorFn(
        interceptedInputArg?: CtorInput,
        interceptedHelpersArg?: PojoConstructorHelpersHost<Pojo, CtorInput>,
      ) {
        const effectiveInput =
          interceptedInputArg !== undefined ? interceptedInputArg : input;
        const effectiveHelpers =
          interceptedHelpersArg instanceof PojoConstructorHelpersHost
            ? interceptedHelpersArg
            : helpers;
        const inputCacheKey = cacheKeyFn(effectiveInput);
        return {
          sync: () => {
            if (syncCache.has(key, inputCacheKey)) {
              return syncCache.get(key, inputCacheKey);
            }
            const v = (target as any)[key]
              .call(target, effectiveInput, effectiveHelpers)
              .sync();
            syncCache.set(key, inputCacheKey, v);
            return v;
          },
          promise: async () => {
            if (asyncCache.has(key, inputCacheKey)) {
              return asyncCache.get(key, inputCacheKey);
            }
            const p = (target as any)[key]
              .call(target, effectiveInput, helpers)
              .promise();
            asyncCache.set(key, inputCacheKey, p);
            p.then((v: unknown) => {
              syncCache.set(key, inputCacheKey, v);
              // eslint-disable-next-line @typescript-eslint/no-empty-function
            }).catch(() => {});
            return p;
          },
        };
      };
    },
  );
  return cachingProxy as PojoConstructorProxy<Pojo, CtorInput>;
}

export class PojoConstructorProxiesHost<Pojo extends object, CtorInput> {
  cachingProxy: PojoConstructorProxy<Pojo, CtorInput>;
  errorCatchingProxy: PojoConstructorProxy<Pojo, CtorInput>;

  constructor(
    public readonly constructorProps: PojoConstructorProps<Pojo, CtorInput>,
    input: CtorInput | undefined,
    helpers: PojoConstructorHelpersHost<Pojo, CtorInput>,
    options: Pick<
      PojoConstructorOptions<Pojo, CtorInput>,
      'cacheKeyFromConstructorInput'
    >,
  ) {
    this.errorCatchingProxy = makeErrorCatchingProxy(
      this.constructorProps,
      input,
      helpers,
    );
    this.cachingProxy = makeCachingProxy(
      this.errorCatchingProxy,
      input,
      helpers,
      options,
    );
  }
}
