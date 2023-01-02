import type { ConstructPojoOptions, PojoConstructor } from './PojoConstructor';
import type { PojoConstructorSync } from './PojoConstructorSync';
import type { PojoConstructorAsync } from './PojoConstructorAsync';

const OBJ_DEFAULT_PROTOTYPE = Object.getPrototypeOf({});

export function extractMethodKeysForPojoConstructorInstance<
  Pojo extends object,
  CtorInput,
>(
  ctor:
    | PojoConstructor<Pojo, CtorInput>
    | PojoConstructorSync<Pojo, CtorInput>
    | PojoConstructorAsync<Pojo, CtorInput>,
  isPrototype = false,
): Extract<keyof Pojo, string>[] {
  const keys = Object.getOwnPropertyNames(ctor).filter(
    (k) =>
      typeof (ctor as any)[k] === 'function' &&
      (!isPrototype || k !== 'constructor'),
  );
  const stringKeys = keys.filter((k) => typeof k === 'string');
  const proto = Object.getPrototypeOf(ctor);
  if (proto === null || proto === OBJ_DEFAULT_PROTOTYPE) {
    return stringKeys as Extract<keyof Pojo, string>[];
  } else {
    return [
      ...stringKeys,
      ...extractMethodKeysForPojoConstructorInstance(proto, true),
    ] as Extract<keyof Pojo, string>[];
  }
}

export function getSortedKeysForPojoConstructorInstance<
  Pojo extends object,
  CtorInput,
>(
  ctor:
    | PojoConstructor<Pojo, CtorInput>
    | PojoConstructorSync<Pojo, CtorInput>
    | PojoConstructorAsync<Pojo, CtorInput>,
  options?: Pick<ConstructPojoOptions<Pojo, CtorInput>, 'keys' | 'sortKeys'>,
): Extract<keyof Pojo, string>[] {
  const keys =
    typeof options?.keys === 'function'
      ? options.keys()
      : extractMethodKeysForPojoConstructorInstance(ctor);
  const sortedKeys =
    typeof options?.sortKeys !== 'function'
      ? keys.slice().sort((a, b) => ((a as string) <= (b as string) ? -1 : 1))
      : options.sortKeys(keys);
  return sortedKeys as Extract<keyof Pojo, string>[];
}
