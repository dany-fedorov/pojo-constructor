import { extractMethodKeys } from './extractMethodKeys';
import type { ConstructPojoOptions } from './PojoConstructor';

export function obtainSortedKeys<T extends object, Input>(
  ctor: object,
  options?: Pick<ConstructPojoOptions<T, Input>, 'keys' | 'sortKeys'>,
) {
  const keys =
    typeof options?.keys === 'function'
      ? options.keys()
      : extractMethodKeys(ctor);
  const stringKeys = keys.filter((k) => typeof k === 'string');
  const sortedKeys = !options?.sortKeys
    ? stringKeys
        .slice()
        .sort((a, b) => ((a as string) <= (b as string) ? -1 : 1))
    : options.sortKeys(stringKeys);
  return sortedKeys;
}
