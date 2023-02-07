import { PojoConstructorSyncAndAsync } from '../PojoConstructorSyncAndAsync/PojoConstructorSyncAndAsync';
import type { PojoConstructorSyncOptions } from './PojoConstructorSyncOptions';
import type { PojoConstructorSyncProps } from './PojoConstructorSyncProps';
import { PojoConstructorAdapters } from '../PojoConstructorAdapters';
import type { PojoHost } from '../PojoConstructorSyncAndAsync/PojoHost';

/**
 * Constructor methods for each of properties returns `{ value }` object synchronously.
 *
 * @usage
 * ```typescript
 * const ctor = new PojoConstructorSync<{ field: number }, number>({ field: (input) => ({ value: input + 2 }) })
 * const obj = ctor.new(2);
 * assert.strictEqual(obj.field, 4);
 * ```
 */
export class PojoConstructorSync<Pojo extends object, CtorInput = unknown> {
  public readonly pojoConstructor: PojoConstructorSyncAndAsync<Pojo, CtorInput>;

  constructor(
    public readonly props: PojoConstructorSyncProps<Pojo, CtorInput>,
    public readonly options?: PojoConstructorSyncOptions<Pojo, CtorInput>,
  ) {
    this.pojoConstructor = new PojoConstructorSyncAndAsync<Pojo, CtorInput>(
      PojoConstructorAdapters.props({ src: 'sync', dst: 'sync-and-async' })(
        this.props,
      ),
      this.options,
    );
  }

  new(
    input?: CtorInput,
    options?: PojoConstructorSyncOptions<Pojo, CtorInput>,
  ): PojoHost<Pojo> {
    return this.pojoConstructor.new(input, options).sync!();
  }
}
