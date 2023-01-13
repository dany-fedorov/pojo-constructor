import type { PojoConstructorPropsAsync } from './PojoConstructorPropsAsync';
import type { PojoConstructorOptionsAsync } from './PojoConstructorOptionsAsync';
import { PojoConstructorAsync } from './PojoConstructorAsync';

/**
 * Wrapper for {@link PojoConstructorPropsAsync}.
 */
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
 * Instantiates `CTorPropsAsyncClass` passing `constructPojoInput` to constructor.
 */
export function constructPojoAsync<Pojo extends object, CtorInput = unknown>(
  CTorPropsAsyncClass: {
    new (input?: CtorInput): PojoConstructorPropsAsync<Pojo, CtorInput>;
  },
  pojoConstructorInput?: CtorInput,
  pojoConstructorOptions?: PojoConstructorOptionsAsync<Pojo, CtorInput>,
): Promise<Pojo> {
  return constructPojoFromInstanceAsync(
    new CTorPropsAsyncClass(pojoConstructorInput),
    pojoConstructorInput,
    pojoConstructorOptions,
  );
}
