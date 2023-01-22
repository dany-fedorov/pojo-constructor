import type {
  PojoConstructorSyncAndAsyncProxy,
  PojoConstructorSyncAndAsyncProps,
} from './PojoConstructorSyncAndAsyncProps';
import { processCaughtInCachingProxy } from './processCaughtInCachingProxy';
import {
  PojoConstructorCannotAsyncResolveError,
  PojoConstructorCannotSyncResolveError,
} from './errors';
import { PojoConstructorSyncAndAsyncCacheMap } from './PojoConstructorSyncAndAsyncCacheMap';
import type { PojoConstructorSyncAndAsyncOptions } from './PojoConstructorSyncAndAsyncOptions';
import {
  PojoConstructorSyncAndAsyncHelpersHost,
  PojoConstructorHelpersHostBase,
  PojoConstructorHelpersHostForKey,
} from './PojoConstructorSyncAndAsyncHelpersHost';

export function isPropNameProxiable(propName: string | symbol): boolean {
  return typeof propName === 'string';
}

export function isMethodPropProxiable(
  target: object,
  propName: string | symbol,
): boolean {
  return (
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    isPropNameProxiable(propName) && typeof target[propName] === 'function'
  );
}

export function decoratePojoConstructorMethods<T extends object>(
  obj: T,
  makeDecorator: (
    target: T,
    key: Extract<keyof T, string>,
  ) => (...args: any[]) => unknown,
): unknown {
  const proxy = new Proxy(obj, {
    get(target: T, propName: string | symbol): unknown {
      if (!isMethodPropProxiable(target, propName)) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return target[propName];
      }
      return makeDecorator(target, propName as Extract<keyof T, string>);
    },
  });
  return proxy;
}

function resolveHelpers<Pojo extends object, CtorInput>(
  helpers: PojoConstructorHelpersHostBase<Pojo, CtorInput>,
  interceptedHelpersArg:
    | PojoConstructorHelpersHostBase<Pojo, CtorInput>
    | undefined,
  key: Extract<keyof Pojo, string>,
  target?: PojoConstructorSyncAndAsyncProps<Pojo, CtorInput>,
) {
  // The most specific, with key and target
  if (interceptedHelpersArg instanceof PojoConstructorSyncAndAsyncHelpersHost) {
    return interceptedHelpersArg;
  }
  if (interceptedHelpersArg instanceof PojoConstructorHelpersHostForKey) {
    if (target === undefined) {
      return interceptedHelpersArg;
    }
    return interceptedHelpersArg.forTarget(target);
  }
  // The least specific
  if (interceptedHelpersArg instanceof PojoConstructorHelpersHostBase) {
    const forKeyHelpers = interceptedHelpersArg.forKey(key);
    if (target === undefined) {
      return forKeyHelpers;
    }
    return forKeyHelpers.forTarget(target);
  }
  // Intercepted argument does not fit
  const forKeyHelpers = helpers.forKey(key);
  if (target === undefined) {
    return forKeyHelpers;
  }
  return forKeyHelpers.forTarget(target);
}

export function makeErrorCatchingProxy<Pojo extends object, CtorInput>(
  constructorProps: PojoConstructorSyncAndAsyncProps<Pojo, CtorInput>,
  input: CtorInput | undefined,
  helpers: PojoConstructorHelpersHostBase<Pojo, CtorInput>,
) {
  const errorCatchingProxy = decoratePojoConstructorMethods(
    constructorProps,
    (target, key) => {
      return function PojoConstructor_errorCatchingProxy_decoratorFn(
        interceptedInputArg?: CtorInput,
        interceptedHelpersArg?: PojoConstructorSyncAndAsyncHelpersHost<
          Pojo,
          CtorInput
        >,
      ) {
        const effectiveInput =
          interceptedInputArg !== undefined ? interceptedInputArg : input;
        const effectiveHelpers = resolveHelpers(
          helpers,
          interceptedHelpersArg,
          key,
          target,
        );
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
          async: async () => {
            let res;
            try {
              res = (target as any)[key].call(
                errorCatchingProxy,
                interceptedInputArg,
                effectiveHelpers,
              );
            } catch (caught: unknown) {
              throw processCaughtInCachingProxy(caught, {
                key,
                stage: 'key-method',
              });
            }
            let v;
            if (typeof res?.async === 'function') {
              let vpromise;
              try {
                vpromise = res?.async();
              } catch (caught: unknown) {
                throw processCaughtInCachingProxy(caught, {
                  key,
                  stage: 'async-result-method',
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
                `${PojoConstructor_errorCatchingProxy_decoratorFn.name}->async`,
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
  return errorCatchingProxy as PojoConstructorSyncAndAsyncProxy<
    Pojo,
    CtorInput
  >;
}

export function makeCachingProxy<Pojo extends object, CtorInput>(
  errorCatchingProxy: PojoConstructorSyncAndAsyncProxy<Pojo, CtorInput>,
  input: CtorInput | undefined,
  helpers: PojoConstructorHelpersHostBase<Pojo, CtorInput>,
  options: Pick<
    PojoConstructorSyncAndAsyncOptions<Pojo, CtorInput>,
    'cacheKeyFromConstructorInput'
  >,
) {
  const cacheKeyFn =
    typeof options?.cacheKeyFromConstructorInput === 'function'
      ? options?.cacheKeyFromConstructorInput
      : (x?: CtorInput) => x;

  const syncCache = new PojoConstructorSyncAndAsyncCacheMap();
  const asyncCache = new PojoConstructorSyncAndAsyncCacheMap();
  const cachingProxy = decoratePojoConstructorMethods(
    errorCatchingProxy,
    (target, key) => {
      return function PojoConstructor_cachingProxy_decoratorFn(
        interceptedInputArg?: CtorInput,
        interceptedHelpersArg?: PojoConstructorSyncAndAsyncHelpersHost<
          Pojo,
          CtorInput
        >,
      ) {
        const effectiveInput =
          interceptedInputArg !== undefined ? interceptedInputArg : input;
        const effectiveHelpers = resolveHelpers(
          helpers,
          interceptedHelpersArg,
          key,
        );
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
          async: async () => {
            if (asyncCache.has(key, inputCacheKey)) {
              return asyncCache.get(key, inputCacheKey);
            }
            const p = (target as any)[key]
              .call(target, effectiveInput, effectiveHelpers)
              .async();
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
  return cachingProxy as PojoConstructorSyncAndAsyncProxy<Pojo, CtorInput>;
}

export class PojoConstructorSyncAndAsyncProxiesHost<
  Pojo extends object,
  CtorInput,
> {
  cachingProxy: PojoConstructorSyncAndAsyncProxy<Pojo, CtorInput>;
  errorCatchingProxy: PojoConstructorSyncAndAsyncProxy<Pojo, CtorInput>;

  constructor(
    public readonly constructorProps: PojoConstructorSyncAndAsyncProps<
      Pojo,
      CtorInput
    >,
    input: CtorInput | undefined,
    helpers: PojoConstructorHelpersHostBase<Pojo, CtorInput>,
    options: Pick<
      PojoConstructorSyncAndAsyncOptions<Pojo, CtorInput>,
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
