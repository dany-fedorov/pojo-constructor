import pMap from '@esm2cjs/p-map';
import { getSortedKeysForPojoConstructorSyncAndAsyncProps } from './getSortedKeysForPojoConstructorSyncAndAsyncProps';
import type {
  PojoConstructorSyncAndAsyncProps,
  PojoSyncAndAsyncResult,
  PojoMetadata,
  PojoConstructorResult,
  PojoSyncOrAsyncResult,
  PojoConstructorPropMethodResult,
} from './PojoConstructorSyncAndAsyncProps';
import type { PojoConstructorSyncAndAsyncOptions } from './PojoConstructorSyncAndAsyncOptions';
import { PojoConstructorSyncAndAsyncProxiesHost } from './PojoConstructorSyncAndAsyncProxiesHost';
import { PojoConstructorSyncAndAsyncHelpersHostBase } from './PojoConstructorSyncAndAsyncHelpersHost';
import { PojoHost } from './PojoHost';
import { debugMe } from './utils';

function anonymousConstructorName(): string {
  return `(anonymous-${new Date()
    .toISOString()
    .replace(/[^0-9A-z]/g, '-')
    .replace('T', '-')
    .replace('Z', '')})`;
}

function makePojoSyncConstructor<Pojo extends object, CtorInput>(
  constructorName: string,
  proxiesHost: PojoConstructorSyncAndAsyncProxiesHost<Pojo, CtorInput>,
  sortedKeys: string[],
  input: CtorInput | undefined,
  doCatch: (caught: unknown, i: number | null, key: string) => void,
) {
  return function constructPojoSync(): PojoHost<Pojo> {
    const debugHere = debugMe.extend(`sync:${constructorName}`);
    const pojo: any = {};
    const metadata: any = {};
    let hasMetadata = false;
    let i = 0;
    for (const k of sortedKeys) {
      let v;
      let setv = false;
      try {
        v = (proxiesHost.cachingProxy as any)[k]
          .call(proxiesHost.errorCatchingProxy, input)
          .sync();
        setv = true;
        debugHere(`Constructed "${k}" prop. (i = ${i})`);
      } catch (caught: unknown) {
        debugHere(`Failed to construct "${k}". (i = ${i})`);
        doCatch(caught, i, k);
      }
      if (setv) {
        if ('value' in v) {
          pojo[k] = v.value;
        } else {
          debugHere(`Constructed "${k}" prop without value.`);
        }
        if ('metadata' in v) {
          hasMetadata = true;
          metadata[k] = v.metadata;
        }
      }
      i++;
    }
    const res: PojoConstructorResult<Pojo> = {
      value: pojo as Pojo,
    };
    if (hasMetadata) {
      res.metadata = metadata as PojoMetadata<Pojo>;
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return new PojoHost(res);
  };
}

function makePojoAsyncConstructor<Pojo extends object, CtorInput>(
  constructorName: string,
  proxiesHost: PojoConstructorSyncAndAsyncProxiesHost<Pojo, CtorInput>,
  sortedKeys: string[],
  input: CtorInput | undefined,
  doCatch: (caught: unknown, i: number | null, key: string) => void,
  effectiveOptions: PojoConstructorSyncAndAsyncOptions<Pojo, CtorInput>,
) {
  return async function constructPojoPromise(): Promise<PojoHost<Pojo>> {
    const debugHere = debugMe.extend(`async:${constructorName}`);
    const concurrency = effectiveOptions?.concurrency;
    debugHere(
      concurrency
        ? `Concurrent mode. Concurrency - ${concurrency}. Constructors for individual properties will be called concurrently.`
        : `Sequential mode. Constructors for individual properties will be called in sequence.`,
    );
    if (concurrency) {
      const entries = (
        await pMap(
          sortedKeys,
          async (k) => {
            let v;
            let setv = false;
            try {
              v = await (proxiesHost.cachingProxy as any)[k]
                .call(proxiesHost.errorCatchingProxy, input)
                .async();
              setv = true;
              debugHere(`Constructed "${k}" prop.`);
            } catch (caught) {
              debugHere(`Failed to construct "${k}".`);
              await doCatch(caught, null, k);
            }
            if (setv) {
              return [[k, v]];
            } else {
              return [];
            }
          },
          {
            concurrency,
          },
        )
      ).flat();
      const metadataEntries = entries.flatMap(([k, v]) => {
        return 'metadata' in v ? [[k, v.metadata]] : [];
      });
      const res: PojoConstructorResult<Pojo> = {
        value: Object.fromEntries(
          entries.flatMap(([k, v]) => {
            if ('value' in v) {
              return [[k, v.value]];
            } else {
              debugHere(`Constructed "${k}" prop without value.`);
              return [];
            }
          }),
        ) as Pojo,
      };
      if (metadataEntries.length > 0) {
        res.metadata = Object.fromEntries(
          metadataEntries,
        ) as PojoMetadata<Pojo>;
      }
      return new PojoHost(res);
    } else {
      const pojo: any = {};
      const metadata: any = {};
      let hasMetadata = false;
      let i = 0;
      for (const k of sortedKeys) {
        let v;
        let setv = false;
        try {
          v = await (proxiesHost.cachingProxy as any)[k]
            .call(proxiesHost.errorCatchingProxy, input)
            .async();
          setv = true;
          debugHere(`Constructed "${k}" prop.`);
        } catch (caught) {
          debugHere(`Failed to construct "${k}".`);
          await doCatch(caught, i, k);
        }
        if (setv) {
          if ('value' in v) {
            pojo[k] = v.value;
          } else {
            debugHere(`Constructed "${k}" prop without value.`);
          }
          if ('metadata' in v) {
            hasMetadata = true;
            metadata[k] = v.metadata;
          }
        }
        i++;
      }
      const res: PojoConstructorResult<Pojo> = {
        value: pojo as Pojo,
      };
      if (hasMetadata) {
        res.metadata = metadata as PojoMetadata<Pojo>;
      }
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return new PojoHost(res);
    }
  };
}

function applyPropsDecorators<T extends object>(
  target: T,
  decorators: ((x: T) => T)[] | undefined,
): T {
  if (!Array.isArray(decorators)) {
    return target;
  }
  let cur: T = target;
  for (const decorator of decorators) {
    cur = decorator(target);
  }
  return cur;
}

/**
 * Can operate in both sync mode and async mode.<br>
 * Constructor methods for each of properties returns an object with either one of `sync`, `async` methods or both.
 *
 * All of these are valid:<br>
 *
 * - `{ sync, async }`.
 * - `{ sync }`.
 * - `{ async }`.
 *
 * Where
 *
 * - `async` - returns promise for `{ value }` object
 * - `sync` - returns `{ value }` object synchronously
 *
 * If you only specify `sync` methods, you can use them for "async mode" (calling `PojoConstructorSyncAndAsync#new().async()`),
 * but you cannot use "sync mode" (calling `PojoConstructorSyncAndAsync#new().sync()`) if you only specify `async` methods.
 *
 * You can specify `async` methods for some fields and still construct an object in "sync mode" if you also specify a `catch` option.
 * `catch` will be called each time constructing a property fails, but all properties that do not fail will be added to resulting object.
 *
 * @usage
 * ```typescript
 * // Sync mode
 * const ctor = new PojoConstructor<{ field: number }, number>({ field: (input) => ({ sync: () => ({ value: input + 2 })}) })
 * const obj = ctor.pojo(2).sync();
 * assert.strictEqual(obj.field, 4);
 * ```
 *
 * ```typescript
 * // Async mode
 * const ctor = new PojoConstructor<{ field: number }, number>({ field: (input) => ({ async: () => ({ value: input + 2 })}) })
 * const obj = await ctor.pojo(2).async();
 * assert.strictEqual(obj.field, 4);
 * ```
 */
export class PojoConstructorSyncAndAsync<
  Pojo extends object,
  CtorInput = unknown,
> {
  constructor(
    public readonly props: PojoConstructorSyncAndAsyncProps<Pojo, CtorInput>,
    public readonly options?: PojoConstructorSyncAndAsyncOptions<
      Pojo,
      CtorInput
    >,
  ) {}

  static new<Pojo extends object, CtorInput = unknown>(
    props: PojoConstructorSyncAndAsyncProps<Pojo, CtorInput>,
    options?: PojoConstructorSyncAndAsyncOptions<Pojo, CtorInput>,
  ): PojoConstructorSyncAndAsync<Pojo, CtorInput> {
    return new PojoConstructorSyncAndAsync<Pojo, CtorInput>(props, options);
  }

  static create<Pojo extends object, CtorInput = unknown>(
    options: PojoConstructorSyncAndAsyncOptions<Pojo, CtorInput> | null,
    props: PojoConstructorSyncAndAsyncProps<Pojo, CtorInput>,
  ): PojoConstructorSyncAndAsync<Pojo, CtorInput> {
    const effectiveOptions = options === null ? {} : options;
    return new PojoConstructorSyncAndAsync<Pojo, CtorInput>(
      props,
      effectiveOptions,
    );
  }

  pojo(
    input?: CtorInput,
    options?: PojoConstructorSyncAndAsyncOptions<Pojo, CtorInput>,
  ): PojoSyncAndAsyncResult<PojoHost<Pojo>> {
    const effectiveOptions: PojoConstructorSyncAndAsyncOptions<
      Pojo,
      CtorInput
    > = {
      ...(this.options ?? {}),
      ...(options ?? {}),
    };
    const constructorName =
      typeof effectiveOptions.name === 'string'
        ? effectiveOptions.name
        : anonymousConstructorName();
    const sortedKeys = getSortedKeysForPojoConstructorSyncAndAsyncProps(
      this.props,
      effectiveOptions,
    );
    const helpersHost = Object.create(
      null,
    ) as PojoConstructorSyncAndAsyncHelpersHostBase<Pojo, CtorInput>;
    const proxiesHost = new PojoConstructorSyncAndAsyncProxiesHost(
      applyPropsDecorators(
        this.props,
        effectiveOptions?._experimental_syncAndAsyncPropsDecorators,
      ),
      input,
      helpersHost,
      typeof effectiveOptions.cacheKeyFromConstructorInput !== 'function'
        ? {}
        : {
            cacheKeyFromConstructorInput:
              effectiveOptions.cacheKeyFromConstructorInput,
          },
    );
    const helpersHostPrototype = new PojoConstructorSyncAndAsyncHelpersHostBase(
      constructorName,
      proxiesHost.cachingProxy,
      proxiesHost.errorCatchingProxy,
    );
    Object.setPrototypeOf(helpersHost, helpersHostPrototype);
    const doCatch = (caught: unknown, i: number | null, key: string) => {
      if (typeof effectiveOptions?.catch !== 'function') {
        throw caught;
      }
      return effectiveOptions?.catch(caught, {
        key,
        keysStack: [...((caught as any).pojoConstructorStack ?? [])],
        keySequentialIndex: i,
      });
    };
    return {
      sync: makePojoSyncConstructor<Pojo, CtorInput>(
        constructorName,
        proxiesHost,
        sortedKeys,
        input,
        doCatch,
      ),
      async: makePojoAsyncConstructor<Pojo, CtorInput>(
        constructorName,
        proxiesHost,
        sortedKeys,
        input,
        doCatch,
        effectiveOptions,
      ),
    };
  }

  static async resolveSasToResultAsync<T>(
    syncOrAsync: PojoSyncOrAsyncResult<PojoConstructorPropMethodResult<T>>,
  ): Promise<PojoConstructorPropMethodResult<T>> {
    if ('async' in syncOrAsync && typeof syncOrAsync.async === 'function') {
      return await syncOrAsync.async();
    } else if (
      'sync' in syncOrAsync &&
      typeof syncOrAsync.sync === 'function'
    ) {
      return syncOrAsync.sync();
    }
    throw new Error(
      `${PojoConstructorSyncAndAsync.name}.resolveAsync: No "async" or "sync" functions.`,
    );
  }

  static async resolveSasToValueAsync<T>(
    syncOrAsync: PojoSyncOrAsyncResult<PojoConstructorPropMethodResult<T>>,
  ): Promise<T> {
    const r = await PojoConstructorSyncAndAsync.resolveSasToResultAsync(
      syncOrAsync,
    );
    if (!r || typeof r !== 'object') {
      throw new Error(
        `${PojoConstructorSyncAndAsync.name}.resolveAsyncValue: Result object is bad - ${r}`,
      );
    }
    if ('value' in r) {
      return r.value;
    } else {
      throw new Error(
        `${PojoConstructorSyncAndAsync.name}.resolveSyncValue: No value in result.`,
      );
    }
  }

  static resolveSasToResultSync<T>(
    syncOrAsync: PojoSyncOrAsyncResult<PojoConstructorPropMethodResult<T>>,
  ): PojoConstructorPropMethodResult<T> {
    if ('sync' in syncOrAsync && typeof syncOrAsync.sync === 'function') {
      return syncOrAsync.sync();
    }
    throw new Error(
      `${PojoConstructorSyncAndAsync.name}.resolveSync: No "async" or "sync" functions.`,
    );
  }

  static resolveSasToValueSync<T>(
    syncOrAsync: PojoSyncOrAsyncResult<PojoConstructorPropMethodResult<T>>,
  ): T {
    const r = PojoConstructorSyncAndAsync.resolveSasToResultSync(syncOrAsync);
    if (!r || typeof r !== 'object') {
      throw new Error(
        `${PojoConstructorSyncAndAsync.name}.resolveSyncValue: Result object is bad - ${r}`,
      );
    }
    if ('value' in r) {
      return r.value;
    } else {
      throw new Error(
        `${PojoConstructorSyncAndAsync.name}.resolveSyncValue: No value in result.`,
      );
    }
  }

  static sasFromSyncUnboxed<T>(
    syncUnboxed: () => T,
  ): PojoSyncAndAsyncResult<PojoConstructorPropMethodResult<T>> {
    const sync = function sync() {
      const value = syncUnboxed();
      if (value === undefined) {
        return {};
      }
      return { value };
    };
    const async = function async() {
      return Promise.resolve(sync());
    };
    return {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      sync,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      async,
    };
  }

  static sasFromSync<T>(
    sync: () => PojoConstructorPropMethodResult<T>,
  ): PojoSyncAndAsyncResult<PojoConstructorPropMethodResult<T>> {
    const async = function async() {
      return Promise.resolve(sync());
    };
    return {
      sync,
      async,
    };
  }

  static sasFromAsyncUnboxed<T>(
    asyncUnboxed: () => Promise<T>,
  ): PojoSyncAndAsyncResult<PojoConstructorPropMethodResult<T>> {
    const async = async function async() {
      const value = await asyncUnboxed();
      if (value === undefined) {
        return {};
      }
      return { value };
    };
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return { async };
  }

  static sasFromAsync<T>(
    async: () => Promise<PojoConstructorPropMethodResult<T>>,
  ): PojoSyncAndAsyncResult<PojoConstructorPropMethodResult<T>> {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return { async };
  }

  static sasFromResult<T>(
    result: PojoConstructorPropMethodResult<T>,
  ): PojoSyncAndAsyncResult<PojoConstructorPropMethodResult<T>> {
    const sync = function sync() {
      return result;
    };
    const async = function async() {
      return Promise.resolve(sync());
    };
    return {
      sync,
      async,
    };
  }

  static sasFromValue<T>(
    value: T,
  ): PojoSyncAndAsyncResult<PojoConstructorPropMethodResult<T>> {
    const sync = function sync() {
      if (value === undefined) {
        return {};
      }
      return { value };
    };
    const async = function async() {
      return Promise.resolve(sync());
    };
    return {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      sync,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      async,
    };
  }
}

export const PCSAS = PojoConstructorSyncAndAsync;
