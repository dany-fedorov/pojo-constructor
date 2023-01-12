import { PojoConstructorCacheMapCannotGet } from './errors';

export class PojoConstructorCacheMap<T> {
  private map: Map<any, any> = new Map();

  has(propName: any, inputCacheKey: any): boolean {
    const hasProp = this.map.has(propName);
    if (!hasProp) {
      return false;
    }
    const inputsMap = this.map.get(propName) as Map<any, any>;
    const hasInputCacheKey = inputsMap.has(inputCacheKey);
    return hasInputCacheKey;
  }

  get(propName: any, inputCacheKey: any): T {
    if (!this.has(propName, inputCacheKey)) {
      throw new PojoConstructorCacheMapCannotGet(propName, inputCacheKey);
    }
    const inputsMap = this.map.get(propName) as Map<any, any>;
    const v = inputsMap.get(inputCacheKey);
    return v as T;
  }

  set(propName: any, inputCacheKey: any, value: T): void {
    const hasProp = this.map.has(propName);
    if (!hasProp) {
      this.map.set(propName, new Map());
    }
    const inputsMap = this.map.get(propName);
    inputsMap.set(inputCacheKey, value);
  }
}
