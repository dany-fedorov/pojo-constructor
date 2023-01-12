import type { PojoConstructorPropsSync } from './PojoConstructorPropsSync';
import type { PojoConstructorOptionsSync } from './PojoConstructorOptionsSync';
import { PojoConstructorSync } from './PojoConstructorSync';

export function constructPojoFromInstanceSync<
  Pojo extends object,
  CtorInput = unknown,
>(
  ctorProps: PojoConstructorPropsSync<Pojo, CtorInput>,
  pojoConstructorInput?: CtorInput,
  pojoConstructorOptions?: PojoConstructorOptionsSync<Pojo, CtorInput>,
): Pojo {
  const ctor = new PojoConstructorSync<Pojo, CtorInput>(
    ctorProps,
    pojoConstructorOptions,
  );
  return ctor.new(pojoConstructorInput);
}

/**
 * Wrapper for {@link constructPojoFromInstance}.<br>
 * Instantiates `CTorClass` passing `constructPojoInput` to constructor.
 *
 * @param CTorClass - Class object (constructor function).
 * @param pojoConstructorInput - An input that will be passed to each property constructor method.
 * @param pojoConstructorOptions
 */
export function constructPojoSync<Pojo extends object, CtorInput = unknown>(
  CTorClass: {
    new (input?: CtorInput): PojoConstructorPropsSync<Pojo, CtorInput>;
  },
  pojoConstructorInput?: CtorInput,
  pojoConstructorOptions?: PojoConstructorOptionsSync<Pojo, CtorInput>,
): Pojo {
  return constructPojoFromInstanceSync(
    new CTorClass(pojoConstructorInput),
    pojoConstructorInput,
    pojoConstructorOptions,
  );
}
