import type {
  PojoConstructorSyncAndAsyncProps,
  PojoSyncAndAsyncResult,
} from './PojoConstructorSyncAndAsyncProps';
import type { PojoConstructorSyncAndAsyncOptions } from './PojoConstructorSyncAndAsyncOptions';
import { PojoConstructorSyncAndAsync } from './PojoConstructorSyncAndAsync';

/**
 * Wrapper for {@link PojoConstructorSyncAndAsync}.
 */
export function constructPojoFromInstance<
  Pojo extends object,
  CtorInput = unknown,
>(
  ctorProps: PojoConstructorSyncAndAsyncProps<Pojo, CtorInput>,
  pojoConstructorInput?: CtorInput,
  pojoConstructorOptions?: PojoConstructorSyncAndAsyncOptions<Pojo, CtorInput>,
): PojoSyncAndAsyncResult<Pojo> {
  const ctor = new PojoConstructorSyncAndAsync<Pojo, CtorInput>(
    ctorProps,
    pojoConstructorOptions,
  );
  return ctor.new(pojoConstructorInput);
}

/**
 * Wrapper for {@link constructPojoFromInstance}.<br>
 * Instantiates `CTorPropsClass` passing `constructPojoInput` to constructor.
 */
export function constructPojoSyncAndAsync<Pojo extends object, CtorInput = unknown>(
  CTorPropsClass: {
    new (input?: CtorInput): PojoConstructorSyncAndAsyncProps<Pojo, CtorInput>;
  },
  pojoConstructorInput?: CtorInput,
  pojoConstructorOptions?: PojoConstructorSyncAndAsyncOptions<Pojo, CtorInput>,
): PojoSyncAndAsyncResult<Pojo> {
  return constructPojoFromInstance(
    new CTorPropsClass(pojoConstructorInput),
    pojoConstructorInput,
    pojoConstructorOptions,
  );
}
