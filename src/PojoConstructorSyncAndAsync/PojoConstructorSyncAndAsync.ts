import pMap from '@esm2cjs/p-map';
import { getSortedKeysForPojoConstructorSyncAndAsyncProps } from './getSortedKeysForPojoConstructorSyncAndAsyncProps';
import type {
  PojoConstructorSyncAndAsyncProps,
  PojoSyncAndAsyncResult,
  PojoMetadata,
  PojoConstructorResult,
  PojoSyncOrAsyncResult,
} from './PojoConstructorSyncAndAsyncProps';
import type { PojoConstructorSyncAndAsyncOptions } from './PojoConstructorSyncAndAsyncOptions';
import { PojoConstructorSyncAndAsyncProxiesHost } from './PojoConstructorSyncAndAsyncProxiesHost';
import { PojoConstructorSyncAndAsyncHelpersHostBase } from './PojoConstructorSyncAndAsyncHelpersHost';
import { PojoHost } from './PojoHost';

function makePojoSyncConstructor<Pojo extends object, CtorInput>(
  proxiesHost: PojoConstructorSyncAndAsyncProxiesHost<Pojo, CtorInput>,
  sortedKeys: string[],
  input: CtorInput | undefined,
  doCatch: (caught: unknown, i: number | null, key: string) => void,
) {
  return function constructPojoSync(): PojoHost<Pojo> {
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
      } catch (caught: unknown) {
        doCatch(caught, i, k);
      }
      if (setv) {
        if ('value' in v) {
          pojo[k] = v.value;
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

function makePojoPromiseConstructor<Pojo extends object, CtorInput>(
  proxiesHost: PojoConstructorSyncAndAsyncProxiesHost<Pojo, CtorInput>,
  sortedKeys: string[],
  input: CtorInput | undefined,
  doCatch: (caught: unknown, i: number | null, key: string) => void,
  effectiveOptions: PojoConstructorSyncAndAsyncOptions<Pojo, CtorInput>,
) {
  return async function constructPojoPromise(): Promise<PojoHost<Pojo>> {
    const concurrency = effectiveOptions?.concurrency;
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
            } catch (caught) {
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
      const metadataEntries = entries.flatMap(([k, v]) =>
        'metadata' in v ? [[k, v.metadata]] : [],
      );
      const res: PojoConstructorResult<Pojo> = {
        value: Object.fromEntries(
          entries.flatMap(([k, v]) => ('value' in v ? [[k, v.value]] : [])),
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
      const hasMetadata = false;
      let i = 0;
      for (const k of sortedKeys) {
        let v;
        let setv = false;
        try {
          v = await (proxiesHost.cachingProxy as any)[k]
            .call(proxiesHost.errorCatchingProxy, input)
            .async();
          setv = true;
        } catch (caught) {
          await doCatch(caught, i, k);
        }
        if (setv) {
          if ('value' in v) {
            pojo[k] = v.value;
          }
          if ('metadata' in v) {
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
    const sortedKeys = getSortedKeysForPojoConstructorSyncAndAsyncProps(
      this.props,
      effectiveOptions,
    );
    const helpersHost = Object.create(
      null,
    ) as PojoConstructorSyncAndAsyncHelpersHostBase<Pojo, CtorInput>;
    const proxiesHost = new PojoConstructorSyncAndAsyncProxiesHost(
      this.props,
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
        proxiesHost,
        sortedKeys,
        input,
        doCatch,
      ),
      async: makePojoPromiseConstructor<Pojo, CtorInput>(
        proxiesHost,
        sortedKeys,
        input,
        doCatch,
        effectiveOptions,
      ),
    };
  }

  static async exec<T>(syncOrAsync: PojoSyncOrAsyncResult<T>): Promise<T> {
    if ('async' in syncOrAsync && typeof syncOrAsync.async === 'function') {
      return await syncOrAsync.async();
    } else if (
      'sync' in syncOrAsync &&
      typeof syncOrAsync.sync === 'function'
    ) {
      return syncOrAsync.sync();
    }
    throw new Error(
      `${PojoConstructorSyncAndAsync.name}.exec: No "async" or "sync" functions in passed object`,
    );
  }

  static bothFromSync<T>(sync: () => T): PojoSyncAndAsyncResult<T> {
    const async = function async() {
      return Promise.resolve(sync());
    };
    return {
      sync,
      async,
    };
  }

  static bothFromValue<T>(value: T): PojoSyncAndAsyncResult<T> {
    const sync = function sync() {
      return value;
    };
    const async = function async() {
      return Promise.resolve(sync());
    };
    return {
      sync,
      async,
    };
  }
}
