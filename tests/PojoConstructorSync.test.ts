import type {
  PojoConstructorSync,
  PojoConstructorSyncCachingProxy,
} from '../src';
import { constructPojoSync } from '../src';

describe('PojoConstructorSync + pojoFromSync', function () {
  test('it should construct from plain', () => {
    const c: PojoConstructorSync<{ a: string; b: number }> = {
      a: () => 'a-string',
      b: () => 123,
    };
    const { value: pojo } = constructPojoSync(c);
    expect(pojo).toMatchInlineSnapshot(`
      Object {
        "a": "a-string",
        "b": 123,
      }
    `);
  });

  test('it should construct from class instance', () => {
    class C implements PojoConstructorSync<{ a: string; b: number }> {
      a() {
        return 'a-string';
      }

      b() {
        return 123;
      }
    }

    const c = new C();
    const { value: pojo } = constructPojoSync(c);
    expect(pojo).toMatchInlineSnapshot(`
      Object {
        "a": "a-string",
        "b": 123,
      }
    `);
  });

  test('it should construct from nested class instance', () => {
    type PojoC = PojoConstructorSync<{ a: string; b: number }>;

    class Base implements Pick<PojoC, 'a'> {
      a() {
        return 'a-string';
      }
    }

    class C extends Base implements PojoC {
      b() {
        return 123;
      }
    }

    const c = new C();
    const { value: pojo } = constructPojoSync(c);
    expect(pojo).toMatchInlineSnapshot(`
      Object {
        "a": "a-string",
        "b": 123,
      }
    `);
  });

  test('it should pass input', () => {
    const c: PojoConstructorSync<{ a: string; b: number }, boolean> = {
      a: (input) =>
        input ? 'a-string-truthy-variant' : 'a-string-falsy-variant',
      b: (input) => (input ? 123 : 321),
    };
    const { value: pojo1 } = constructPojoSync(c, true);
    expect(pojo1).toMatchInlineSnapshot(`
      Object {
        "a": "a-string-truthy-variant",
        "b": 123,
      }
    `);
    const { value: pojo2 } = constructPojoSync(c, false);
    expect(pojo2).toMatchInlineSnapshot(`
      Object {
        "a": "a-string-falsy-variant",
        "b": 321,
      }
    `);
  });

  test('only evaluated once', async () => {
    let acounter = 0;
    let bcounter = 0;
    let ccounter = 0;

    class C
      implements PojoConstructorSync<{ a: string; b: string; c: string }>
    {
      a() {
        acounter++;
        return 'a-string';
      }

      b() {
        bcounter++;
        return this.a();
      }

      c() {
        ccounter++;
        return this.b();
      }
    }

    const c = new C();
    const { value: pojo } = constructPojoSync(c);
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

  test('using cachingProxy', () => {
    let acount = 0;
    type T = { a: string; b: string; c: string };
    type Input = null;
    const c: PojoConstructorSync<T, Input> = {
      a: () => {
        acount++;
        return 'a-string';
      },
      b: (_, cachingProxy: PojoConstructorSyncCachingProxy<T, Input>) =>
        cachingProxy.a(),
      c: (_, cachingProxy: PojoConstructorSyncCachingProxy<T, Input>) =>
        cachingProxy.b(),
    };
    const { value: pojo } = constructPojoSync(c);
    expect(pojo).toMatchInlineSnapshot(`
      Object {
        "a": "a-string",
        "b": "a-string",
        "c": "a-string",
      }
    `);
    expect(acount).toBe(1);
  });

  test('eval order - default sorting', async () => {
    const evalOrder: string[] = [];
    const counts: any = {};

    class C
      implements
        PojoConstructorSync<{ a: string; b: string; c: string }, boolean>
    {
      b(input: boolean) {
        evalOrder.push('b');
        if (!counts['b']) {
          counts['b'] = 0;
        }
        counts['b']++;
        return this.a(input);
      }

      a(input: boolean) {
        evalOrder.push('a');
        if (!counts['a']) {
          counts['a'] = 0;
        }
        counts['a']++;
        return `a-string-${input}`;
      }

      c(input: boolean) {
        evalOrder.push('c');
        if (!counts['c']) {
          counts['c'] = 0;
        }
        counts['c']++;
        return this.b(input);
      }

      d99(input: boolean) {
        evalOrder.push('d99');
        if (!counts['d99']) {
          counts['d99'] = 0;
        }
        counts['d99']++;
        return this.b(input);
      }

      d10(input: boolean) {
        evalOrder.push('d10');
        if (!counts['d10']) {
          counts['d10'] = 0;
        }
        counts['d10']++;
        return this.b(input);
      }

      d101(input: boolean) {
        evalOrder.push('d101');
        if (!counts['d101']) {
          counts['d101'] = 0;
        }
        counts['d101']++;
        return this.b(input);
      }
    }

    const { value: pojo } = constructPojoSync(new C(), true);
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
      implements
        PojoConstructorSync<{ a: string; b: string; c: string }, boolean>
    {
      b(input: boolean) {
        evalOrder.push('b');
        if (!counts['b']) {
          counts['b'] = 0;
        }
        counts['b']++;
        return this.a(input);
      }

      a(input: boolean) {
        evalOrder.push('a');
        if (!counts['a']) {
          counts['a'] = 0;
        }
        counts['a']++;
        return `a-string-${input}`;
      }

      c(input: boolean) {
        evalOrder.push('c');
        if (!counts['c']) {
          counts['c'] = 0;
        }
        counts['c']++;
        return this.b(input);
      }

      d99(input: boolean) {
        evalOrder.push('d99');
        if (!counts['d99']) {
          counts['d99'] = 0;
        }
        counts['d99']++;
        return this.b(input);
      }

      d10(input: boolean) {
        evalOrder.push('d10');
        if (!counts['d10']) {
          counts['d10'] = 0;
        }
        counts['d10']++;
        return this.b(input);
      }

      d101(input: boolean) {
        evalOrder.push('d101');
        if (!counts['d101']) {
          counts['d101'] = 0;
        }
        counts['d101']++;
        return this.b(input);
      }
    }

    const { value: pojo } = constructPojoSync(new C(), true, {
      sortKeys: (keys) => keys.slice().sort((a, b) => (a > b ? -1 : 1)),
    });
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

  test('caching by input - using cachingProxy argument', async () => {
    let acounter = 0;
    const c: PojoConstructorSync<{ a: string; b: string; c: string }, boolean> =
      {
        a: (input) => {
          acounter++;
          return input ? 'a-string-truthy-variant' : 'a-string-falsy-variant';
        },
        b: (input, cachingProxy) => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          return cachingProxy.a(!input);
        },
        c: (input, cachingProxy) => {
          return cachingProxy.a(input);
        },
      };
    const { value: pojo1 } = await constructPojoSync(c, true);
    expect(pojo1).toMatchInlineSnapshot(`
      Object {
        "a": "a-string-truthy-variant",
        "b": "a-string-falsy-variant",
        "c": "a-string-truthy-variant",
      }
    `);
    expect(acounter).toBe(2);
    const { value: pojo2 } = constructPojoSync(c, false);
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
      implements
        PojoConstructorSync<{ a: string; b: string; c: string }, boolean>
    {
      a(input?: boolean) {
        acounter++;
        return `a-string-${input}`;
      }

      b(input?: boolean) {
        bcounter++;
        return this.a(input);
      }

      c(input?: boolean) {
        ccounter++;
        return this.b(input);
      }
    }

    const { value: pojo } = constructPojoSync(new C(), true);
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

  test('limit keys', () => {
    const c: PojoConstructorSync<{ a: string; b: number; c: string }> = {
      a: () => 'a-string',
      b: () => {
        throw new Error('b-error');
      },
      c: () => 'c-string',
    };
    const { value: pojo } = constructPojoSync(c, null, {
      keys: () => ['a'],
    });
    expect(pojo).toMatchInlineSnapshot(`
      Object {
        "a": "a-string",
      }
    `);
  });
  test('it should use cache key from input option', async () => {
    const counters = {
      a: 0,
      b: 0,
      c: 0,
      d: 0,
    };
    const c: PojoConstructorSync<
      { a: string; b: string; c: string; d: string },
      { key: boolean }
    > = {
      a: (input) => {
        counters.a++;
        return `a-${input.key}`;
      },
      b: (input, cache) => {
        counters.b++;
        return cache.a({ key: !input.key });
      },
      c: (input, cache) => {
        counters.c++;
        return cache.b({ key: !input.key });
      },
      d: (input, cache) => {
        counters.d++;
        return cache.c({ key: !input.key });
      },
    };
    const { value: pojoControl } = constructPojoSync(c, { key: true });
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
    const { value: pojoTest } = constructPojoSync(
      c,
      { key: true },
      {
        cacheKeyFromInput: (input) => input?.key,
      },
    );
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
});
