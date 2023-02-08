import type {
  PojoConstructorSyncAndAsyncProps,
  PojoSyncAndAsyncResult,
} from './PojoConstructorSyncAndAsyncProps';
import type { PojoConstructorSyncAndAsyncOptions } from './PojoConstructorSyncAndAsyncOptions';
import { PojoConstructorSyncAndAsync } from './PojoConstructorSyncAndAsync';
import type { PojoHost } from './PojoHost';

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
): PojoSyncAndAsyncResult<PojoHost<Pojo>> {
  const ctor = new PojoConstructorSyncAndAsync<Pojo, CtorInput>(
    ctorProps,
    pojoConstructorOptions,
  );
  return ctor.pojo(pojoConstructorInput);
}

/**
 * Wrapper for {@link constructPojoFromInstance}.<br>
 * Instantiates `CTorPropsClass` passing `constructPojoInput` to constructor.
 */
export function constructPojoSyncAndAsync<
  Pojo extends object,
  CtorInput = unknown,
>(
  CTorPropsClass: {
    new (input?: CtorInput): PojoConstructorSyncAndAsyncProps<Pojo, CtorInput>;
  },
  pojoConstructorInput?: CtorInput,
  pojoConstructorOptions?: PojoConstructorSyncAndAsyncOptions<Pojo, CtorInput>,
): PojoSyncAndAsyncResult<PojoHost<Pojo>> {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return constructPojoFromInstance(
    new CTorPropsClass(pojoConstructorInput),
    pojoConstructorInput,
    pojoConstructorOptions,
  );
}
