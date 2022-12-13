import pMap from '@esm2cjs/p-map';
import type { ConstructPojoOptions } from './PojoConstructor';
import { obtainSortedKeys } from './obtainSortedKeys';

export type PojoConstructorAsync<T extends object, Input = unknown> = {
  [K in keyof T]: (input: Input) => Promise<T[K]>;
};

export type ConstructPojoAsyncOptions<
  T extends object,
  Input,
> = ConstructPojoOptions<T, Input>;

export async function pojoFromAsync<T extends object, Input = unknown>(
  ctor: PojoConstructorAsync<T, Input>,
  options?: ConstructPojoAsyncOptions<T, Input>,
): Promise<T> {
  const sortedKeys = obtainSortedKeys(ctor, options);

  const resolvedMap: any = {};
  const promisesMap: any = {};
  const proxy = new Proxy(ctor, {
    get(target: PojoConstructorAsync<T, Input>, p: string | symbol): any {
      const syncRes = Object.prototype.hasOwnProperty.call(resolvedMap, p);
      const promiseRes = Object.prototype.hasOwnProperty.call(promisesMap, p);
      if (syncRes) {
        return function pojoFromAsync_proxyIntercepted_syncFound() {
          return Promise.resolve(resolvedMap[p]);
        };
      } else if (promiseRes) {
        return function pojoFromAsync_proxyIntercepted_promiseFound() {
          return promisesMap[p];
        };
      }
      return (target as any)[p];
    },
  });

  const concurrency = options?.concurrency;
  if (concurrency) {
    const pojo = Object.fromEntries(
      await pMap(
        sortedKeys as string[],
        async (k) => {
          const fnp = (proxy as any)[k](options?.input);
          promisesMap[k] = fnp;
          const v = await fnp;
          resolvedMap[k] = v;
          return [k, v];
        },
        {
          concurrency,
        },
      ),
    );
    return pojo as T;
  } else {
    const pojo: any = {};
    for (const k of sortedKeys) {
      const fnp = (proxy as any)[k](options?.input);
      promisesMap[k] = fnp;
      const v = await fnp;
      resolvedMap[k] = v;
      pojo[k] = v;
    }
    return pojo as T;
  }
}
