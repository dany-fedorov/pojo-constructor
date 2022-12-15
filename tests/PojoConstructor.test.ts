import type { PojoConstructorCachingProxy, PojoConstructor } from '../src';
import { constructPojo, constructPojoFromInstance } from '../src';

describe('PojoConstructor + pojoFrom', function () {
  test('it should construct from plain', () => {
    const c: PojoConstructor<{ a: string; b: number }> = {
      a: () => ({ sync: () => 'a-string' }),
      b: () => ({ sync: () => 123 }),
    };
    const pojo = constructPojoFromInstance(c).sync();
    expect(pojo).toMatchInlineSnapshot(`
      Object {
        "a": "a-string",
        "b": 123,
      }
    `);
  });

  test('it should construct from class instance', () => {
    class C implements PojoConstructor<{ a: string; b: number }> {
      a() {
        return { sync: () => 'a-string' };
      }

      b() {
        return { sync: () => 123 };
      }
    }

    const c = new C();
    const pojo = constructPojoFromInstance(c).sync();
    expect(pojo).toMatchInlineSnapshot(`
      Object {
        "a": "a-string",
        "b": 123,
      }
    `);
  });

  test('it should construct from nested class instance', () => {
    type PojoC = PojoConstructor<{ a: string; b: number }>;

    class Base implements Pick<PojoC, 'a'> {
      a() {
        return { sync: () => 'a-string' };
      }
    }

    class C extends Base implements PojoC {
      b() {
        return { sync: () => 123 };
      }
    }

    const c = new C();
    const pojo = constructPojoFromInstance(c).sync();
    expect(pojo).toMatchInlineSnapshot(`
      Object {
        "a": "a-string",
        "b": 123,
      }
    `);
  });

  test('it should pass input', () => {
    const c: PojoConstructor<{ a: string; b: number }, boolean> = {
      a: (input) => ({
        sync: () =>
          input ? 'a-string-truthy-variant' : 'a-string-falsy-variant',
      }),
      b: (input) => ({ sync: () => (input ? 123 : 321) }),
    };
    const pojo1 = constructPojoFromInstance(c, true).sync();
    expect(pojo1).toMatchInlineSnapshot(`
      Object {
        "a": "a-string-truthy-variant",
        "b": 123,
      }
    `);
    const pojo2 = constructPojoFromInstance(c, false).sync();
    expect(pojo2).toMatchInlineSnapshot(`
      Object {
        "a": "a-string-falsy-variant",
        "b": 321,
      }
    `);
  });

  test('async', async () => {
    const c: PojoConstructor<{ a: string; b: number }> = {
      a: () => ({ sync: () => 'a-string' }),
      b: () => ({ promise: () => Promise.resolve(123) }),
    };
    const pojo = await constructPojoFromInstance(c).promise();
    expect(pojo).toMatchInlineSnapshot(`
      Object {
        "a": "a-string",
        "b": 123,
      }
    `);
  });

  test('only evaluated once', async () => {
    let acounter = 0;
    let bcounter = 0;
    let ccounter = 0;

    class C implements PojoConstructor<{ a: string; b: string; c: string }> {
      a() {
        return {
          sync: () => {
            acounter++;
            return 'a-string';
          },
        };
      }

      b() {
        return {
          sync: () => {
            bcounter++;
            return this.a().sync();
          },
        };
      }

      c() {
        return {
          sync: () => {
            ccounter++;
            return this.b().sync();
          },
        };
      }
    }

    const c = new C();
    const pojo = constructPojoFromInstance(c).sync();
    expect(pojo).toMatchInlineSnapshot(`
      Object {
        "a": "a-string",
        "b": "a-string",
        "c": "a-string",
      }
    `);
    expect(acounter).toBe(1);
    expect(bcounter).toBe(1);
    expect(ccounter).toBe(1);
  });

  test('only evaluated once - async', async () => {
    let acounter = 0;
    let bcounter = 0;
    let ccounter = 0;

    class C implements PojoConstructor<{ a: string; b: string; c: string }> {
      a() {
        return {
          sync: () => {
            acounter++;
            return 'a-string';
          },
        };
      }

      b() {
        return {
          promise: async () => {
            bcounter++;
            return this.a().sync();
          },
        };
      }

      c() {
        return {
          promise: () => {
            ccounter++;
            return this.b().promise();
          },
        };
      }
    }

    const c = new C();
    const pojo = await constructPojoFromInstance(c).promise();
    expect(pojo).toMatchInlineSnapshot(`
      Object {
        "a": "a-string",
        "b": "a-string",
        "c": "a-string",
      }
    `);
    expect(acounter).toBe(1);
    expect(bcounter).toBe(1);
    expect(ccounter).toBe(1);
  });

  test('caching by input - using cachingProxy argument', () => {
    let acounter = 0;
    const c: PojoConstructor<{ a: string; b: string; c: string }, boolean> = {
      a: (input) => ({
        sync: () => {
          acounter++;
          return input ? 'a-string-truthy-variant' : 'a-string-falsy-variant';
        },
      }),
      b: (input, cachingProxy) => ({
        sync: () => cachingProxy.a(!input).sync!(),
      }),
      c: (input, cachingProxy) => ({
        sync: () => cachingProxy.a(input).sync!(),
      }),
    };
    const pojo1 = constructPojoFromInstance(c, true).sync();
    expect(pojo1).toMatchInlineSnapshot(`
      Object {
        "a": "a-string-truthy-variant",
        "b": "a-string-falsy-variant",
        "c": "a-string-truthy-variant",
      }
    `);
    expect(acounter).toBe(2);
    const pojo2 = constructPojoFromInstance(c, false).sync();
    expect(pojo2).toMatchInlineSnapshot(`
      Object {
        "a": "a-string-falsy-variant",
        "b": "a-string-truthy-variant",
        "c": "a-string-falsy-variant",
      }
    `);
    expect(acounter).toBe(4);
  });

  test('caching by input - using this', async () => {
    let acounter = 0;
    let bcounter = 0;
    let ccounter = 0;

    class C
      implements PojoConstructor<{ a: string; b: string; c: string }, boolean>
    {
      a(input: boolean) {
        return {
          sync: () => {
            acounter++;
            return `a-string-${input}`;
          },
        };
      }

      b(input: boolean) {
        return {
          promise: async () => {
            bcounter++;
            return this.a(input).sync();
          },
        };
      }

      c(input: boolean) {
        return {
          promise: () => {
            ccounter++;
            return this.b(input).promise();
          },
        };
      }
    }

    const pojo = await constructPojoFromInstance(new C(), true).promise();
    expect(pojo).toMatchInlineSnapshot(`
      Object {
        "a": "a-string-true",
        "b": "a-string-true",
        "c": "a-string-true",
      }
    `);
    expect(acounter).toBe(1);
    expect(bcounter).toBe(1);
    expect(ccounter).toBe(1);
  });

  test('eval order - default sorting', async () => {
    const evalOrder: string[] = [];
    const counts: any = {};

    class C
      implements PojoConstructor<{ a: string; b: string; c: string }, boolean>
    {
      b(input: boolean) {
        evalOrder.push('b');
        return {
          sync: () => {
            if (!counts['b']) {
              counts['b'] = 0;
            }
            counts['b']++;
            return this.a(input).sync();
          },
        };
      }

      a(input: boolean) {
        evalOrder.push('a');
        return {
          sync: () => {
            if (!counts['a']) {
              counts['a'] = 0;
            }
            counts['a']++;
            return `a-string-${input}`;
          },
        };
      }

      c(input: boolean) {
        evalOrder.push('c');
        return {
          sync: () => {
            if (!counts['c']) {
              counts['c'] = 0;
            }
            counts['c']++;
            return this.b(input).sync();
          },
        };
      }

      d99(input: boolean) {
        evalOrder.push('d99');
        return {
          sync: () => {
            if (!counts['d99']) {
              counts['d99'] = 0;
            }
            counts['d99']++;
            return this.b(input).sync();
          },
        };
      }

      d10(input: boolean) {
        evalOrder.push('d10');
        return {
          sync: () => {
            if (!counts['d10']) {
              counts['d10'] = 0;
            }
            counts['d10']++;
            return this.b(input).sync();
          },
        };
      }

      d101(input: boolean) {
        evalOrder.push('d101');
        return {
          sync: () => {
            if (!counts['d101']) {
              counts['d101'] = 0;
            }
            counts['d101']++;
            return this.b(input).sync();
          },
        };
      }
    }

    const pojo = await constructPojoFromInstance(new C(), true).promise();
    expect(pojo).toMatchInlineSnapshot(`
      Object {
        "a": "a-string-true",
        "b": "a-string-true",
        "c": "a-string-true",
        "d10": "a-string-true",
        "d101": "a-string-true",
        "d99": "a-string-true",
      }
    `);
    expect(evalOrder).toMatchInlineSnapshot(`
      Array [
        "a",
        "b",
        "c",
        "d10",
        "d101",
        "d99",
      ]
    `);
    expect(counts).toMatchInlineSnapshot(`
      Object {
        "a": 1,
        "b": 1,
        "c": 1,
        "d10": 1,
        "d101": 1,
        "d99": 1,
      }
    `);
  });

  test('eval order - reversed sorting', async () => {
    const evalOrder: string[] = [];
    const counts: any = {};

    class C
      implements PojoConstructor<{ a: string; b: string; c: string }, null>
    {
      b() {
        evalOrder.push('b');
        return {
          sync: () => {
            if (!counts['b']) {
              counts['b'] = 0;
            }
            counts['b']++;
            return 'b';
          },
        };
      }

      a() {
        evalOrder.push('a');
        return {
          sync: () => {
            if (!counts['a']) {
              counts['a'] = 0;
            }
            counts['a']++;
            return `a`;
          },
        };
      }

      c() {
        evalOrder.push('c');
        return {
          sync: () => {
            if (!counts['c']) {
              counts['c'] = 0;
            }
            counts['c']++;
            return 'c';
          },
        };
      }

      d99() {
        evalOrder.push('d99');
        return {
          sync: () => {
            if (!counts['d99']) {
              counts['d99'] = 0;
            }
            counts['d99']++;
            return 'd99';
          },
        };
      }

      d10() {
        evalOrder.push('d10');
        return {
          sync: () => {
            if (!counts['d10']) {
              counts['d10'] = 0;
            }
            counts['d10']++;
            return 'd10';
          },
        };
      }

      d101() {
        evalOrder.push('d101');
        return {
          sync: () => {
            if (!counts['d101']) {
              counts['d101'] = 0;
            }
            counts['d101']++;
            return 'd101';
          },
        };
      }
    }

    const pojo = await constructPojoFromInstance(new C(), null, {
      sortKeys: (keys) => keys.slice().sort((a, b) => (a > b ? -1 : 1)),
    }).promise();
    expect(pojo).toMatchInlineSnapshot(`
      Object {
        "a": "a",
        "b": "b",
        "c": "c",
        "d10": "d10",
        "d101": "d101",
        "d99": "d99",
      }
    `);
    expect(evalOrder).toMatchInlineSnapshot(`
      Array [
        "d99",
        "d101",
        "d10",
        "c",
        "b",
        "a",
      ]
    `);
    expect(counts).toMatchInlineSnapshot(`
      Object {
        "a": 1,
        "b": 1,
        "c": 1,
        "d10": 1,
        "d101": 1,
        "d99": 1,
      }
    `);
  });

  test('async eval order - default sorting', async () => {
    const evalOrder: string[] = [];
    const counts: any = {};

    class C
      implements PojoConstructor<{ a: string; b: string; c: string }, boolean>
    {
      b(input: boolean) {
        evalOrder.push('b');
        return {
          promise: async () => {
            if (!counts['b']) {
              counts['b'] = 0;
            }
            counts['b']++;
            return this.a(input).promise();
          },
        };
      }

      a(input: boolean) {
        evalOrder.push('a');
        return {
          promise: async () => {
            if (!counts['a']) {
              counts['a'] = 0;
            }
            counts['a']++;
            return `a-string-${input}`;
          },
        };
      }

      c(input: boolean) {
        evalOrder.push('c');
        return {
          promise: async () => {
            if (!counts['c']) {
              counts['c'] = 0;
            }
            counts['c']++;
            return this.b(input).promise();
          },
        };
      }

      d99(input: boolean) {
        evalOrder.push('d99');
        return {
          promise: () => {
            if (!counts['d99']) {
              counts['d99'] = 0;
            }
            counts['d99']++;
            return this.b(input).promise();
          },
        };
      }

      d10(input: boolean) {
        evalOrder.push('d10');
        return {
          promise: () => {
            if (!counts['d10']) {
              counts['d10'] = 0;
            }
            counts['d10']++;
            return this.b(input).promise();
          },
        };
      }

      d101(input: boolean) {
        evalOrder.push('d101');
        return {
          promise: () => {
            if (!counts['d101']) {
              counts['d101'] = 0;
            }
            counts['d101']++;
            return this.b(input).promise();
          },
        };
      }
    }

    const pojo = await constructPojoFromInstance(new C(), true).promise();
    expect(pojo).toMatchInlineSnapshot(`
      Object {
        "a": "a-string-true",
        "b": "a-string-true",
        "c": "a-string-true",
        "d10": "a-string-true",
        "d101": "a-string-true",
        "d99": "a-string-true",
      }
    `);
    expect(evalOrder).toMatchInlineSnapshot(`
      Array [
        "a",
        "b",
        "c",
        "d10",
        "d101",
        "d99",
      ]
    `);
    expect(counts).toMatchInlineSnapshot(`
      Object {
        "a": 1,
        "b": 1,
        "c": 1,
        "d10": 1,
        "d101": 1,
        "d99": 1,
      }
    `);
  });

  test('async eval order - reversed sorting', async () => {
    const evalOrder: string[] = [];
    const counts: any = {};

    class C
      implements PojoConstructor<{ a: string; b: string; c: string }, null>
    {
      b() {
        evalOrder.push('b');
        return {
          promise: async () => {
            if (!counts['b']) {
              counts['b'] = 0;
            }
            counts['b']++;
            return 'b';
          },
        };
      }

      a() {
        evalOrder.push('a');
        return {
          promise: async () => {
            if (!counts['a']) {
              counts['a'] = 0;
            }
            counts['a']++;
            return `a`;
          },
        };
      }

      c() {
        evalOrder.push('c');
        return {
          promise: async () => {
            if (!counts['c']) {
              counts['c'] = 0;
            }
            counts['c']++;
            return 'c';
          },
        };
      }

      d99() {
        evalOrder.push('d99');
        return {
          promise: async () => {
            if (!counts['d99']) {
              counts['d99'] = 0;
            }
            counts['d99']++;
            return 'd99';
          },
        };
      }

      d10() {
        evalOrder.push('d10');
        return {
          promise: async () => {
            if (!counts['d10']) {
              counts['d10'] = 0;
            }
            counts['d10']++;
            return 'd10';
          },
        };
      }

      d101() {
        evalOrder.push('d101');
        return {
          promise: async () => {
            if (!counts['d101']) {
              counts['d101'] = 0;
            }
            counts['d101']++;
            return 'd101';
          },
        };
      }
    }

    const pojo = await constructPojoFromInstance(new C(), null, {
      sortKeys: (keys) => keys.slice().sort((a, b) => (a > b ? -1 : 1)),
    }).promise();
    expect(pojo).toMatchInlineSnapshot(`
      Object {
        "a": "a",
        "b": "b",
        "c": "c",
        "d10": "d10",
        "d101": "d101",
        "d99": "d99",
      }
    `);
    expect(evalOrder).toMatchInlineSnapshot(`
      Array [
        "d99",
        "d101",
        "d10",
        "c",
        "b",
        "a",
      ]
    `);
    expect(counts).toMatchInlineSnapshot(`
      Object {
        "a": 1,
        "b": 1,
        "c": 1,
        "d10": 1,
        "d101": 1,
        "d99": 1,
      }
    `);
  });

  test('eval order - reversed sorting', async () => {
    const evalOrder: string[] = [];
    const counts: any = {};

    class C
      implements PojoConstructor<{ a: string; b: string; c: string }, boolean>
    {
      b(input: boolean) {
        evalOrder.push('b');
        return {
          sync: () => {
            if (!counts['b']) {
              counts['b'] = 0;
            }
            counts['b']++;
            return this.a(input).sync();
          },
        };
      }

      a(input: boolean) {
        evalOrder.push('a');
        return {
          sync: () => {
            if (!counts['a']) {
              counts['a'] = 0;
            }
            counts['a']++;
            return `a-string-${input}`;
          },
        };
      }

      c(input: boolean) {
        evalOrder.push('c');
        return {
          sync: () => {
            if (!counts['c']) {
              counts['c'] = 0;
            }
            counts['c']++;
            return this.b(input).sync();
          },
        };
      }

      d99(input: boolean) {
        evalOrder.push('d99');
        return {
          sync: () => {
            if (!counts['d99']) {
              counts['d99'] = 0;
            }
            counts['d99']++;
            return this.b(input).sync();
          },
        };
      }

      d10(input: boolean) {
        evalOrder.push('d10');
        return {
          sync: () => {
            if (!counts['d10']) {
              counts['d10'] = 0;
            }
            counts['d10']++;
            return this.b(input).sync();
          },
        };
      }

      d101(input: boolean) {
        evalOrder.push('d101');
        return {
          sync: () => {
            if (!counts['d101']) {
              counts['d101'] = 0;
            }
            counts['d101']++;
            return this.b(input).sync();
          },
        };
      }
    }

    const pojo = constructPojoFromInstance(new C(), true, {
      sortKeys: (keys) => keys.slice().sort((a, b) => (a > b ? -1 : 1)),
    }).sync();
    expect(pojo).toMatchInlineSnapshot(`
      Object {
        "a": "a-string-true",
        "b": "a-string-true",
        "c": "a-string-true",
        "d10": "a-string-true",
        "d101": "a-string-true",
        "d99": "a-string-true",
      }
    `);
    expect(evalOrder).toMatchInlineSnapshot(`
      Array [
        "d99",
        "b",
        "a",
        "d101",
        "d10",
        "c",
      ]
    `);
    expect(counts).toMatchInlineSnapshot(`
      Object {
        "a": 1,
        "b": 1,
        "c": 1,
        "d10": 1,
        "d101": 1,
        "d99": 1,
      }
    `);
  });

  test('it should reassign input with caching proxy (second arg)', () => {
    type T = { a: string; b: string; c: string; d: string };

    class C implements PojoConstructor<T, boolean> {
      a(input?: boolean) {
        return { sync: () => `a-${input}` };
      }

      b(_: any, proxy: PojoConstructorCachingProxy<T, boolean>) {
        return { sync: () => proxy.a().sync!() };
      }

      c(input: boolean, proxy: PojoConstructorCachingProxy<T, boolean>) {
        return { sync: () => proxy.a(!input).sync!() };
      }

      d(input: boolean, proxy: PojoConstructorCachingProxy<T, boolean>) {
        return { sync: () => proxy.c(!input).sync!() };
      }
    }

    const c = new C();
    const pojo = constructPojoFromInstance(c, true).sync();
    expect(pojo).toMatchInlineSnapshot(`
      Object {
        "a": "a-true",
        "b": "a-undefined",
        "c": "a-false",
        "d": "a-true",
      }
    `);
  });

  test('it should reassign input with caching proxy (this arg)', () => {
    type T = { a: string; b: string; c: string; d: string };

    class C implements PojoConstructor<T, boolean> {
      a(input?: boolean) {
        return { sync: () => `a-${input}` };
      }

      b() {
        return { sync: () => this.a().sync() };
      }

      c(input: boolean) {
        return { sync: () => this.a(!input).sync() };
      }

      d(input: boolean) {
        return { sync: () => this.c(!input).sync!() };
      }
    }

    const c = new C();
    const pojo = constructPojoFromInstance(c, true).sync();
    expect(pojo).toMatchInlineSnapshot(`
      Object {
        "a": "a-true",
        "b": "a-undefined",
        "c": "a-false",
        "d": "a-true",
      }
    `);
  });

  test('it should resolve with concurrency setting', async () => {
    const c: PojoConstructor<{ a: string; b: number }> = {
      a: () => ({ promise: async () => 'a-string' }),
      b: () => ({ sync: () => 123 }),
    };
    const pojo = await constructPojoFromInstance(c, null, {
      concurrency: 100,
    }).promise();
    expect(pojo).toMatchInlineSnapshot(`
      Object {
        "a": "a-string",
        "b": 123,
      }
    `);
  });

  test('only evaluated once - async concur', async () => {
    let acounter = 0;
    let bcounter = 0;
    let ccounter = 0;

    class C implements PojoConstructor<{ a: string; b: string; c: string }> {
      a() {
        return {
          sync: () => {
            acounter++;
            return 'a-string';
          },
        };
      }

      b() {
        return {
          promise: async () => {
            bcounter++;
            return this.a().sync();
          },
        };
      }

      c() {
        return {
          promise: () => {
            ccounter++;
            return this.b().promise();
          },
        };
      }
    }

    const c = new C();
    const pojo = await constructPojoFromInstance(c, undefined, {
      concurrency: 100,
    }).promise();
    expect(pojo).toMatchInlineSnapshot(`
      Object {
        "a": "a-string",
        "b": "a-string",
        "c": "a-string",
      }
    `);
    expect(acounter).toBe(1);
    expect(bcounter).toBe(1);
    expect(ccounter).toBe(1);
  });

  test('it should throw when trying to .sync when property has no .sync', () => {
    const c: PojoConstructor<{ a: string; b: number }> = {
      a: () => ({ sync: () => 'a-string' }),
      b: () => ({ promise: async () => 123 }),
    };
    expect.assertions(1);
    try {
      constructPojoFromInstance(c).sync();
    } catch (caught) {
      expect(caught).toMatchInlineSnapshot(`
        [Error: constructPojo_proxyIntercepted->sync: Could not resolve property "b"
        constructPojo_proxyIntercepted->sync: - Result of "b" method does not have "sync" property
        constructPojo_proxyIntercepted->sync: - Result - {}]
      `);
    }
  });

  test('limit keys', () => {
    const c: PojoConstructor<{ a: string; b: number; c: string }> = {
      a: () => ({ sync: () => 'a-string' }),
      b: () => ({ promise: async () => 123 }),
      c: () => ({ sync: () => 'c-string' }),
    };
    const pojo = constructPojoFromInstance(c, null, {
      keys: () => ['a'],
    }).sync();
    expect(pojo).toMatchInlineSnapshot(`
      Object {
        "a": "a-string",
      }
    `);
  });

  test('it should use cache key from input option', () => {
    const counters = {
      a: 0,
      b: 0,
      c: 0,
      d: 0,
    };
    const c: PojoConstructor<
      { a: string; b: string; c: string; d: string },
      { key: boolean }
    > = {
      a: (input) => ({
        sync: () => {
          counters.a++;
          return `a-${input.key}`;
        },
      }),
      b: (input, cache) => ({
        sync: () => {
          counters.b++;
          return cache.a({ key: !input.key }).sync!();
        },
      }),
      c: (input, cache) => ({
        sync: () => {
          counters.c++;
          return cache.b({ key: !input.key }).sync!();
        },
      }),
      d: (input, cache) => ({
        sync: () => {
          counters.d++;
          return cache.c({ key: !input.key }).sync!();
        },
      }),
    };
    const pojoControl = constructPojoFromInstance(c, { key: true }).sync();
    expect(pojoControl).toMatchInlineSnapshot(`
      Object {
        "a": "a-true",
        "b": "a-false",
        "c": "a-true",
        "d": "a-false",
      }
    `);
    expect(counters).toMatchInlineSnapshot(`
      Object {
        "a": 4,
        "b": 3,
        "c": 2,
        "d": 1,
      }
    `);
    counters.a = 0;
    counters.b = 0;
    counters.c = 0;
    counters.d = 0;
    const pojoTest = constructPojoFromInstance(
      c,
      { key: true },
      {
        cacheKeyFromConstructorInput: (input) => input?.key,
      },
    ).sync();
    expect(pojoTest).toMatchInlineSnapshot(`
      Object {
        "a": "a-true",
        "b": "a-false",
        "c": "a-true",
        "d": "a-false",
      }
    `);
    expect(counters).toMatchInlineSnapshot(`
      Object {
        "a": 2,
        "b": 2,
        "c": 2,
        "d": 1,
      }
    `);
  });

  test('promise caching (coverage)', async () => {
    const c: PojoConstructor<{ a: string; b: string }> = {
      a: () => ({
        promise: () => new Promise((r) => setTimeout(() => r('a-string'), 100)),
      }),
      b: (_, cache) => ({ promise: () => cache.a().promise!() }),
    };
    const pojo = await constructPojoFromInstance(c, null, {
      concurrency: 10,
    }).promise();
    expect(pojo).toMatchInlineSnapshot(`
      Object {
        "a": "a-string",
        "b": "a-string",
      }
    `);
  });

  test('bad field function async', async () => {
    const c: PojoConstructor<{ a: string; b: string }> = {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      a: () => ({
        _promise: () => 123,
      }),
      b: (_, cache) => ({ promise: () => cache.a().promise!() }),
    };
    expect.assertions(1);
    try {
      await constructPojoFromInstance(c).promise();
    } catch (caught) {
      expect(caught).toMatchInlineSnapshot(`
        [Error: constructPojo_proxyIntercepted->promise: Could not resolve property "a"
        constructPojo_proxyIntercepted->promise: - Result of "a" method does not have neither "promise" nor "sync" properties
        constructPojo_proxyIntercepted->promise: - Result - {}]
      `);
    }
  });

  test('bad field function sync', async () => {
    const c: PojoConstructor<{ a: string; b: string }> = {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      a: () => ({
        _sync: () => 123,
      }),
      b: (_, cache) => ({ sync: () => cache.a().sync!() }),
    };
    expect.assertions(1);
    try {
      constructPojoFromInstance(c).sync();
    } catch (caught) {
      expect(caught).toMatchInlineSnapshot(`
        [Error: constructPojo_proxyIntercepted->sync: Could not resolve property "a"
        constructPojo_proxyIntercepted->sync: - Result of "a" method does not have "sync" property
        constructPojo_proxyIntercepted->sync: - Result - {}]
      `);
    }
  });

  test('sync custom catch - thrownIn: key-method', () => {
    const c: PojoConstructor<{ a: string; b: string }> = {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      a: () => {
        throw new Error('Error!');
      },
      b: (_, cache) => {
        return { sync: () => cache.a().sync!() };
      },
    };
    expect.assertions(2);
    try {
      constructPojoFromInstance(c, null).sync();
    } catch (caught) {
      expect(caught).toMatchInlineSnapshot(`[Error: Error!]`);
    }

    const caughtArr: any[] = [];
    constructPojoFromInstance(c, null, {
      catch: (caught, options) => {
        caughtArr.push({ caught, options });
      },
    }).sync();
    expect(caughtArr).toMatchInlineSnapshot(`
      Array [
        Object {
          "caught": [Error: Error!],
          "options": Object {
            "sequentialIndex": 0,
            "thrownIn": Array [
              Array [
                "a",
                "key-method",
              ],
            ],
          },
        },
        Object {
          "caught": [Error: Error!],
          "options": Object {
            "sequentialIndex": 1,
            "thrownIn": Array [
              Array [
                "a",
                "key-method",
              ],
              Array [
                "b",
                "sync-result-method",
              ],
            ],
          },
        },
      ]
    `);
  });

  test('sync custom catch - thrownIn: sync-result-method', () => {
    const c: PojoConstructor<{ a: string; b: string }> = {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      a: () => {
        return {
          sync: () => {
            throw new Error('Error!');
          },
        };
      },
      b: (_, cache) => {
        return { sync: () => cache.a().sync!() };
      },
    };
    expect.assertions(2);
    try {
      constructPojoFromInstance(c, null).sync();
    } catch (caught) {
      expect(caught).toMatchInlineSnapshot(`[Error: Error!]`);
    }

    const caughtArr: any[] = [];
    constructPojoFromInstance(c, null, {
      catch: (caught, options) => {
        caughtArr.push({ caught, options });
      },
    }).sync();
    expect(caughtArr).toMatchInlineSnapshot(`
      Array [
        Object {
          "caught": [Error: Error!],
          "options": Object {
            "sequentialIndex": 0,
            "thrownIn": Array [
              Array [
                "a",
                "sync-result-method",
              ],
            ],
          },
        },
        Object {
          "caught": [Error: Error!],
          "options": Object {
            "sequentialIndex": 1,
            "thrownIn": Array [
              Array [
                "a",
                "sync-result-method",
              ],
              Array [
                "b",
                "sync-result-method",
              ],
            ],
          },
        },
      ]
    `);
  });

  test('async custom catch - thrownIn: key-method', async () => {
    const c: PojoConstructor<{ a: string; b: string }> = {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      a: () => {
        throw new Error('Error!');
      },
      b: (_, cache) => {
        return { promise: () => cache.a().promise!() };
      },
    };
    expect.assertions(2);
    try {
      await constructPojoFromInstance(c, null).promise();
    } catch (caught) {
      expect(caught).toMatchInlineSnapshot(`[Error: Error!]`);
    }

    const caughtArr: any[] = [];
    await constructPojoFromInstance(c, null, {
      catch: (caught, options) => {
        caughtArr.push({ caught, options });
      },
    }).promise();
    expect(caughtArr).toMatchInlineSnapshot(`
      Array [
        Object {
          "caught": [Error: Error!],
          "options": Object {
            "sequentialIndex": 0,
            "thrownIn": Array [
              Array [
                "a",
                "key-method",
              ],
            ],
          },
        },
        Object {
          "caught": [Error: Error!],
          "options": Object {
            "sequentialIndex": 1,
            "thrownIn": Array [
              Array [
                "a",
                "key-method",
              ],
              Array [
                "b",
                "promise",
              ],
            ],
          },
        },
      ]
    `);
  });

  test('async concur custom catch - thrownIn: key-method', async () => {
    const c: PojoConstructor<{ a: string; b: string }> = {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      a: () => {
        throw new Error('Error!');
      },
      b: (_, cache) => {
        return { promise: () => cache.a().promise!() };
      },
    };
    expect.assertions(2);
    try {
      await constructPojoFromInstance(c, null, {
        concurrency: 10,
      }).promise();
    } catch (caught) {
      expect(caught).toMatchInlineSnapshot(`[Error: Error!]`);
    }

    const caughtArr: any[] = [];
    await constructPojoFromInstance(c, null, {
      concurrency: 10,
      catch: (caught, options) => {
        caughtArr.push({ caught, options });
      },
    }).promise();
    expect(caughtArr).toMatchInlineSnapshot(`
      Array [
        Object {
          "caught": [Error: Error!],
          "options": Object {
            "sequentialIndex": null,
            "thrownIn": Array [
              Array [
                "a",
                "key-method",
              ],
            ],
          },
        },
        Object {
          "caught": [Error: Error!],
          "options": Object {
            "sequentialIndex": null,
            "thrownIn": Array [
              Array [
                "a",
                "key-method",
              ],
              Array [
                "b",
                "promise",
              ],
            ],
          },
        },
      ]
    `);
  });

  test('async concur custom catch - thrownIn: key-method -- throws not error', async () => {
    const c: PojoConstructor<{ a: string; b: string }> = {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      a: () => {
        throw `I'm thrown, but I'm not an error`;
      },
      b: (_, cache) => {
        return { promise: () => cache.a().promise!() };
      },
    };
    expect.assertions(2);
    try {
      await constructPojoFromInstance(c, null).promise();
    } catch (caught) {
      expect(caught).toMatchInlineSnapshot(`
        [Error: PojoConstructorNonErrorCaughtWrapperError: Caught non error object when resolving "a" key in "key-method"
        PojoConstructorNonErrorCaughtWrapperError: - Caught object: "I'm thrown, but I'm not an error"]
      `);
    }

    const caughtArr: any[] = [];
    await constructPojoFromInstance(c, null, {
      concurrency: 10,
      catch: (caught, options) => {
        caughtArr.push({ caught, options });
      },
    }).promise();
    expect(caughtArr).toMatchInlineSnapshot(`
      Array [
        Object {
          "caught": [Error: PojoConstructorNonErrorCaughtWrapperError: Caught non error object when resolving "a" key in "key-method"
      PojoConstructorNonErrorCaughtWrapperError: - Caught object: "I'm thrown, but I'm not an error"],
          "options": Object {
            "sequentialIndex": null,
            "thrownIn": Array [
              Array [
                "a",
                "key-method",
              ],
            ],
          },
        },
        Object {
          "caught": [Error: PojoConstructorNonErrorCaughtWrapperError: Caught non error object when resolving "a" key in "key-method"
      PojoConstructorNonErrorCaughtWrapperError: - Caught object: "I'm thrown, but I'm not an error"],
          "options": Object {
            "sequentialIndex": null,
            "thrownIn": Array [
              Array [
                "a",
                "key-method",
              ],
              Array [
                "b",
                "promise",
              ],
            ],
          },
        },
      ]
    `);
  });

  test('async concur custom catch - thrownIn: key-method -- throws in promise synchronously', async () => {
    const c: PojoConstructor<{ a: string; b: string }> = {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      a: () => {
        throw `I'm thrown, but I'm not an error`;
      },
      b: (_) => {
        return {
          promise: () => {
            throw new Error('Hey');
          },
        };
      },
    };
    expect.assertions(2);
    try {
      await constructPojoFromInstance(c, null).promise();
    } catch (caught) {
      expect(caught).toMatchInlineSnapshot(`
        [Error: PojoConstructorNonErrorCaughtWrapperError: Caught non error object when resolving "a" key in "key-method"
        PojoConstructorNonErrorCaughtWrapperError: - Caught object: "I'm thrown, but I'm not an error"]
      `);
    }

    const caughtArr: any[] = [];
    await constructPojoFromInstance(c, null, {
      concurrency: 10,
      catch: (caught, options) => {
        caughtArr.push({ caught, options });
      },
    }).promise();
    expect(caughtArr).toMatchInlineSnapshot(`
      Array [
        Object {
          "caught": [Error: PojoConstructorNonErrorCaughtWrapperError: Caught non error object when resolving "a" key in "key-method"
      PojoConstructorNonErrorCaughtWrapperError: - Caught object: "I'm thrown, but I'm not an error"],
          "options": Object {
            "sequentialIndex": null,
            "thrownIn": Array [
              Array [
                "a",
                "key-method",
              ],
            ],
          },
        },
        Object {
          "caught": [Error: Hey],
          "options": Object {
            "sequentialIndex": null,
            "thrownIn": Array [
              Array [
                "b",
                "promise-result-method",
              ],
            ],
          },
        },
      ]
    `);
  });

  test('construct from class 1', () => {
    class C implements PojoConstructor<{ a: string; b: string }, number> {
      a(input: number) {
        return { sync: () => `a-field-${input}` };
      }

      b(input: number) {
        return { sync: () => this.a(input).sync() };
      }
    }

    const pojo = constructPojo(C, 321).sync();
    expect(pojo).toMatchInlineSnapshot(`
      Object {
        "a": "a-field-321",
        "b": "a-field-321",
      }
    `);
  });
});
