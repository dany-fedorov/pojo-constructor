import type { PojoConstructorAsyncProps } from '../src/PojoConstructorAsync/PojoConstructorAsyncProps';
import {
  constructPojoAsync,
  constructPojoFromInstanceAsync,
} from '../src/PojoConstructorAsync/constructPojoAsync';
import type { PojoConstructorAsyncHelpersHost } from '../src/PojoConstructorAsync/PojoConstructorAsyncHelpersHost';

describe('PojoConstructorPropsAsync + pojoFromAsync', function () {
  test('it should construct from plain', async () => {
    const c: PojoConstructorAsyncProps<{ a: string; b: number }> = {
      a: async () => ({ value: 'a-string' }),
      b: async () => ({ value: 123 }),
    };
    const pojo = await constructPojoFromInstanceAsync(c);
    expect(pojo).toMatchInlineSnapshot(`
      Object {
        "a": "a-string",
        "b": 123,
      }
    `);
  });

  test('it should construct from class instance', async () => {
    class C implements PojoConstructorAsyncProps<{ a: string; b: number }> {
      async a() {
        return { value: 'a-string' };
      }

      async b() {
        return { value: 123 };
      }
    }

    const c = new C();
    const pojo = await constructPojoFromInstanceAsync(c);
    expect(pojo).toMatchInlineSnapshot(`
      Object {
        "a": "a-string",
        "b": 123,
      }
    `);
  });

  test('it should construct from nested class instance', async () => {
    type PojoC = PojoConstructorAsyncProps<{ a: string; b: number }>;

    class Base implements Pick<PojoC, 'a'> {
      async a() {
        return { value: 'a-string' };
      }
    }

    class C extends Base implements PojoC {
      async b() {
        return { value: 123 };
      }
    }

    const c = new C();
    const pojo = await constructPojoFromInstanceAsync(c);
    expect(pojo).toMatchInlineSnapshot(`
      Object {
        "a": "a-string",
        "b": 123,
      }
    `);
  });

  test('it should pass input', async () => {
    const c: PojoConstructorAsyncProps<{ a: string; b: number }, boolean> = {
      a: async (input) => ({
        value: input ? 'a-string-truthy-variant' : 'a-string-falsy-variant',
      }),
      b: async (input) => ({ value: input ? 123 : 321 }),
    };
    const pojo1 = await constructPojoFromInstanceAsync(c, true);
    expect(pojo1).toMatchInlineSnapshot(`
      Object {
        "a": "a-string-truthy-variant",
        "b": 123,
      }
    `);
    const pojo2 = await constructPojoFromInstanceAsync(c, false);
    expect(pojo2).toMatchInlineSnapshot(`
      Object {
        "a": "a-string-falsy-variant",
        "b": 321,
      }
    `);
  });

  test('accessing properties through this does not use cache', async () => {
    let acounter = 0;
    let bcounter = 0;
    let ccounter = 0;

    class C
      implements PojoConstructorAsyncProps<{ a: string; b: string; c: string }>
    {
      async a() {
        acounter++;
        return { value: 'a-string' };
      }

      async b() {
        bcounter++;
        return this.a();
      }

      async c() {
        ccounter++;
        return this.b();
      }
    }

    const c = new C();
    const pojo = await constructPojoFromInstanceAsync(c);
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

  test('cachingProxy access - only evaluated once', async () => {
    let acounter = 0;
    let bcounter = 0;
    let ccounter = 0;

    type O = { a: string; b: string; c: string };

    class C implements PojoConstructorAsyncProps<O> {
      async a() {
        acounter++;
        return { value: 'a-string' };
      }

      async b(
        _: any,
        { cache: cachingProxy }: PojoConstructorAsyncHelpersHost<O>,
      ) {
        bcounter++;
        return cachingProxy.a();
      }

      async c(
        _: any,
        { cache: cachingProxy }: PojoConstructorAsyncHelpersHost<O>,
      ) {
        ccounter++;
        return cachingProxy.b();
      }
    }

    const c = new C();
    const pojo = await constructPojoFromInstanceAsync(c);
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

  test('using cachingProxy', async () => {
    let acount = 0;
    type T = { a: string; b: string; c: string };
    type Input = null;
    const c: PojoConstructorAsyncProps<T, Input> = {
      a: async () => {
        acount++;
        return new Promise((r) =>
          setTimeout(() => r({ value: 'a-string' }), 10),
        );
      },
      b: async (
        _,
        { cache: cachingProxy }: PojoConstructorAsyncHelpersHost<T, Input>,
      ) => cachingProxy.a(),
      c: async (
        _,
        { cache: cachingProxy }: PojoConstructorAsyncHelpersHost<T, Input>,
      ) => cachingProxy.b(),
    };
    const pojo = await constructPojoFromInstanceAsync(c);
    expect(pojo).toMatchInlineSnapshot(`
      Object {
        "a": "a-string",
        "b": "a-string",
        "c": "a-string",
      }
    `);
    expect(acount).toBe(1);
  });

  test('caching by input - using cachingProxy argument', async () => {
    let acounter = 0;
    type O = { a: string; b: string; c: string };
    const c: PojoConstructorAsyncProps<O, boolean> = {
      a: async (input) => {
        acounter++;
        return {
          value: input ? 'a-string-truthy-variant' : 'a-string-falsy-variant',
        };
      },
      b: async (
        input,
        { cache: cachingProxy }: PojoConstructorAsyncHelpersHost<O, boolean>,
      ) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return cachingProxy.a(!input);
      },
      c: async (
        input,
        { cache: cachingProxy }: PojoConstructorAsyncHelpersHost<O, boolean>,
      ) => {
        return cachingProxy.a(input);
      },
    };
    const pojo1 = await constructPojoFromInstanceAsync(c, true);
    expect(pojo1).toMatchInlineSnapshot(`
      Object {
        "a": "a-string-truthy-variant",
        "b": "a-string-falsy-variant",
        "c": "a-string-truthy-variant",
      }
    `);
    expect(acounter).toBe(2);
    const pojo2 = await constructPojoFromInstanceAsync(c, false);
    expect(pojo2).toMatchInlineSnapshot(`
      Object {
        "a": "a-string-falsy-variant",
        "b": "a-string-truthy-variant",
        "c": "a-string-falsy-variant",
      }
    `);
    expect(acounter).toBe(4);
  });

  test('it should reassign input - using cachingProxy argument', async () => {
    let acounter = 0;
    type O = { a: string; b: string; c: string; d: string };
    const c: PojoConstructorAsyncProps<O, boolean | null> = {
      a: async (input) => {
        acounter++;
        return { value: `a-string-${input}` };
      },
      b: async (
        _,
        {
          cache: cachingProxy,
        }: PojoConstructorAsyncHelpersHost<O, boolean | null>,
      ) => {
        return cachingProxy.a(null);
      },
      c: async (
        input,
        {
          cache: cachingProxy,
        }: PojoConstructorAsyncHelpersHost<O, boolean | null>,
      ) => {
        return cachingProxy.a(!input);
      },
      d: async (
        input,
        {
          cache: cachingProxy,
        }: PojoConstructorAsyncHelpersHost<O, boolean | null>,
      ) => {
        return cachingProxy.a(input);
      },
    };
    const pojo = await constructPojoFromInstanceAsync(c, true);
    expect(pojo).toMatchInlineSnapshot(`
      Object {
        "a": "a-string-true",
        "b": "a-string-null",
        "c": "a-string-false",
        "d": "a-string-true",
      }
    `);
    expect(acounter).toBe(3); // true, false, null
  });

  test('it should resolve with concurrency setting', async () => {
    const c: PojoConstructorAsyncProps<{ a: string; b: number }> = {
      a: async () => ({ value: 'a-string' }),
      b: async () => ({ value: 123 }),
    };
    const pojo = await constructPojoFromInstanceAsync(c, null, {
      concurrency: 100,
    });
    expect(pojo).toMatchInlineSnapshot(`
      Object {
        "a": "a-string",
        "b": 123,
      }
    `);
  });

  test('cachingProxy access - only evaluated once - concur', async () => {
    let acounter = 0;
    let bcounter = 0;
    let ccounter = 0;

    type O = { a: string; b: string; c: string };

    class C implements PojoConstructorAsyncProps<O> {
      async a() {
        acounter++;
        return { value: 'a-string' };
      }

      async b(
        _: any,
        { cache: cachingProxy }: PojoConstructorAsyncHelpersHost<O>,
      ) {
        bcounter++;
        return cachingProxy.a();
      }

      async c(
        _: any,
        { cache: cachingProxy }: PojoConstructorAsyncHelpersHost<O>,
      ) {
        ccounter++;
        return cachingProxy.b();
      }
    }

    const c = new C();
    const pojo = await constructPojoFromInstanceAsync(c, undefined as any, {
      concurrency: 100,
    });
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

    class C implements PojoConstructorAsyncProps<O, boolean> {
      async b(
        input: boolean,
        { cache: cachingProxy }: PojoConstructorAsyncHelpersHost<O, boolean>,
      ) {
        evalOrder.push('b');
        if (!counts['b']) {
          counts['b'] = 0;
        }
        counts['b']++;
        return cachingProxy.a(input);
      }

      async a(input: boolean) {
        evalOrder.push('a');
        if (!counts['a']) {
          counts['a'] = 0;
        }
        counts['a']++;
        return { value: `a-string-${input}` };
      }

      async c(
        input: boolean,
        { cache: cachingProxy }: PojoConstructorAsyncHelpersHost<O, boolean>,
      ) {
        evalOrder.push('c');
        if (!counts['c']) {
          counts['c'] = 0;
        }
        counts['c']++;
        return cachingProxy.b(input);
      }

      async d99(
        input: boolean,
        { cache: cachingProxy }: PojoConstructorAsyncHelpersHost<O, boolean>,
      ) {
        evalOrder.push('d99');
        if (!counts['d99']) {
          counts['d99'] = 0;
        }
        counts['d99']++;
        return cachingProxy.b(input);
      }

      async d10(
        input: boolean,
        { cache: cachingProxy }: PojoConstructorAsyncHelpersHost<O, boolean>,
      ) {
        evalOrder.push('d10');
        if (!counts['d10']) {
          counts['d10'] = 0;
        }
        counts['d10']++;
        return cachingProxy.b(input);
      }

      async d101(
        input: boolean,
        { cache: cachingProxy }: PojoConstructorAsyncHelpersHost<O, boolean>,
      ) {
        evalOrder.push('d101');
        if (!counts['d101']) {
          counts['d101'] = 0;
        }
        counts['d101']++;
        return cachingProxy.b(input);
      }
    }

    const pojo = await constructPojoFromInstanceAsync(new C(), true);
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

    class C implements PojoConstructorAsyncProps<O, boolean> {
      async b(
        input: boolean,
        { cache: cachingProxy }: PojoConstructorAsyncHelpersHost<O, boolean>,
      ) {
        evalOrder.push('b');
        if (!counts['b']) {
          counts['b'] = 0;
        }
        counts['b']++;
        return cachingProxy.a(input);
      }

      async a(input: boolean) {
        evalOrder.push('a');
        if (!counts['a']) {
          counts['a'] = 0;
        }
        counts['a']++;
        return { value: `a-string-${input}` };
      }

      async c(
        input: boolean,
        { cache: cachingProxy }: PojoConstructorAsyncHelpersHost<O, boolean>,
      ) {
        evalOrder.push('c');
        if (!counts['c']) {
          counts['c'] = 0;
        }
        counts['c']++;
        return cachingProxy.b(input);
      }

      async d99(
        input: boolean,
        { cache: cachingProxy }: PojoConstructorAsyncHelpersHost<O, boolean>,
      ) {
        evalOrder.push('d99');
        if (!counts['d99']) {
          counts['d99'] = 0;
        }
        counts['d99']++;
        return cachingProxy.b(input);
      }

      async d10(
        input: boolean,
        { cache: cachingProxy }: PojoConstructorAsyncHelpersHost<O, boolean>,
      ) {
        evalOrder.push('d10');
        if (!counts['d10']) {
          counts['d10'] = 0;
        }
        counts['d10']++;
        return cachingProxy.b(input);
      }

      async d101(
        input: boolean,
        { cache: cachingProxy }: PojoConstructorAsyncHelpersHost<O, boolean>,
      ) {
        evalOrder.push('d101');
        if (!counts['d101']) {
          counts['d101'] = 0;
        }
        counts['d101']++;
        return cachingProxy.b(input);
      }
    }

    const pojo = await constructPojoFromInstanceAsync(new C(), true, {
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

  test('limit keys', async () => {
    const c: PojoConstructorAsyncProps<{ a: string; b: number; c: string }> = {
      a: async () => ({ value: 'a-string' }),
      b: async () => {
        throw new Error('b-error');
      },
      c: async () => ({ value: 'c-string' }),
    };
    const pojo = await constructPojoFromInstanceAsync(c, null, {
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
    type O = { a: string; b: string; c: string; d: string };
    type In = { key: boolean };
    const c: PojoConstructorAsyncProps<O, In> = {
      a: async (input) => {
        counters.a++;
        return { value: `a-${input.key}` };
      },
      b: async (input, { cache }: PojoConstructorAsyncHelpersHost<O, In>) => {
        counters.b++;
        return cache.a({ key: !input.key });
      },
      c: async (input, { cache }: PojoConstructorAsyncHelpersHost<O, In>) => {
        counters.c++;
        return cache.b({ key: !input.key });
      },
      d: async (input, { cache }: PojoConstructorAsyncHelpersHost<O, In>) => {
        counters.d++;
        return cache.c({ key: !input.key });
      },
    };
    const pojoControl = await constructPojoFromInstanceAsync(c, { key: true });
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
    const pojoTest = await constructPojoFromInstanceAsync(
      c,
      { key: true },
      {
        cacheKeyFromConstructorInput: (input) => input?.key,
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

  test('custom catch - pojoConstructorStack: key-method', async () => {
    type O = { a: string; b: string };
    const c: PojoConstructorAsyncProps<O> = {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      a: async () => {
        throw new Error('Error!');
      },
      b: async (_, { cache }: PojoConstructorAsyncHelpersHost<O>) => {
        return cache.a();
      },
    };
    expect.assertions(2);
    try {
      await constructPojoFromInstanceAsync(c, null);
    } catch (caught) {
      expect(caught).toMatchInlineSnapshot(`[Error: Error!]`);
    }

    const caughtArr: any[] = [];
    await constructPojoFromInstanceAsync(c, null, {
      catch: (caught, options) => {
        caughtArr.push({ caught, options });
      },
    });
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
                "stage": "promise-resolution",
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
                "stage": "promise-resolution",
              },
            ],
          },
        },
      ]
    `);
  });

  test('concur custom catch - pojoConstructorStack: key-method', async () => {
    type O = { a: string; b: string };
    const c: PojoConstructorAsyncProps<O> = {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      a: async () => {
        throw new Error('Error!');
      },
      b: async (_, { cache }: PojoConstructorAsyncHelpersHost<O>) => {
        return cache.a();
      },
    };
    expect.assertions(2);
    try {
      await constructPojoFromInstanceAsync(c, null, {
        concurrency: 10,
      });
    } catch (caught) {
      expect(caught).toMatchInlineSnapshot(`[Error: Error!]`);
    }

    const caughtArr: any[] = [];
    await constructPojoFromInstanceAsync(c, null, {
      concurrency: 10,
      catch: (caught, options) => {
        caughtArr.push({ caught, options });
      },
    });
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
                "stage": "promise-resolution",
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
                "stage": "promise-resolution",
              },
            ],
          },
        },
      ]
    `);
  });

  test('passing input through', async () => {
    type O = { a: string; b: string };
    const c: PojoConstructorAsyncProps<O, boolean> = {
      a: async (input) => ({ value: `a-string-${input}` }),
      b: async (
        input,
        { cache: cachingProxy }: PojoConstructorAsyncHelpersHost<O, boolean>,
      ) => cachingProxy.a(input),
    };
    const pojo1 = await constructPojoFromInstanceAsync(c, true);
    expect(pojo1).toMatchInlineSnapshot(`
      Object {
        "a": "a-string-true",
        "b": "a-string-true",
      }
    `);
    const pojo2 = await constructPojoFromInstanceAsync(c, false);
    expect(pojo2).toMatchInlineSnapshot(`
      Object {
        "a": "a-string-false",
        "b": "a-string-false",
      }
    `);
  });

  test('construct from class 1', async () => {
    class C
      implements PojoConstructorAsyncProps<{ a: string; b: string }, number>
    {
      async a(input: number) {
        return { value: `a-field-${input}` };
      }

      async b(input: number) {
        return this.a(input);
      }
    }

    const pojo = await constructPojoAsync(C, 321);
    expect(pojo).toMatchInlineSnapshot(`
      Object {
        "a": "a-field-321",
        "b": "a-field-321",
      }
    `);
  });

  test('symbols are not proxied', async () => {
    const prvm = Symbol('prvm');
    const prvv = Symbol('prvv');

    class C
      implements PojoConstructorAsyncProps<{ a: string; b: string }, number>
    {
      [prvm]() {
        return 'private-method-by-symbol-result';
      }

      [prvv] = 'private-value-by-symbol-result';

      async a(input: number, { cache: cachingProxy }: any) {
        return {
          value: `a-field-${input}---${this[prvm]()}---${
            this[prvv]
          }---${cachingProxy[prvm]()}---${cachingProxy[prvv]}`,
        };
      }

      async b(input: number, { cache: cachingProxy }: any) {
        return cachingProxy.a(input);
      }
    }

    const pojo = await constructPojoAsync(C, 3212);
    expect(pojo).toMatchInlineSnapshot(`
      Object {
        "a": "a-field-3212---private-method-by-symbol-result---private-value-by-symbol-result---private-method-by-symbol-result---private-value-by-symbol-result",
        "b": "a-field-3212---private-method-by-symbol-result---private-value-by-symbol-result---private-method-by-symbol-result---private-value-by-symbol-result",
      }
    `);
  });

  test('non-function values can be accessed (is not supported for TS)', async () => {
    class C
      implements PojoConstructorAsyncProps<{ a: string; b: string }, number>
    {
      nonFunctionProp = 'simple-prop-value';

      async a(input: number, { cache: cachingProxy }: any) {
        return {
          value: `a-field-${input}---${this.nonFunctionProp}---${cachingProxy.nonFunctionProp}`,
        };
      }

      async b(input: number, { cache: cachingProxy }: any) {
        return cachingProxy.a(input);
      }
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const pojo = await constructPojoAsync(C, 321);
    expect(pojo).toMatchInlineSnapshot(`
      Object {
        "a": "a-field-321---simple-prop-value---simple-prop-value",
        "b": "a-field-321---simple-prop-value---simple-prop-value",
      }
    `);
  });

  test('throws in key-method', async () => {
    const c: PojoConstructorAsyncProps<{ a: number; b: string }> = {
      async a() {
        throw new Error('a-error');
      },
      async b(...args) {
        return { value: String((await this.a(...args)).value) };
      },
    };
    expect.assertions(2);
    try {
      await constructPojoFromInstanceAsync(c);
    } catch (caught) {
      expect(caught).toMatchInlineSnapshot(`[Error: a-error]`);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      expect(caught?.pojoConstructorStack).toMatchInlineSnapshot(`
        Array [
          Object {
            "key": "a",
            "stage": "promise-resolution",
          },
        ]
      `);
    }
  });

  test('throws in key-method - concur', async () => {
    const c: PojoConstructorAsyncProps<{ a: number; b: string }> = {
      async a() {
        throw new Error('a-error');
      },
      async b(...args) {
        return { value: String((await this.a(...args)).value) };
      },
    };
    expect.assertions(2);
    try {
      await constructPojoFromInstanceAsync(c, undefined, {
        concurrency: 100,
      });
    } catch (caught) {
      expect(caught).toMatchInlineSnapshot(`[Error: a-error]`);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      expect(caught?.pojoConstructorStack).toMatchInlineSnapshot(`
        Array [
          Object {
            "key": "a",
            "stage": "promise-resolution",
          },
        ]
      `);
    }
  });

  test('throws in key-method - uses catch method', async () => {
    const c: PojoConstructorAsyncProps<{ a: number; b: string; c: string }> = {
      async a() {
        throw new Error('a-error');
      },
      async b(...args) {
        return { value: String((await this.a(...args)).value) };
      },
      async c() {
        return { value: 'c-string' };
      },
    };
    const savedCaught: unknown[] = [];
    const pojo = await constructPojoFromInstanceAsync(c, null, {
      catch(caught, options) {
        savedCaught.push({ caught, options });
      },
    });
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
          "caught": [Error: a-error],
          "options": Object {
            "key": "b",
            "keySequentialIndex": 1,
            "keysStack": Array [
              Object {
                "key": "b",
                "stage": "promise-resolution",
              },
            ],
          },
        },
      ]
    `);
  });

  test('throws in key-method - uses catch method - sync throw', async () => {
    const c: PojoConstructorAsyncProps<{ a: number; b: string; c: string }> = {
      a() {
        throw new Error('a-error');
      },
      async b(...args) {
        return { value: String((await this.a(...args)).value) };
      },
      async c() {
        return { value: 'c-string' };
      },
    };
    const savedCaught: unknown[] = [];
    const pojo = await constructPojoFromInstanceAsync(c, null, {
      catch(caught, options) {
        savedCaught.push({ caught, options });
      },
    });
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
          "caught": [Error: a-error],
          "options": Object {
            "key": "b",
            "keySequentialIndex": 1,
            "keysStack": Array [
              Object {
                "key": "b",
                "stage": "promise-resolution",
              },
            ],
          },
        },
      ]
    `);
  });

  test('throws in key-method - uses catch method - concur', async () => {
    const c: PojoConstructorAsyncProps<{ a: number; b: string; c: string }> = {
      async a() {
        throw new Error('a-error');
      },
      async b(...args) {
        return { value: String((await this.a(...args)).value) };
      },
      async c() {
        return { value: 'c-string' };
      },
    };
    const savedCaught: unknown[] = [];
    const pojo = await constructPojoFromInstanceAsync(c, null, {
      concurrency: 100,
      catch(caught, options) {
        savedCaught.push({ caught, options });
      },
    });
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
            "keySequentialIndex": null,
            "keysStack": Array [
              Object {
                "key": "a",
                "stage": "promise-resolution",
              },
            ],
          },
        },
        Object {
          "caught": [Error: a-error],
          "options": Object {
            "key": "b",
            "keySequentialIndex": null,
            "keysStack": Array [
              Object {
                "key": "b",
                "stage": "promise-resolution",
              },
            ],
          },
        },
      ]
    `);
  });
});
