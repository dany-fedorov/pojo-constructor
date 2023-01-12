import type { PojoConstructorProps } from './PojoConstructorProps';
import type { PojoConstructorOptions } from './PojoConstructorOptions';

const OBJ_DEFAULT_PROTOTYPE = Object.getPrototypeOf({});

export function extractMethodKeysForPojoConstructorInstance<
  Pojo extends object,
  CtorInput,
>(
  ctorProps: PojoConstructorProps<Pojo, CtorInput>,
  // | PojoConstructorProps<Pojo, CtorInput>
  // | PojoConstructorPropsSync<Pojo, CtorInput>
  // | PojoConstructorPropsAsync<Pojo, CtorInput>,
  isPrototype = false,
): Extract<keyof Pojo, string>[] {
  const keys = Object.getOwnPropertyNames(ctorProps).filter(
    (k) =>
      typeof (ctorProps as any)[k] === 'function' &&
      (!isPrototype || k !== 'constructor'),
  );
  const stringKeys = keys.filter((k) => typeof k === 'string');
  const proto = Object.getPrototypeOf(ctorProps);
  if (proto === null || proto === OBJ_DEFAULT_PROTOTYPE) {
    return stringKeys as Extract<keyof Pojo, string>[];
  } else {
    return [
      ...stringKeys,
      ...extractMethodKeysForPojoConstructorInstance(proto, true),
    ] as Extract<keyof Pojo, string>[];
  }
}

export function getSortedKeysForPojoConstructorProps<
  Pojo extends object,
  CtorInput,
>(
  ctorProps: PojoConstructorProps<Pojo, CtorInput>,
  // | PojoConstructorProps<Pojo, CtorInput>
  // | PojoConstructorPropsSync<Pojo, CtorInput>
  // | PojoConstructorPropsAsync<Pojo, CtorInput>,
  options?: Pick<PojoConstructorOptions<Pojo, CtorInput>, 'keys' | 'sortKeys'>,
): Extract<keyof Pojo, string>[] {
  const keys =
    typeof options?.keys === 'function'
      ? options.keys()
      : extractMethodKeysForPojoConstructorInstance(ctorProps);
  const sortedKeys =
    typeof options?.sortKeys !== 'function'
      ? keys.slice().sort((a, b) => ((a as string) <= (b as string) ? -1 : 1))
      : options.sortKeys(keys);
  return sortedKeys as Extract<keyof Pojo, string>[];
}
