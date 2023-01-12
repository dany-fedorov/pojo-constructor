import pMap from '@esm2cjs/p-map';
import { getSortedKeysForPojoConstructorProps } from './getSortedKeysForPojoConstructorProps';
import type {
  PojoConstructorProps,
  PojoSyncOrPromiseResult,
} from './PojoConstructorProps';
import type { PojoConstructorOptions } from './PojoConstructorOptions';
import { PojoConstructorProxyHost } from './PojoConstructorProxyHost';

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
  ): PojoSyncOrPromiseResult<Pojo> {
    const effectiveOptions: PojoConstructorOptions<Pojo, CtorInput> = {
      ...(this.constructorOptions ?? {}),
      ...(options ?? {}),
    };
    const sortedKeys = getSortedKeysForPojoConstructorProps(
      this.constructorProps,
      effectiveOptions,
    );
    const proxyHost = new PojoConstructorProxyHost(
      this.constructorProps,
      typeof effectiveOptions.cacheKeyFromConstructorInput !== 'function'
        ? {}
        : {
            cacheKeyFromConstructorInput:
              effectiveOptions.cacheKeyFromConstructorInput,
          },
    );
    const doCatch = (caught: unknown, i: number | null, key: string) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      caught.pojoConstructorThrownInKey = key;
      if (typeof options?.catch !== 'function') {
        throw caught;
      }
      return options?.catch(caught, {
        pojoConstructorThrownInKey: key,
        pojoConstructorThrownIn: (caught as any)?.pojoConstructorThrownIn ?? [
          key,
          'unknown',
        ],
        pojoConstructorSequentialIndex: i,
      });
    };
    const constructPojoSync = () => {
      const pojo: any = {};
      let i = 0;
      for (const k of sortedKeys) {
        let v;
        let setv = false;
        try {
          v = (proxyHost.cachingProxy as any)[k](input).sync();
          setv = true;
        } catch (caught: unknown) {
          doCatch(caught, i, k);
        }
        if (setv && 'value' in v) {
          pojo[k] = v.value;
        }
        i++;
      }
      return pojo as Pojo;
    };
    const constructPojoPromise = async () => {
      const concurrency = options?.concurrency;
      if (concurrency) {
        const pojo = Object.fromEntries(
          (
            await pMap(
              sortedKeys,
              async (k) => {
                let v;
                let setv = false;
                try {
                  v = await (proxyHost.cachingProxy as any)[k](input).promise();
                  setv = true;
                } catch (caught) {
                  await doCatch(caught, null, k);
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
            v = await (proxyHost.cachingProxy as any)[k](input).promise();
            setv = true;
          } catch (caught) {
            await doCatch(caught, i, k);
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
