import { PojoConstructorNonErrorCaughtWrapperError, PojoKeyProcessingStage } from './errors';

export const processCaughtInCachingProxy = (
  caught: unknown,
  thrownIn: [string, PojoKeyProcessingStage],
): unknown => {
  if (caught instanceof Error) {
    if (!Array.isArray((caught as any).thrownIn)) {
      (caught as any).thrownIn = [];
    }
    (caught as any).thrownIn.push(thrownIn);
    return caught;
  } else {
    return new PojoConstructorNonErrorCaughtWrapperError(caught, thrownIn);
  }
};

