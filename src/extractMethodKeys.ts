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
