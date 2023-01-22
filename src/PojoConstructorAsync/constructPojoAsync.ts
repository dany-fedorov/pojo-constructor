import type { PojoConstructorAsyncProps } from './PojoConstructorAsyncProps';
import type { PojoConstructorAsyncOptions } from './PojoConstructorAsyncOptions';
import { PojoConstructorAsync } from './PojoConstructorAsync';

/**
 * Wrapper for {@link PojoConstructorAsyncProps}.
 */
export function constructPojoFromInstanceAsync<
  Pojo extends object,
  CtorInput = unknown,
>(
  ctorProps: PojoConstructorAsyncProps<Pojo, CtorInput>,
  pojoConstructorInput?: CtorInput,
  pojoConstructorOptions?: PojoConstructorAsyncOptions<Pojo, CtorInput>,
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
    new (input?: CtorInput): PojoConstructorAsyncProps<Pojo, CtorInput>;
  },
  pojoConstructorInput?: CtorInput,
  pojoConstructorOptions?: PojoConstructorAsyncOptions<Pojo, CtorInput>,
): Promise<Pojo> {
  return constructPojoFromInstanceAsync(
    new CTorPropsAsyncClass(pojoConstructorInput),
    pojoConstructorInput,
    pojoConstructorOptions,
  );
}