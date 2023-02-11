import { PojoConstructorSyncAndAsync } from '../PojoConstructorSyncAndAsync/PojoConstructorSyncAndAsync';
import type { PojoConstructorAsyncOptions } from './PojoConstructorAsyncOptions';
import type { PojoConstructorAsyncProps } from './PojoConstructorAsyncProps';
import { PojoConstructorAdapters } from '../PojoConstructorAdapters';
import type { PojoHost } from '../PojoConstructorSyncAndAsync/PojoHost';

/**
 * Constructor methods for each of properties returns promise for `{ value }` object.
 *
 * @usage
 * ```typescript
 * const ctor = new PojoConstructorAsync<{ field: number }, number>({ field: async (input) => ({ value: input + 2 }) })
 * const obj = await ctor.pojo(2);
 * assert.strictEqual(obj.field, 4);
 * ```
 */
export class PojoConstructorAsync<Pojo extends object, CtorInput = unknown> {
  public readonly pojoConstructor: PojoConstructorSyncAndAsync<Pojo, CtorInput>;

  constructor(
    public readonly props: PojoConstructorAsyncProps<Pojo, CtorInput>,
    public readonly options?: PojoConstructorAsyncOptions<Pojo, CtorInput>,
  ) {
    this.pojoConstructor = new PojoConstructorSyncAndAsync<Pojo, CtorInput>(
      PojoConstructorAdapters.props({ src: 'async', dst: 'sync-and-async' })(
        this.props,
      ),
      this.options,
    );
  }

  static new<Pojo extends object, CtorInput = unknown>(
    props: PojoConstructorAsyncProps<Pojo, CtorInput>,
    options?: PojoConstructorAsyncOptions<Pojo, CtorInput>,
  ): PojoConstructorAsync<Pojo, CtorInput> {
    return new PojoConstructorAsync<Pojo, CtorInput>(props, options);
  }

  static create<Pojo extends object, CtorInput = unknown>(
    options: PojoConstructorAsyncOptions<Pojo, CtorInput> | null,
    props: PojoConstructorAsyncProps<Pojo, CtorInput>,
  ): PojoConstructorAsync<Pojo, CtorInput> {
    const effectiveOptions = options === null ? {} : options;
    return new PojoConstructorAsync<Pojo, CtorInput>(props, effectiveOptions);
  }

  pojo(
    input?: CtorInput,
    options?: PojoConstructorAsyncOptions<Pojo, CtorInput>,
  ): Promise<PojoHost<Pojo>> {
    return this.pojoConstructor.pojo(input, options).async!();
  }
}

export const PCAS = PojoConstructorAsync;
