import { PojoConstructorCacheMap } from '../src/PojoConstructorCacheMap';

describe('PojoConstructorCacheMap', function () {
  test('Throws when cannot get', () => {
    const cacheMap = new PojoConstructorCacheMap();
    const p1 = 'p1';
    const p2 = 'p2';
    const i1 = 'i1';
    const i2 = 'i2';
    const v1 = 'v1;';
    cacheMap.set(p1, i1, v1);
    expect(cacheMap.has(p1, i1)).toBe(true);
    expect(cacheMap.get(p1, i1)).toBe(v1);
    expect(cacheMap.has(p2, i2)).toBe(false);
    expect(() => cacheMap.get(p2, i2)).toThrowErrorMatchingInlineSnapshot(`
      "PojoConstructorCacheMap: Cannot get by
      PojoConstructorCacheMap: - Prop Name \\"p2\\"
      PojoConstructorCacheMap: - Input \\"i2\\""
    `);
  });
});
