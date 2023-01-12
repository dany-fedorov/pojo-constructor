import {
  PojoConstructorNonErrorCaughtWrapperError,
  PojoKeyProcessingStage,
} from './errors';

export const processCaughtInCachingProxy = (
  caught: unknown,
  pojoConstructorStackEntry: { key: string; stage: PojoKeyProcessingStage },
): unknown => {
  if (caught instanceof Error) {
    if (!Array.isArray((caught as any).pojoConstructorStack)) {
      (caught as any).pojoConstructorStack = [];
    }
    (caught as any).pojoConstructorStack = [
      { ...pojoConstructorStackEntry },
      ...(caught as any).pojoConstructorStack,
    ];
    return caught;
  } else {
    return new PojoConstructorNonErrorCaughtWrapperError(
      caught,
      pojoConstructorStackEntry,
    );
  }
};
