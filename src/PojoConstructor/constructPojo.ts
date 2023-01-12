import type {
  PojoConstructorProps,
  PojoSyncAndPromiseResult,
} from './PojoConstructorProps';
import type { PojoConstructorOptions } from './PojoConstructorOptions';
import { PojoConstructor } from './PojoConstructor';

export function constructPojoFromInstance<
  Pojo extends object,
  CtorInput = unknown,
>(
  ctorProps: PojoConstructorProps<Pojo, CtorInput>,
  pojoConstructorInput?: CtorInput,
  pojoConstructorOptions?: PojoConstructorOptions<Pojo, CtorInput>,
): PojoSyncAndPromiseResult<Pojo> {
  const ctor = new PojoConstructor<Pojo, CtorInput>(
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
 * @param constructPojoInput - An input that will be passed to each property constructor method.
 * @param constructPojoOptions
 */
export function constructPojo<Pojo extends object, CtorInput = unknown>(
  CTorClass: { new (input?: CtorInput): PojoConstructorProps<Pojo, CtorInput> },
  pojoConstructorInput?: CtorInput,
  pojoConstructorOptions?: PojoConstructorOptions<Pojo, CtorInput>,
): PojoSyncAndPromiseResult<Pojo> {
  return constructPojoFromInstance(
    new CTorClass(pojoConstructorInput),
    pojoConstructorInput,
    pojoConstructorOptions,
  );
}
