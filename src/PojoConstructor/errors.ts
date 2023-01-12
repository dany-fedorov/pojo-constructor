import { _pojo_jsonStringifySafe, plines } from './utils';

export class PojoConstructorError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class PojoConstructorCannotAsyncResolveError extends PojoConstructorError {
  pojoConstructorThrownWhenProcessingKey: string;
  pojoConstructorStack: { key: string; stage: PojoKeyProcessingStage }[];

  constructor(prefix: string, propName: string, propMetohdResult: unknown) {
    super(
      plines(
        prefix,
        `Could not resolve property "${propName}"`,
        `- Result of "${propName}" method does not have neither "promise" nor "sync" properties`,
        `- Result - ${_pojo_jsonStringifySafe(propMetohdResult)}`,
      ),
    );
    this.pojoConstructorStack = [{ key: propName, stage: 'glue-code' }];
    this.pojoConstructorThrownWhenProcessingKey = propName;
  }
}

export class PojoConstructorCannotSyncResolveError extends PojoConstructorError {
  pojoConstructorThrownWhenProcessingKey: string;
  pojoConstructorStack: { key: string; stage: PojoKeyProcessingStage }[];

  constructor(prefix: string, key: string, keyMethodResult: unknown) {
    super(
      plines(
        prefix,
        `Could not resolve property "${key}"`,
        `- Result of "${key}" method does not have "sync" property`,
        `- Result - ${_pojo_jsonStringifySafe(keyMethodResult)}`,
      ),
    );
    this.pojoConstructorStack = [{ key, stage: 'glue-code' }];
    this.pojoConstructorThrownWhenProcessingKey = key;
  }
}

export type PojoKeyProcessingStage =
  | 'key-method'
  | 'glue-code'
  | 'promise-result-method'
  | 'sync-result-method'
  | 'promise-resolution'
  | 'unknown';

export class PojoConstructorNonErrorCaughtWrapperError extends Error {
  pojoConstructorOrigCaught: unknown;
  pojoConstructorStack: [{ key: string; stage: PojoKeyProcessingStage }];

  constructor(
    caught: unknown,
    pojoConstructorStackEntry: { key: string; stage: PojoKeyProcessingStage },
  ) {
    const msg = plines(
      'PojoConstructorNonErrorCaughtWrapperError',
      `Caught non error object when resolving "${pojoConstructorStackEntry.key}" key in "${pojoConstructorStackEntry.stage}"`,
      `- Caught object: ${_pojo_jsonStringifySafe(caught)}`,
    );
    super(msg);
    this.pojoConstructorOrigCaught = caught;
    this.pojoConstructorStack = [{ ...pojoConstructorStackEntry }];
  }
}

export class PojoConstructorCacheMapCannotGet extends Error {
  pojoConstructorCacheMapPropName: any;
  pojoConstructorCacheMapPropNameInputCacheKey: any;

  constructor(propName: any, inputCacheKey: any) {
    const msg = plines(
      'PojoConstructorCacheMap',
      'Cannot get by',
      `- Prop Name ${_pojo_jsonStringifySafe(propName)}`,
      `- Input ${_pojo_jsonStringifySafe(inputCacheKey)}`,
    );
    super(msg);
    this.pojoConstructorCacheMapPropName = propName;
    this.pojoConstructorCacheMapPropNameInputCacheKey = inputCacheKey;
  }
}
