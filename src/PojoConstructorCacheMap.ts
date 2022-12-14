export class PojoConstructorCacheMap<T> {
  map: Map<any, any>;

  constructor() {
    this.map = new Map();
  }

  has(k1: any, k2: any): boolean {
    const hasK1 = this.map.has(k1);
    if (!hasK1) {
      return false;
    }
    const map2 = this.map.get(k1) as Map<any, any>;
    const hasK2 = map2.has(k2);
    return hasK2;
  }

  get(k1: any, k2: any): T | undefined {
    if (!this.has(k1, k2)) {
      return undefined;
    }
    const map2 = this.map.get(k1) as Map<any, any>;
    const v = map2.get(k2);
    return v as T;
  }

  set(k1: any, k2: any, v: T): void {
    const hasK1 = this.map.has(k1);
    if (!hasK1) {
      this.map.set(k1, new Map());
    }
    const map2 = this.map.get(k1);
    map2.set(k2, v);
  }
}
