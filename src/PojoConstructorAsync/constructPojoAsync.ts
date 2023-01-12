import type { PojoConstructorPropsAsync } from './PojoConstructorPropsAsync';
import type { PojoConstructorOptionsAsync } from './PojoConstructorOptionsAsync';
import { PojoConstructorAsync } from './PojoConstructorAsync';

export function constructPojoFromInstanceAsync<
  Pojo extends object,
  CtorInput = unknown,
>(
  ctorProps: PojoConstructorPropsAsync<Pojo, CtorInput>,
  pojoConstructorInput?: CtorInput,
  pojoConstructorOptions?: PojoConstructorOptionsAsync<Pojo, CtorInput>,
): Promise<Pojo> {
  const ctor = new PojoConstructorAsync<Pojo, CtorInput>(
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
export function constructPojoAsync<Pojo extends object, CtorInput = unknown>(
  CTorClass: {
    new (input?: CtorInput): PojoConstructorPropsAsync<Pojo, CtorInput>;
  },
  pojoConstructorInput?: CtorInput,
  pojoConstructorOptions?: PojoConstructorOptionsAsync<Pojo, CtorInput>,
): Promise<Pojo> {
  return constructPojoFromInstanceAsync(
    new CTorClass(pojoConstructorInput),
    pojoConstructorInput,
    pojoConstructorOptions,
  );
}
