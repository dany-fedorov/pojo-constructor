import { decoratePojoConstructorMethods } from './PojoConstructorSyncAndAsync/PojoConstructorSyncAndAsyncProxiesHost';

export class PojoConstructorDecorators {
  static props<T extends object, D = T>(
    decorate: (
      target: T,
      key: Extract<keyof T, string>,
    ) => (...args: any[]) => any,
  ): (obj: T) => D {
    return function (obj: T): D {
      return decoratePojoConstructorMethods(obj, decorate) as D;
    };
  }
}
