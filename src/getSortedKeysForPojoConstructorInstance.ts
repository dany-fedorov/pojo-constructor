import type { ConstructPojoOptions } from './PojoConstructor';

const OBJ_DEFAULT_PROTOTYPE = Object.getPrototypeOf({});

export function extractMethodKeys<T extends object>(
  obj: T,
  isPrototype = false,
): (keyof T)[] {
  const keys = Object.getOwnPropertyNames(obj).filter(
    (k) =>
      typeof (obj as any)[k] === 'function' &&
      (!isPrototype || k !== 'constructor'),
  );
  const proto = Object.getPrototypeOf(obj);
  if (proto === null || proto === OBJ_DEFAULT_PROTOTYPE) {
    return keys as (keyof T)[];
  } else {
    return [...keys, ...extractMethodKeys(proto, true)] as (keyof T)[];
  }
}

export function getSortedKeysForPojoConstructorInstance<T extends object, Input>(
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
