import type { PojoConstructorSyncProps } from './PojoConstructorSyncProps';
import type { PojoConstructorSyncOptions } from './PojoConstructorSyncOptions';
import { PojoConstructorSync } from './PojoConstructorSync';
import type { PojoHost } from '../PojoConstructorSyncAndAsync/PojoHost';

/**
 * Wrapper for {@link PojoConstructorSync}.
 */
export function constructPojoFromInstanceSync<
  Pojo extends object,
  CtorInput = unknown,
>(
  ctorProps: PojoConstructorSyncProps<Pojo, CtorInput>,
  pojoConstructorInput?: CtorInput,
  pojoConstructorOptions?: PojoConstructorSyncOptions<Pojo, CtorInput>,
): PojoHost<Pojo> {
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
    new (input?: CtorInput): PojoConstructorSyncProps<Pojo, CtorInput>;
  },
  pojoConstructorInput?: CtorInput,
  pojoConstructorOptions?: PojoConstructorSyncOptions<Pojo, CtorInput>,
): PojoHost<Pojo> {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return constructPojoFromInstanceSync(
    new CTorPropsSyncClass(pojoConstructorInput),
    pojoConstructorInput,
    pojoConstructorOptions,
  );
}
