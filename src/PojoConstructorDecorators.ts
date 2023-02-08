import { decoratePojoConstructorMethods } from './PojoConstructorSyncAndAsync/PojoConstructorSyncAndAsyncProxiesHost';

export class PojoConstructorDecorators {
  static props<T extends object>(
    decorate: (
      target: T,
      key: Extract<keyof T, string>,
    ) => (...args: any[]) => unknown,
  ): (obj: T) => T {
    return function (obj: T): T {
      return decoratePojoConstructorMethods(obj, decorate) as T;
    };
  }
}
