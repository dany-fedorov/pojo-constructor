export class PojoConstructorCacheMap<T> {
  map: Map<any, any>;

  constructor() {
    this.map = new Map();
  }

  has(propName: any, input: any): boolean {
    const hasK1 = this.map.has(propName);
    if (!hasK1) {
      return false;
    }
    const map2 = this.map.get(propName) as Map<any, any>;
    const hasK2 = map2.has(input);
    return hasK2;
  }

  get(propName: any, input: any): T | undefined {
    if (!this.has(propName, input)) {
      return undefined;
    }
    const map2 = this.map.get(propName) as Map<any, any>;
    const v = map2.get(input);
    return v as T;
  }

  set(propName: any, input: any, value: T): void {
    const hasK1 = this.map.has(propName);
    if (!hasK1) {
      this.map.set(propName, new Map());
    }
    const map2 = this.map.get(propName);
    map2.set(input, value);
  }
}
