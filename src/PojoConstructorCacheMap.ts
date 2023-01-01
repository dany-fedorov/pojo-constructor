export class PojoConstructorCacheMap<T> {
  private map: Map<any, any> = new Map();

  has(propName: any, input: any): boolean {
    const hasProp = this.map.has(propName);
    if (!hasProp) {
      return false;
    }
    const inputsMap = this.map.get(propName) as Map<any, any>;
    const hasK2 = inputsMap.has(input);
    return hasK2;
  }

  get(propName: any, input: any): T | undefined {
    if (!this.has(propName, input)) {
      return undefined;
    }
    const inputsMap = this.map.get(propName) as Map<any, any>;
    const v = inputsMap.get(input);
    return v as T;
  }

  set(propName: any, input: any, value: T): void {
    const hasProp = this.map.has(propName);
    if (!hasProp) {
      this.map.set(propName, new Map());
    }
    const inputsMap = this.map.get(propName);
    inputsMap.set(input, value);
  }
}
