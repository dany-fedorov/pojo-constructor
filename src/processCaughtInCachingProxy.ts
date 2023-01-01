import {
  PojoConstructorNonErrorCaughtWrapperError,
  PojoKeyProcessingStage,
} from './errors';

export const processCaughtInCachingProxy = (
  caught: unknown,
  pojoConstructorThrownIn: [string, PojoKeyProcessingStage],
): unknown => {
  if (caught instanceof Error) {
    if (!Array.isArray((caught as any).pojoConstructorThrownIn)) {
      (caught as any).pojoConstructorThrownIn = [];
    }
    (caught as any).pojoConstructorThrownIn = [
      ...(caught as any).pojoConstructorThrownIn,
      ...pojoConstructorThrownIn,
    ];
    return caught;
  } else {
    return new PojoConstructorNonErrorCaughtWrapperError(
      caught,
      pojoConstructorThrownIn,
    );
  }
};
