import { PojoConstructorSyncAndAsync } from '../PojoConstructorSyncAndAsync/PojoConstructorSyncAndAsync';
import type { PojoConstructorAsyncOptions } from './PojoConstructorAsyncOptions';
import type { PojoConstructorAsyncProps } from './PojoConstructorAsyncProps';
import { PojoConstructorAdapters } from '../PojoConstructorAdapters';

/**
 * Constructor methods for each of properties returns promise for `{ value }` object.
 *
 * @usage
 * ```typescript
 * const ctor = new PojoConstructorAsync<{ field: number }, number>({ field: async (input) => ({ value: input + 2 }) })
 * const obj = await ctor.new(2);
 * assert.strictEqual(obj.field, 4);
 * ```
 */
export class PojoConstructorAsync<Pojo extends object, CtorInput = unknown> {
  public readonly pojoConstructor: PojoConstructorSyncAndAsync<Pojo, CtorInput>;

  constructor(
    public readonly props: PojoConstructorAsyncProps<Pojo, CtorInput>,
    public readonly options?: PojoConstructorAsyncOptions<
      Pojo,
      CtorInput
    >,
  ) {
    this.pojoConstructor = new PojoConstructorSyncAndAsync<Pojo, CtorInput>(
      PojoConstructorAdapters.props({ src: 'async', dst: 'sync-and-async' })(
        this.props,
      ),
      this.options,
    );
  }

  new(
    input?: CtorInput,
    options?: PojoConstructorAsyncOptions<Pojo, CtorInput>,
  ): Promise<Pojo> {
    return this.pojoConstructor.new(input, options).async!();
  }
}
