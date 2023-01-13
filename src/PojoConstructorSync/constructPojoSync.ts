import type { PojoConstructorPropsSync } from './PojoConstructorPropsSync';
import type { PojoConstructorOptionsSync } from './PojoConstructorOptionsSync';
import { PojoConstructorSync } from './PojoConstructorSync';

/**
 * Wrapper for {@link PojoConstructorSync}.
 */
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
 * Instantiates `CTorPropsSyncClass` passing `constructPojoInput` to constructor.
 */
export function constructPojoSync<Pojo extends object, CtorInput = unknown>(
  CTorPropsSyncClass: {
    new (input?: CtorInput): PojoConstructorPropsSync<Pojo, CtorInput>;
  },
  pojoConstructorInput?: CtorInput,
  pojoConstructorOptions?: PojoConstructorOptionsSync<Pojo, CtorInput>,
): Pojo {
  return constructPojoFromInstanceSync(
    new CTorPropsSyncClass(pojoConstructorInput),
    pojoConstructorInput,
    pojoConstructorOptions,
  );
}
