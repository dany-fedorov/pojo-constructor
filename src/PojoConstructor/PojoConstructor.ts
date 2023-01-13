import pMap from '@esm2cjs/p-map';
import { getSortedKeysForPojoConstructorProps } from './getSortedKeysForPojoConstructorProps';
import type {
  PojoConstructorProps,
  PojoSyncAndPromiseResult,
} from './PojoConstructorProps';
import type { PojoConstructorOptions } from './PojoConstructorOptions';
import { PojoConstructorProxiesHost } from './PojoConstructorProxiesHost';
import { PojoConstructorHelpersHost } from './PojoConstructorHelpersHost';

function makePojoSyncConstructor<Pojo extends object, CtorInput>(
  proxiesHost: PojoConstructorProxiesHost<Pojo, CtorInput>,
  sortedKeys: string[],
  input: CtorInput | undefined,
  doCatch: (caught: unknown, i: number | null) => void,
) {
  return function constructPojoSync() {
    const pojo: any = {};
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
        doCatch(caught, i);
      }
      if (setv && 'value' in v) {
        pojo[k] = v.value;
      }
      i++;
    }
    return pojo as Pojo;
  };
}

function makePojoPromiseConstructor<Pojo extends object, CtorInput>(
  proxiesHost: PojoConstructorProxiesHost<Pojo, CtorInput>,
  sortedKeys: string[],
  input: CtorInput | undefined,
  doCatch: (caught: unknown, i: number | null) => void,
  effectiveOptions: PojoConstructorOptions<Pojo, CtorInput>,
) {
  return async function constructPojoPromise() {
    const concurrency = effectiveOptions?.concurrency;
    if (concurrency) {
      const pojo = Object.fromEntries(
        (
          await pMap(
            sortedKeys,
            async (k) => {
              let v;
              let setv = false;
              try {
                v = await (proxiesHost.cachingProxy as any)[k]
                  .call(proxiesHost.errorCatchingProxy, input)
                  .promise();
                setv = true;
              } catch (caught) {
                await doCatch(caught, null);
              }
              if (setv && 'value' in v) {
                return [[k, v.value]];
              } else {
                return [];
              }
            },
            {
              concurrency,
            },
          )
        ).flat(),
      );
      return pojo as Pojo;
    } else {
      const pojo: any = {};
      let i = 0;
      for (const k of sortedKeys) {
        let v;
        let setv = false;
        try {
          v = await (proxiesHost.cachingProxy as any)[k]
            .call(proxiesHost.errorCatchingProxy, input)
            .promise();
          setv = true;
        } catch (caught) {
          await doCatch(caught, i);
        }
        if (setv && 'value' in v) {
          pojo[k] = v.value;
        }
        i++;
      }
      return pojo as Pojo;
    }
  };
}

/**
 * Can operate in both sync mode and async mode.<br>
 * Constructor methods for each of properties returns and object with either on of two methods or both - `{ sync, promise }`.
 * - `promise` - returns promise for `{ value }` object
 * - `sync` - returns `{ value }` object synchronously
 *
 * @usage
 * ```typescript
 * // Sync mode
 * const ctor = new PojoConstructor<{ field: number }, number>({ field: (input) => ({ sync: () => ({ value: input + 2 })}) })
 * const obj = ctor.new(2).sync();
 * assert.strictEqual(obj.field, 4);
 * ```
 *
 * ```typescript
 * // Async mode
 * const ctor = new PojoConstructor<{ field: number }, number>({ field: (input) => ({ promise: () => ({ value: input + 2 })}) })
 * const obj = await ctor.new(2).promise();
 * assert.strictEqual(obj.field, 4);
 * ```
 */
export class PojoConstructor<Pojo extends object, CtorInput = unknown> {
  constructor(
    public readonly constructorProps: PojoConstructorProps<Pojo, CtorInput>,
    public readonly constructorOptions?: PojoConstructorOptions<
      Pojo,
      CtorInput
    >,
  ) {}

  new(
    input?: CtorInput,
    options?: PojoConstructorOptions<Pojo, CtorInput>,
  ): PojoSyncAndPromiseResult<Pojo> {
    const effectiveOptions: PojoConstructorOptions<Pojo, CtorInput> = {
      ...(this.constructorOptions ?? {}),
      ...(options ?? {}),
    };
    const sortedKeys = getSortedKeysForPojoConstructorProps(
      this.constructorProps,
      effectiveOptions,
    );
    const helpersHost = Object.create(null);
    const proxiesHost = new PojoConstructorProxiesHost(
      this.constructorProps,
      helpersHost,
      typeof effectiveOptions.cacheKeyFromConstructorInput !== 'function'
        ? {}
        : {
            cacheKeyFromConstructorInput:
              effectiveOptions.cacheKeyFromConstructorInput,
          },
    );
    const helpersHostPrototype = new PojoConstructorHelpersHost(
      proxiesHost.cachingProxy,
    );
    Object.setPrototypeOf(helpersHost, helpersHostPrototype);
    const doCatch = (caught: unknown, i: number | null) => {
      if (typeof effectiveOptions?.catch !== 'function') {
        throw caught;
      }
      return effectiveOptions?.catch(caught, {
        pojoConstructorStack: [...((caught as any).pojoConstructorStack ?? [])],
        pojoConstructorKeySequentialIndex: i,
      });
    };
    return {
      sync: makePojoSyncConstructor<Pojo, CtorInput>(
        proxiesHost,
        sortedKeys,
        input,
        doCatch,
      ),
      promise: makePojoPromiseConstructor<Pojo, CtorInput>(
        proxiesHost,
        sortedKeys,
        input,
        doCatch,
        effectiveOptions,
      ),
    };
  }
}
