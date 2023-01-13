import type {
  PojoConstructorProps,
  PojoSyncAndPromiseResult,
} from './PojoConstructorProps';
import type { PojoConstructorOptions } from './PojoConstructorOptions';
import { PojoConstructor } from './PojoConstructor';

/**
 * Wrapper for {@link PojoConstructor}.
 */
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
 * Instantiates `CTorPropsClass` passing `constructPojoInput` to constructor.
 */
export function constructPojo<Pojo extends object, CtorInput = unknown>(
  CTorPropsClass: {
    new (input?: CtorInput): PojoConstructorProps<Pojo, CtorInput>;
  },
  pojoConstructorInput?: CtorInput,
  pojoConstructorOptions?: PojoConstructorOptions<Pojo, CtorInput>,
): PojoSyncAndPromiseResult<Pojo> {
  return constructPojoFromInstance(
    new CTorPropsClass(pojoConstructorInput),
    pojoConstructorInput,
    pojoConstructorOptions,
  );
}
