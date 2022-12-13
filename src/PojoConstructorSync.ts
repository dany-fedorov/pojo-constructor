import type { ConstructPojoOptions } from './PojoConstructor';
import { obtainSortedKeys } from './obtainSortedKeys';

export type PojoConstructorSync<T extends object, Input = unknown> = {
  [K in keyof T]: (input: Input) => T[K];
};

export type ConstructPojoSyncOptions<T extends object, Input> = Omit<
  ConstructPojoOptions<T, Input>,
  'concurrency'
>;

export function pojoFromSync<T extends object, Input = unknown>(
  ctor: PojoConstructorSync<T, Input>,
  options?: ConstructPojoSyncOptions<T, Input>,
): T {
  const sortedKeys = obtainSortedKeys(ctor, options);

  const resolvedMap: any = {};
  const proxy = new Proxy(ctor, {
    get(target: PojoConstructorSync<T, Input>, p: string | symbol): any {
      const syncRes = Object.prototype.hasOwnProperty.call(resolvedMap, p);
      if (syncRes) {
        return function pojoFromSync_proxyIntercepted() {
          return resolvedMap[p];
        };
      }
      return (target as any)[p];
    },
  });

  const pojo: any = {};
  for (const k of sortedKeys) {
    const v = (proxy as any)[k](options?.input);
    resolvedMap[k] = v;
    pojo[k] = v;
  }
  return pojo as T;
}
