import type {
  PojoConstructorSyncAndAsyncProps,
  PojoKeyProcessingStage,
} from './PojoConstructorSyncAndAsyncProps';

export type PojoConstructorOptionsCatchFn = {
  key: string;
  keysStack: { key: string; stage: PojoKeyProcessingStage }[];
  keySequentialIndex: number | null;
};

export type PojoConstructorSyncAndAsyncOptions<
  Pojo extends object,
  CtorInput,
> = {
  /**
   * A function that produces a list of string property names that should be applied to the Pojo Constructor.
   *
   * @default
   * By default, {@link extractMethodKeysForPojoConstructorInstance} function is applied.<br>
   * It works like this:
   * - Use Object.getOwnPropertyNames on ctor
   * - Keep only typeof "function" properties and exclude "constructor" property
   * - Exclude keys that are not string
   * - Recur for prototype of ctor
   */
  keys?: () => Extract<keyof Pojo, string>[];
  /**
   * A function that takes property names produces either by `keys` function or by default {@link extractMethodKeysForPojoConstructorInstance} function
   * and returns them sorted.
   * Property names will be processed in this order, unless `concurrency` option is set.
   *
   * @default
   * By default, property names are sorted lexicographically.
   */
  sortKeys?: (
    keys: Extract<keyof Pojo, string>[],
  ) => Extract<keyof Pojo, string>[];
  /**
   * Minimum num value is `1`.
   *
   * If this option is set, uses [p-map](https://www.npmjs.com/package/p-map) to process properties in async mode.
   * This is passed through as `concurrency` option of [p-map](https://www.npmjs.com/package/p-map) lib.
   */
  concurrency?: number;
  /**
   * Function that should produce a cache key from constructor input.
   * Used by `cachingProxy` to only evaluate property once.
   * Default is identity function - `(x) => x`
   */
  cacheKeyFromConstructorInput?: (input?: CtorInput) => unknown;
  /**
   * Is called when property constructor method throws an error.
   */
  catch?: (caught: unknown, options: PojoConstructorOptionsCatchFn) => unknown;
  name?: string;
  _experimental_syncAndAsyncPropsDecorators?: ((
    obj: PojoConstructorSyncAndAsyncProps<Pojo, CtorInput>,
  ) => PojoConstructorSyncAndAsyncProps<Pojo, CtorInput>)[];
};
