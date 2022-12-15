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
  thrownWhenProcessingKey: string;
  thrownIn: PojoKeyProcessingStage;

  constructor(prefix: string, key: string, keyMethodResult: unknown) {
    super(
      plines(
        prefix,
        `Could not resolve property "${key}"`,
        `- Result of "${key}" method does not have "sync" property`,
        `- Result - ${_pojo_jsonStringifySafe(keyMethodResult)}`,
      ),
    );
    this.thrownIn = 'caching-proxy-glue-code';
    this.thrownWhenProcessingKey = key;
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
  origCaught: unknown;
  thrownIn: [string, PojoKeyProcessingStage][];

  constructor(caught: unknown, thrownIn: [string, PojoKeyProcessingStage]) {
    const msg = plines(
      'PojoConstructorNonErrorCaughtWrapperError',
      `Caught non error object when resolving "${thrownIn[0]}" key in "${thrownIn[1]}"`,
      `- Caught object: ${_pojo_jsonStringifySafe(caught)}`,
    );
    super(msg);
    this.origCaught = caught;
    this.thrownIn = [thrownIn];
  }
}
