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
  constructor(prefix: string, propName: string, propMetohdResult: unknown) {
    super(
      plines(
        prefix,
        `Could not resolve property "${propName}"`,
        `- Result of "${propName}" method does not have "sync" property`,
        `- Result - ${_pojo_jsonStringifySafe(propMetohdResult)}`,
      ),
    );
  }
}
