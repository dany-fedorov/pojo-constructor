import { _pojo_jsonStringifySafe, plines } from './utils';

export class PojoConstructorError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class PojoConstructorCannotAsyncResolveError extends PojoConstructorError {
  constructor(prefix: string, propName: string, propMetohdResult: unknown) {
    super(
      plines(
        prefix,
        `Could not resolve property "${propName}"`,
        `- Result of "${propName}" method does not have neither "promise" nor "sync" properties`,
        `- Result - ${_pojo_jsonStringifySafe(propMetohdResult)}`,
      ),
    );
  }
}

export class PojoConstructorCannotSyncResolveError extends PojoConstructorError {
  pojoConstructorThrownWhenProcessingKey: string;
  pojoConstructorThrownIn: PojoKeyProcessingStage;

  constructor(prefix: string, key: string, keyMethodResult: unknown) {
    super(
      plines(
        prefix,
        `Could not resolve property "${key}"`,
        `- Result of "${key}" method does not have "sync" property`,
        `- Result - ${_pojo_jsonStringifySafe(keyMethodResult)}`,
      ),
    );
    this.pojoConstructorThrownIn = 'caching-proxy-glue-code';
    this.pojoConstructorThrownWhenProcessingKey = key;
  }
}

export type PojoKeyProcessingStage =
  | 'key-method'
  | 'caching-proxy-glue-code'
  | 'promise-result-method'
  | 'sync-result-method'
  | 'promise'
  | 'unknown';

export class PojoConstructorNonErrorCaughtWrapperError extends Error {
  pojoConstructorOrigCaught: unknown;
  pojoConstructorThrownIn: [string, PojoKeyProcessingStage][];

  constructor(
    caught: unknown,
    pojoConstructorThrownIn: [string, PojoKeyProcessingStage],
  ) {
    const msg = plines(
      'PojoConstructorNonErrorCaughtWrapperError',
      `Caught non error object when resolving "${pojoConstructorThrownIn[0]}" key in "${pojoConstructorThrownIn[1]}"`,
      `- Caught object: ${_pojo_jsonStringifySafe(caught)}`,
    );
    super(msg);
    this.pojoConstructorOrigCaught = caught;
    this.pojoConstructorThrownIn = [pojoConstructorThrownIn];
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
