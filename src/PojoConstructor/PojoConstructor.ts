import pMap from '@esm2cjs/p-map';
import { getSortedKeysForPojoConstructorProps } from './getSortedKeysForPojoConstructorProps';
import type {
  PojoConstructorProps,
  PojoSyncAndPromiseResult,
} from './PojoConstructorProps';
import type { PojoConstructorOptions } from './PojoConstructorOptions';
import { PojoConstructorProxiesHost } from './PojoConstructorProxiesHost';
import { PojoConstructorHelpersHost } from './PojoConstructorHelpersHost';

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
    const constructPojoSync = () => {
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
    const constructPojoPromise = async () => {
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
    return {
      sync: constructPojoSync,
      promise: constructPojoPromise,
    };
  }
}
