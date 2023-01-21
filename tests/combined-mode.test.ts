import type { PojoConstructorSyncAndAsyncProps } from '../src/PojoConstructorSyncAndAsync/PojoConstructorSyncAndAsyncProps';
import {
  constructPojoSyncAndAsync,
  constructPojoFromInstance,
} from '../src/PojoConstructorSyncAndAsync/constructPojoSyncAndAsync';
import type { PojoConstructorSyncAndAsyncHelpersHost } from '../src/PojoConstructorSyncAndAsync/PojoConstructorSyncAndAsyncHelpersHost';

describe('PojoConstructorProps + pojoFrom', function () {
  test('it should construct from plain', () => {
    const c: PojoConstructorSyncAndAsyncProps<{ a: string; b: number }> = {
      a: () => ({ sync: () => ({ value: 'a-string' }) }),
      b: () => ({ sync: () => ({ value: 123 }) }),
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
    class C
      implements PojoConstructorSyncAndAsyncProps<{ a: string; b: number }>
    {
      a() {
        return { sync: () => ({ value: 'a-string' }) };
      }

      b() {
        return { sync: () => ({ value: 123 }) };
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
    type PojoC = PojoConstructorSyncAndAsyncProps<{ a: string; b: number }>;

    class Base implements Pick<PojoC, 'a'> {
      a() {
        return { sync: () => ({ value: 'a-string' }) };
      }
    }

    class C extends Base implements PojoC {
      b() {
        return { sync: () => ({ value: 123 }) };
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
    const c: PojoConstructorSyncAndAsyncProps<
      { a: string; b: number },
      boolean
    > = {
      a: (input) => ({
        sync: () => ({
          value: input ? 'a-string-truthy-variant' : 'a-string-falsy-variant',
        }),
      }),
      b: (input) => ({ sync: () => ({ value: input ? 123 : 321 }) }),
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
    const c: PojoConstructorSyncAndAsyncProps<{ a: string; b: number }> = {
      a: () => ({ sync: () => ({ value: 'a-string' }) }),
      b: () => ({ async: () => Promise.resolve({ value: 123 }) }),
    };
    const pojo = await constructPojoFromInstance(c).async();
    expect(pojo).toMatchInlineSnapshot(`
      Object {
        "a": "a-string",
        "b": 123,
      }
    `);
  });

  test('cachingProxy access - only evaluated once', async () => {
    let acounter = 0;
    let bcounter = 0;
    let ccounter = 0;

    type O = { a: string; b: string; c: string };

    class C implements PojoConstructorSyncAndAsyncProps<O> {
      a() {
        return {
          sync: () => {
            acounter++;
            return { value: 'a-string' };
          },
        };
      }

      b(
        _: any,
        {
          cache: cachingProxy,
        }: PojoConstructorSyncAndAsyncHelpersHost<O, boolean>,
      ) {
        return {
          sync: () => {
            bcounter++;
            return cachingProxy.a().sync!();
          },
        };
      }

      c(
        _: any,
        {
          cache: cachingProxy,
        }: PojoConstructorSyncAndAsyncHelpersHost<O, boolean>,
      ) {
        return {
          sync: () => {
            ccounter++;
            return cachingProxy.b().sync!();
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

  test('accessing properties through this does not use cache', async () => {
    let acounter = 0;
    let bcounter = 0;
    let ccounter = 0;

    class C
      implements
        PojoConstructorSyncAndAsyncProps<{ a: string; b: string; c: string }>
    {
      a() {
        return {
          sync: () => {
            acounter++;
            return { value: 'a-string' };
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
    expect(acounter).toBe(3);
    expect(bcounter).toBe(2);
    expect(ccounter).toBe(1);
  });

  test('chachingProxy access - only evaluated once - async', async () => {
    let acounter = 0;
    let bcounter = 0;
    let ccounter = 0;

    type O = { a: string; b: string; c: string };

    class C implements PojoConstructorSyncAndAsyncProps<O> {
      a() {
        return {
          sync: () => {
            acounter++;
            return { value: 'a-string' };
          },
        };
      }

      b(
        _: any,
        {
          cache: cachingProxy,
        }: PojoConstructorSyncAndAsyncHelpersHost<O, boolean>,
      ) {
        return {
          async: async () => {
            bcounter++;
            return cachingProxy.a().sync!();
          },
        };
      }

      c(
        _: any,
        {
          cache: cachingProxy,
        }: PojoConstructorSyncAndAsyncHelpersHost<O, boolean>,
      ) {
        return {
          async: () => {
            ccounter++;
            return cachingProxy.b().async!();
          },
        };
      }
    }

    const c = new C();
    const pojo = await constructPojoFromInstance(c).async();
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

  test('accessing properties through this does not use cache - async', async () => {
    let acounter = 0;
    let bcounter = 0;
    let ccounter = 0;

    class C
      implements
        PojoConstructorSyncAndAsyncProps<{ a: string; b: string; c: string }>
    {
      a() {
        return {
          sync: () => {
            acounter++;
            return { value: 'a-string' };
          },
        };
      }

      b() {
        return {
          async: async () => {
            bcounter++;
            return this.a().sync();
          },
        };
      }

      c() {
        return {
          async: () => {
            ccounter++;
            return this.b().async();
          },
        };
      }
    }

    const c = new C();
    const pojo = await constructPojoFromInstance(c).async();
    expect(pojo).toMatchInlineSnapshot(`
      Object {
        "a": "a-string",
        "b": "a-string",
        "c": "a-string",
      }
    `);
    expect(acounter).toBe(3);
    expect(bcounter).toBe(2);
    expect(ccounter).toBe(1);
  });

  test('caching by input - using cachingProxy argument', () => {
    let acounter = 0;
    type O = { a: string; b: string; c: string };
    const c: PojoConstructorSyncAndAsyncProps<O, boolean> = {
      a: (input) => ({
        sync: () => {
          acounter++;
          return {
            value: input ? 'a-string-truthy-variant' : 'a-string-falsy-variant',
          };
        },
      }),
      b: (
        input,
        {
          cache: cachingProxy,
        }: PojoConstructorSyncAndAsyncHelpersHost<O, boolean>,
      ) => ({
        sync: () => cachingProxy.a(!input).sync!(),
      }),
      c: (
        input,
        {
          cache: cachingProxy,
        }: PojoConstructorSyncAndAsyncHelpersHost<O, boolean>,
      ) => ({
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

  test('cachingProxy access - eval order - default sorting', async () => {
    const evalOrder: string[] = [];
    const counts: any = {};

    type O = {
      a: string;
      b: string;
      c: string;
      d99: string;
      d10: string;
      d101: string;
    };

    class C implements PojoConstructorSyncAndAsyncProps<O, boolean> {
      b(
        input: boolean,
        {
          cache: cachingProxy,
        }: PojoConstructorSyncAndAsyncHelpersHost<O, boolean>,
      ) {
        evalOrder.push('b');
        return {
          sync: () => {
            if (!counts['b']) {
              counts['b'] = 0;
            }
            counts['b']++;
            return cachingProxy.a(input).sync!();
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
            return { value: `a-string-${input}` };
          },
        };
      }

      c(
        input: boolean,
        {
          cache: cachingProxy,
        }: PojoConstructorSyncAndAsyncHelpersHost<O, boolean>,
      ) {
        evalOrder.push('c');
        return {
          sync: () => {
            if (!counts['c']) {
              counts['c'] = 0;
            }
            counts['c']++;
            return cachingProxy.b(input).sync!();
          },
        };
      }

      d99(
        input: boolean,
        {
          cache: cachingProxy,
        }: PojoConstructorSyncAndAsyncHelpersHost<O, boolean>,
      ) {
        evalOrder.push('d99');
        return {
          sync: () => {
            if (!counts['d99']) {
              counts['d99'] = 0;
            }
            counts['d99']++;
            return cachingProxy.b(input).sync!();
          },
        };
      }

      d10(
        input: boolean,
        {
          cache: cachingProxy,
        }: PojoConstructorSyncAndAsyncHelpersHost<O, boolean>,
      ) {
        evalOrder.push('d10');
        return {
          sync: () => {
            if (!counts['d10']) {
              counts['d10'] = 0;
            }
            counts['d10']++;
            return cachingProxy.b(input).sync!();
          },
        };
      }

      d101(
        input: boolean,
        {
          cache: cachingProxy,
        }: PojoConstructorSyncAndAsyncHelpersHost<O, boolean>,
      ) {
        evalOrder.push('d101');
        return {
          sync: () => {
            if (!counts['d101']) {
              counts['d101'] = 0;
            }
            counts['d101']++;
            return cachingProxy.b(input).sync!();
          },
        };
      }
    }

    const pojo = await constructPojoFromInstance(new C(), true).async();
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

    type O = {
      a: string;
      b: string;
      c: string;
      d99: string;
      d10: string;
      d101: string;
    };

    class C implements PojoConstructorSyncAndAsyncProps<O, null> {
      b() {
        evalOrder.push('b');
        return {
          sync: () => {
            if (!counts['b']) {
              counts['b'] = 0;
            }
            counts['b']++;
            return { value: 'b' };
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
            return { value: `a` };
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
            return { value: 'c' };
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
            return { value: 'd99' };
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
            return { value: 'd10' };
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
            return { value: 'd101' };
          },
        };
      }
    }

    const pojo = await constructPojoFromInstance(new C(), null, {
      sortKeys: (keys) => keys.slice().sort((a, b) => (a > b ? -1 : 1)),
    }).async();
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

  test('cachingProxy access - async eval order - default sorting', async () => {
    const evalOrder: string[] = [];
    const counts: any = {};

    type O = {
      a: string;
      b: string;
      c: string;
      d99: string;
      d10: string;
      d101: string;
    };

    class C implements PojoConstructorSyncAndAsyncProps<O, boolean> {
      b(
        input: boolean,
        {
          cache: cachingProxy,
        }: PojoConstructorSyncAndAsyncHelpersHost<O, boolean>,
      ) {
        evalOrder.push('b');
        return {
          async: async () => {
            if (!counts['b']) {
              counts['b'] = 0;
            }
            counts['b']++;
            return cachingProxy.a(input).async!();
          },
        };
      }

      a(input: boolean) {
        evalOrder.push('a');
        return {
          async: async () => {
            if (!counts['a']) {
              counts['a'] = 0;
            }
            counts['a']++;
            return { value: `a-string-${input}` };
          },
        };
      }

      c(
        input: boolean,
        {
          cache: cachingProxy,
        }: PojoConstructorSyncAndAsyncHelpersHost<O, boolean>,
      ) {
        evalOrder.push('c');
        return {
          async: async () => {
            if (!counts['c']) {
              counts['c'] = 0;
            }
            counts['c']++;
            return cachingProxy.b(input).async!();
          },
        };
      }

      d99(
        input: boolean,
        {
          cache: cachingProxy,
        }: PojoConstructorSyncAndAsyncHelpersHost<O, boolean>,
      ) {
        evalOrder.push('d99');
        return {
          async: () => {
            if (!counts['d99']) {
              counts['d99'] = 0;
            }
            counts['d99']++;
            return cachingProxy.b(input).async!();
          },
        };
      }

      d10(
        input: boolean,
        {
          cache: cachingProxy,
        }: PojoConstructorSyncAndAsyncHelpersHost<O, boolean>,
      ) {
        evalOrder.push('d10');
        return {
          async: () => {
            if (!counts['d10']) {
              counts['d10'] = 0;
            }
            counts['d10']++;
            return cachingProxy.b(input).async!();
          },
        };
      }

      d101(
        input: boolean,
        {
          cache: cachingProxy,
        }: PojoConstructorSyncAndAsyncHelpersHost<O, boolean>,
      ) {
        evalOrder.push('d101');
        return {
          async: () => {
            if (!counts['d101']) {
              counts['d101'] = 0;
            }
            counts['d101']++;
            return cachingProxy.b(input).async!();
          },
        };
      }
    }

    const pojo = await constructPojoFromInstance(new C(), true).async();
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
      implements
        PojoConstructorSyncAndAsyncProps<
          { a: string; b: string; c: string },
          null
        >
    {
      b() {
        evalOrder.push('b');
        return {
          async: async () => {
            if (!counts['b']) {
              counts['b'] = 0;
            }
            counts['b']++;
            return { value: 'b' };
          },
        };
      }

      a() {
        evalOrder.push('a');
        return {
          async: async () => {
            if (!counts['a']) {
              counts['a'] = 0;
            }
            counts['a']++;
            return { value: `a` };
          },
        };
      }

      c() {
        evalOrder.push('c');
        return {
          async: async () => {
            if (!counts['c']) {
              counts['c'] = 0;
            }
            counts['c']++;
            return { value: 'c' };
          },
        };
      }

      d99() {
        evalOrder.push('d99');
        return {
          async: async () => {
            if (!counts['d99']) {
              counts['d99'] = 0;
            }
            counts['d99']++;
            return { value: 'd99' };
          },
        };
      }

      d10() {
        evalOrder.push('d10');
        return {
          async: async () => {
            if (!counts['d10']) {
              counts['d10'] = 0;
            }
            counts['d10']++;
            return { value: 'd10' };
          },
        };
      }

      d101() {
        evalOrder.push('d101');
        return {
          async: async () => {
            if (!counts['d101']) {
              counts['d101'] = 0;
            }
            counts['d101']++;
            return { value: 'd101' };
          },
        };
      }
    }

    const pojo = await constructPojoFromInstance(new C(), null, {
      sortKeys: (keys) => keys.slice().sort((a, b) => (a > b ? -1 : 1)),
    }).async();
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

  test('cachingProxy access - eval order - reversed sorting', async () => {
    const evalOrder: string[] = [];
    const counts: any = {};

    type O = {
      a: string;
      b: string;
      c: string;
      d99: string;
      d10: string;
      d101: string;
    };

    class C implements PojoConstructorSyncAndAsyncProps<O, boolean> {
      b(
        input: boolean,
        {
          cache: cachingProxy,
        }: PojoConstructorSyncAndAsyncHelpersHost<O, boolean>,
      ) {
        evalOrder.push('b');
        return {
          sync: () => {
            if (!counts['b']) {
              counts['b'] = 0;
            }
            counts['b']++;
            return cachingProxy.a(input).sync!();
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
            return { value: `a-string-${input}` };
          },
        };
      }

      c(
        input: boolean,
        {
          cache: cachingProxy,
        }: PojoConstructorSyncAndAsyncHelpersHost<O, boolean>,
      ) {
        evalOrder.push('c');
        return {
          sync: () => {
            if (!counts['c']) {
              counts['c'] = 0;
            }
            counts['c']++;
            return cachingProxy.b(input).sync!();
          },
        };
      }

      d99(
        input: boolean,
        {
          cache: cachingProxy,
        }: PojoConstructorSyncAndAsyncHelpersHost<O, boolean>,
      ) {
        evalOrder.push('d99');
        return {
          sync: () => {
            if (!counts['d99']) {
              counts['d99'] = 0;
            }
            counts['d99']++;
            return cachingProxy.b(input).sync!();
          },
        };
      }

      d10(
        input: boolean,
        {
          cache: cachingProxy,
        }: PojoConstructorSyncAndAsyncHelpersHost<O, boolean>,
      ) {
        evalOrder.push('d10');
        return {
          sync: () => {
            if (!counts['d10']) {
              counts['d10'] = 0;
            }
            counts['d10']++;
            return cachingProxy.b(input).sync!();
          },
        };
      }

      d101(
        input: boolean,
        {
          cache: cachingProxy,
        }: PojoConstructorSyncAndAsyncHelpersHost<O, boolean>,
      ) {
        evalOrder.push('d101');
        return {
          sync: () => {
            if (!counts['d101']) {
              counts['d101'] = 0;
            }
            counts['d101']++;
            return cachingProxy.b(input).sync!();
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

    class C implements PojoConstructorSyncAndAsyncProps<T, boolean> {
      a(input?: boolean) {
        return { sync: () => ({ value: `a-${input}` }) };
      }

      b(_: any, { cache }: PojoConstructorSyncAndAsyncHelpersHost<T, boolean>) {
        return { sync: () => cache.a().sync!() };
      }

      c(
        input: boolean,
        { cache }: PojoConstructorSyncAndAsyncHelpersHost<T, boolean>,
      ) {
        return { sync: () => cache.a(!input).sync!() };
      }

      d(
        input: boolean,
        { cache }: PojoConstructorSyncAndAsyncHelpersHost<T, boolean>,
      ) {
        return { sync: () => cache.c(!input).sync!() };
      }
    }

    const c = new C();
    const pojo = constructPojoFromInstance(c, true).sync();
    expect(pojo).toMatchInlineSnapshot(`
      Object {
        "a": "a-true",
        "b": "a-true",
        "c": "a-false",
        "d": "a-true",
      }
    `);
  });

  test('it should reassign input with caching proxy (this arg)', () => {
    type T = { a: string; b: string; c: string; d: string };

    class C implements PojoConstructorSyncAndAsyncProps<T, boolean> {
      a(input?: boolean) {
        return { sync: () => ({ value: `a-${input}` }) };
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
        "b": "a-true",
        "c": "a-false",
        "d": "a-true",
      }
    `);
  });

  test('it should resolve with concurrency setting', async () => {
    const c: PojoConstructorSyncAndAsyncProps<{ a: string; b: number }> = {
      a: () => ({ async: async () => ({ value: 'a-string' }) }),
      b: () => ({ sync: () => ({ value: 123 }) }),
    };
    const pojo = await constructPojoFromInstance(c, null, {
      concurrency: 100,
    }).async();
    expect(pojo).toMatchInlineSnapshot(`
      Object {
        "a": "a-string",
        "b": 123,
      }
    `);
  });

  test('cachingProxy access - only evaluated once - async concur', async () => {
    let acounter = 0;
    let bcounter = 0;
    let ccounter = 0;

    type O = { a: string; b: string; c: string };

    class C implements PojoConstructorSyncAndAsyncProps<O> {
      a() {
        return {
          sync: () => {
            acounter++;
            return { value: 'a-string' };
          },
        };
      }

      b(_: any, { cache }: PojoConstructorSyncAndAsyncHelpersHost<O>) {
        return {
          async: async () => {
            bcounter++;
            return cache.a().sync!();
          },
        };
      }

      c(_: any, { cache }: PojoConstructorSyncAndAsyncHelpersHost<O>) {
        return {
          async: () => {
            ccounter++;
            return cache.b().async!();
          },
        };
      }
    }

    const c = new C();
    const pojo = await constructPojoFromInstance(c, undefined as unknown, {
      concurrency: 100,
    }).async();
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

  test('accessing properties through this does not use cache - async concur', async () => {
    let acounter = 0;
    let bcounter = 0;
    let ccounter = 0;

    class C
      implements
        PojoConstructorSyncAndAsyncProps<{ a: string; b: string; c: string }>
    {
      a() {
        return {
          sync: () => {
            acounter++;
            return { value: 'a-string' };
          },
        };
      }

      b() {
        return {
          async: async () => {
            bcounter++;
            return this.a().sync();
          },
        };
      }

      c() {
        return {
          async: () => {
            ccounter++;
            return this.b().async();
          },
        };
      }
    }

    const c = new C();
    const pojo = await constructPojoFromInstance(c, undefined, {
      concurrency: 100,
    }).async();
    expect(pojo).toMatchInlineSnapshot(`
      Object {
        "a": "a-string",
        "b": "a-string",
        "c": "a-string",
      }
    `);
    expect(acounter).toBe(3);
    expect(bcounter).toBe(2);
    expect(ccounter).toBe(1);
  });

  test('it should throw when trying to .sync when property has no .sync', () => {
    const c: PojoConstructorSyncAndAsyncProps<{ a: string; b: number }> = {
      a: () => ({ sync: () => ({ value: 'a-string' }) }),
      b: () => ({ async: async () => ({ value: 123 }) }),
    };
    expect.assertions(1);
    try {
      constructPojoFromInstance(c).sync();
    } catch (caught) {
      expect(caught).toMatchInlineSnapshot(`
        [Error: PojoConstructor_errorCatchingProxy_decoratorFn->sync: Could not resolve property "b"
        PojoConstructor_errorCatchingProxy_decoratorFn->sync: - Result of "b" method does not have "sync" property
        PojoConstructor_errorCatchingProxy_decoratorFn->sync: - Result - {}]
      `);
    }
  });

  test('limit keys', () => {
    const c: PojoConstructorSyncAndAsyncProps<{
      a: string;
      b: number;
      c: string;
    }> = {
      a: () => ({ sync: () => ({ value: 'a-string' }) }),
      b: () => ({ async: async () => ({ value: 123 }) }),
      c: () => ({ sync: () => ({ value: 'c-string' }) }),
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
    const c: PojoConstructorSyncAndAsyncProps<
      { a: string; b: string; c: string; d: string },
      { key: boolean }
    > = {
      a: (input) => ({
        sync: () => {
          counters.a++;
          return { value: `a-${input.key}` };
        },
      }),
      b: (input, { cache }) => ({
        sync: () => {
          counters.b++;
          return cache.a({ key: !input.key }).sync!();
        },
      }),
      c: (input, { cache }) => ({
        sync: () => {
          counters.c++;
          return cache.b({ key: !input.key }).sync!();
        },
      }),
      d: (input, { cache }) => ({
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
    const c: PojoConstructorSyncAndAsyncProps<{ a: string; b: string }> = {
      a: () => ({
        async: () =>
          new Promise((r) => setTimeout(() => r({ value: 'a-string' }), 100)),
      }),
      b: (_, { cache }) => ({ async: () => cache.a().async!() }),
    };
    const pojo = await constructPojoFromInstance(c, null, {
      concurrency: 10,
    }).async();
    expect(pojo).toMatchInlineSnapshot(`
      Object {
        "a": "a-string",
        "b": "a-string",
      }
    `);
  });

  test('bad field function async', async () => {
    const c: PojoConstructorSyncAndAsyncProps<{ a: string; b: string }> = {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      a: () => ({
        _async: () => ({ value: 123 }),
      }),
      b: (_, { cache }) => ({ async: () => cache.a().async!() }),
    };
    expect.assertions(1);
    try {
      await constructPojoFromInstance(c).async();
    } catch (caught) {
      expect(caught).toMatchInlineSnapshot(`
        [Error: PojoConstructor_errorCatchingProxy_decoratorFn->async: Could not resolve property "a"
        PojoConstructor_errorCatchingProxy_decoratorFn->async: - Result of "a" method does not have neither "async" nor "sync" properties
        PojoConstructor_errorCatchingProxy_decoratorFn->async: - Result - {}]
      `);
    }
  });

  test('bad field function sync', async () => {
    const c: PojoConstructorSyncAndAsyncProps<{ a: string; b: string }> = {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      a: () => ({
        _sync: () => ({ value: 123 }),
      }),
      b: (_, { cache }) => ({ sync: () => cache.a().sync!() }),
    };
    expect.assertions(1);
    try {
      constructPojoFromInstance(c).sync();
    } catch (caught) {
      expect(caught).toMatchInlineSnapshot(`
        [Error: PojoConstructor_errorCatchingProxy_decoratorFn->sync: Could not resolve property "a"
        PojoConstructor_errorCatchingProxy_decoratorFn->sync: - Result of "a" method does not have "sync" property
        PojoConstructor_errorCatchingProxy_decoratorFn->sync: - Result - {}]
      `);
    }
  });

  test('sync custom catch - PojoConstructorPropsThrownIn: key-method', () => {
    const c: PojoConstructorSyncAndAsyncProps<{ a: string; b: string }> = {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      a: () => {
        throw new Error('Error!');
      },
      b: (_, { cache }) => {
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
            "key": "a",
            "keySequentialIndex": 0,
            "keysStack": Array [
              Object {
                "key": "a",
                "stage": "key-method",
              },
            ],
          },
        },
        Object {
          "caught": [Error: Error!],
          "options": Object {
            "key": "b",
            "keySequentialIndex": 1,
            "keysStack": Array [
              Object {
                "key": "b",
                "stage": "sync-result-method",
              },
              Object {
                "key": "a",
                "stage": "key-method",
              },
            ],
          },
        },
      ]
    `);
  });

  test('sync custom catch - PojoConstructorPropsThrownIn: sync-result-method', () => {
    const c: PojoConstructorSyncAndAsyncProps<{ a: string; b: string }> = {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      a: () => {
        return {
          sync: () => {
            throw new Error('Error!');
          },
        };
      },
      b: (_, { cache }) => {
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
            "key": "a",
            "keySequentialIndex": 0,
            "keysStack": Array [
              Object {
                "key": "a",
                "stage": "sync-result-method",
              },
            ],
          },
        },
        Object {
          "caught": [Error: Error!],
          "options": Object {
            "key": "b",
            "keySequentialIndex": 1,
            "keysStack": Array [
              Object {
                "key": "b",
                "stage": "sync-result-method",
              },
              Object {
                "key": "a",
                "stage": "sync-result-method",
              },
            ],
          },
        },
      ]
    `);
  });

  test('async custom catch - PojoConstructorPropsThrownIn: key-method', async () => {
    const c: PojoConstructorSyncAndAsyncProps<{ a: string; b: string }> = {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      a: () => {
        throw new Error('Error!');
      },
      b: (_, { cache }) => {
        return { async: () => cache.a().async!() };
      },
    };
    expect.assertions(2);
    try {
      await constructPojoFromInstance(c, null).async();
    } catch (caught) {
      expect(caught).toMatchInlineSnapshot(`[Error: Error!]`);
    }

    const caughtArr: any[] = [];
    await constructPojoFromInstance(c, null, {
      catch: (caught, options) => {
        caughtArr.push({ caught, options });
      },
    }).async();
    expect(caughtArr).toMatchInlineSnapshot(`
      Array [
        Object {
          "caught": [Error: Error!],
          "options": Object {
            "key": "a",
            "keySequentialIndex": 0,
            "keysStack": Array [
              Object {
                "key": "a",
                "stage": "key-method",
              },
            ],
          },
        },
        Object {
          "caught": [Error: Error!],
          "options": Object {
            "key": "b",
            "keySequentialIndex": 1,
            "keysStack": Array [
              Object {
                "key": "b",
                "stage": "promise-resolution",
              },
              Object {
                "key": "a",
                "stage": "key-method",
              },
            ],
          },
        },
      ]
    `);
  });

  test('async concur custom catch - PojoConstructorPropsThrownIn: key-method', async () => {
    const c: PojoConstructorSyncAndAsyncProps<{ a: string; b: string }> = {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      a: () => {
        throw new Error('Error!');
      },
      b: (_, { cache }) => {
        return { async: () => cache.a().async!() };
      },
    };
    expect.assertions(2);
    try {
      await constructPojoFromInstance(c, null, {
        concurrency: 10,
      }).async();
    } catch (caught) {
      expect(caught).toMatchInlineSnapshot(`[Error: Error!]`);
    }

    const caughtArr: any[] = [];
    await constructPojoFromInstance(c, null, {
      concurrency: 10,
      catch: (caught, options) => {
        caughtArr.push({ caught, options });
      },
    }).async();
    expect(caughtArr).toMatchInlineSnapshot(`
      Array [
        Object {
          "caught": [Error: Error!],
          "options": Object {
            "key": "a",
            "keySequentialIndex": null,
            "keysStack": Array [
              Object {
                "key": "a",
                "stage": "key-method",
              },
            ],
          },
        },
        Object {
          "caught": [Error: Error!],
          "options": Object {
            "key": "b",
            "keySequentialIndex": null,
            "keysStack": Array [
              Object {
                "key": "b",
                "stage": "promise-resolution",
              },
              Object {
                "key": "a",
                "stage": "key-method",
              },
            ],
          },
        },
      ]
    `);
  });

  test('async concur custom catch - PojoConstructorPropsThrownIn: key-method -- throws not error', async () => {
    const c: PojoConstructorSyncAndAsyncProps<{ a: string; b: string }> = {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      a: () => {
        throw `I'm thrown, but I'm not an error`;
      },
      b: (_, { cache }) => {
        return { async: () => cache.a().async!() };
      },
    };
    expect.assertions(2);
    try {
      await constructPojoFromInstance(c, null).async();
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
    }).async();
    expect(caughtArr).toMatchInlineSnapshot(`
      Array [
        Object {
          "caught": [Error: PojoConstructorNonErrorCaughtWrapperError: Caught non error object when resolving "a" key in "key-method"
      PojoConstructorNonErrorCaughtWrapperError: - Caught object: "I'm thrown, but I'm not an error"],
          "options": Object {
            "key": "a",
            "keySequentialIndex": null,
            "keysStack": Array [
              Object {
                "key": "a",
                "stage": "key-method",
              },
            ],
          },
        },
        Object {
          "caught": [Error: PojoConstructorNonErrorCaughtWrapperError: Caught non error object when resolving "a" key in "key-method"
      PojoConstructorNonErrorCaughtWrapperError: - Caught object: "I'm thrown, but I'm not an error"],
          "options": Object {
            "key": "b",
            "keySequentialIndex": null,
            "keysStack": Array [
              Object {
                "key": "b",
                "stage": "promise-resolution",
              },
              Object {
                "key": "a",
                "stage": "key-method",
              },
            ],
          },
        },
      ]
    `);
  });

  test('async concur custom catch - PojoConstructorPropsThrownIn: key-method -- throws in promise synchronously', async () => {
    const c: PojoConstructorSyncAndAsyncProps<{ a: string; b: string }> = {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      a: () => {
        throw `I'm thrown, but I'm not an error`;
      },
      b: (_) => {
        return {
          async: () => {
            throw new Error('Hey');
          },
        };
      },
    };
    expect.assertions(2);
    try {
      await constructPojoFromInstance(c, null).async();
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
    }).async();
    expect(caughtArr).toMatchInlineSnapshot(`
      Array [
        Object {
          "caught": [Error: PojoConstructorNonErrorCaughtWrapperError: Caught non error object when resolving "a" key in "key-method"
      PojoConstructorNonErrorCaughtWrapperError: - Caught object: "I'm thrown, but I'm not an error"],
          "options": Object {
            "key": "a",
            "keySequentialIndex": null,
            "keysStack": Array [
              Object {
                "key": "a",
                "stage": "key-method",
              },
            ],
          },
        },
        Object {
          "caught": [Error: Hey],
          "options": Object {
            "key": "b",
            "keySequentialIndex": null,
            "keysStack": Array [
              Object {
                "key": "b",
                "stage": "promise-result-method",
              },
            ],
          },
        },
      ]
    `);
  });

  test('construct from class 1', () => {
    class C
      implements
        PojoConstructorSyncAndAsyncProps<{ a: string; b: string }, number>
    {
      a(input: number) {
        return { sync: () => ({ value: `a-field-${input}` }) };
      }

      b(input: number) {
        return { sync: () => this.a(input).sync() };
      }
    }

    const pojo = constructPojoSyncAndAsync(C, 321).sync();
    expect(pojo).toMatchInlineSnapshot(`
      Object {
        "a": "a-field-321",
        "b": "a-field-321",
      }
    `);
  });

  test('symbols are not proxied', () => {
    const prvm = Symbol('prvm');
    const prvv = Symbol('prvv');

    class C
      implements
        PojoConstructorSyncAndAsyncProps<{ a: string; b: string }, number>
    {
      [prvm]() {
        return 'private-method-by-symbol-result';
      }

      [prvv] = 'private-value-by-symbol-result';

      a(input: number, { cache: cachingProxy }: any) {
        return {
          sync: () => ({
            value: `a-field-${input}---${this[prvm]()}---${
              this[prvv]
            }---${cachingProxy[prvm]()}---${cachingProxy[prvv]}`,
          }),
        };
      }

      b(input: number, { cache: cachingProxy }: any) {
        return { sync: () => cachingProxy.a(input).sync() };
      }
    }

    const pojo = constructPojoSyncAndAsync(C, 321).sync();
    expect(pojo).toMatchInlineSnapshot(`
      Object {
        "a": "a-field-321---private-method-by-symbol-result---private-value-by-symbol-result---private-method-by-symbol-result---private-value-by-symbol-result",
        "b": "a-field-321---private-method-by-symbol-result---private-value-by-symbol-result---private-method-by-symbol-result---private-value-by-symbol-result",
      }
    `);
  });

  test('non-function values can be accessed (is not supported for TS)', () => {
    class C
      implements
        PojoConstructorSyncAndAsyncProps<{ a: string; b: string }, number>
    {
      nonFunctionProp = 'simple-prop-value';

      a(input: number, { cache: cachingProxy }: any) {
        return {
          sync: () => ({
            value: `a-field-${input}---${this.nonFunctionProp}---${cachingProxy.nonFunctionProp}`,
          }),
        };
      }

      b(input: number, { cache: cachingProxy }: any) {
        return { sync: () => cachingProxy.a(input).sync() };
      }
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const pojo = constructPojoSyncAndAsync(C, 321).sync();
    expect(pojo).toMatchInlineSnapshot(`
      Object {
        "a": "a-field-321---simple-prop-value---simple-prop-value",
        "b": "a-field-321---simple-prop-value---simple-prop-value",
      }
    `);
  });

  test('sync throw in promise', async () => {
    class C
      implements
        PojoConstructorSyncAndAsyncProps<
          { a: string; b: string; c: string },
          number
        >
    {
      nonFunctionProp = 'simple-prop-value';

      a() {
        return {
          async: () => {
            throw new Error('a-error');
          },
        };
      }

      b(input: number, cachingProxy: any) {
        return { async: () => cachingProxy.a(input).async() };
      }

      c() {
        return {
          sync: () => ({ value: 'c-string' }),
        };
      }
    }

    const savedCaught: any[] = [];
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const pojo = await constructPojoSyncAndAsync(C, 321, {
      catch(caught, options) {
        savedCaught.push({ caught, options });
      },
    }).async();
    expect(pojo).toMatchInlineSnapshot(`
      Object {
        "c": "c-string",
      }
    `);
    expect(savedCaught).toMatchInlineSnapshot(`
      Array [
        Object {
          "caught": [Error: a-error],
          "options": Object {
            "key": "a",
            "keySequentialIndex": 0,
            "keysStack": Array [
              Object {
                "key": "a",
                "stage": "promise-result-method",
              },
            ],
          },
        },
        Object {
          "caught": [TypeError: cachingProxy.a is not a function],
          "options": Object {
            "key": "b",
            "keySequentialIndex": 1,
            "keysStack": Array [
              Object {
                "key": "b",
                "stage": "promise-result-method",
              },
            ],
          },
        },
      ]
    `);
  });

  test('async throw in promise', async () => {
    class C
      implements
        PojoConstructorSyncAndAsyncProps<
          { a: string; b: string; c: string },
          number
        >
    {
      nonFunctionProp = 'simple-prop-value';

      a() {
        return {
          async: async () => {
            throw new Error('a-error');
          },
        };
      }

      b(input: number, cachingProxy: any) {
        return { async: () => cachingProxy.a(input).async() };
      }

      c() {
        return {
          sync: () => ({ value: 'c-string' }),
        };
      }
    }

    const savedCaught: any[] = [];
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const pojo = await constructPojoSyncAndAsync(C, 321, {
      catch(caught, options) {
        savedCaught.push({ caught, options });
      },
    }).async();
    expect(pojo).toMatchInlineSnapshot(`
      Object {
        "c": "c-string",
      }
    `);
    expect(savedCaught).toMatchInlineSnapshot(`
      Array [
        Object {
          "caught": [Error: a-error],
          "options": Object {
            "key": "a",
            "keySequentialIndex": 0,
            "keysStack": Array [
              Object {
                "key": "a",
                "stage": "promise-resolution",
              },
            ],
          },
        },
        Object {
          "caught": [TypeError: cachingProxy.a is not a function],
          "options": Object {
            "key": "b",
            "keySequentialIndex": 1,
            "keysStack": Array [
              Object {
                "key": "b",
                "stage": "promise-result-method",
              },
            ],
          },
        },
      ]
    `);
  });
});
