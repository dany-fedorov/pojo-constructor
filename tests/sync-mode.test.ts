import type { PojoConstructorSyncProps } from '../src/PojoConstructorSync/PojoConstructorSyncProps';
import {
  constructPojoFromInstanceSync,
  constructPojoSync,
} from '../src/PojoConstructorSync/constructPojoSync';
import type { PojoConstructorSyncHelpersHost } from '../src/PojoConstructorSync/PojoConstructorSyncHelpersHost';

describe('PojoConstructorPropsSync + pojoFromSync', function () {
  test('it should construct from plain', () => {
    const c: PojoConstructorSyncProps<{ a: string; b: number }> = {
      a: () => ({ value: 'a-string' }),
      b: () => ({ value: 123 }),
    };
    const pojo = constructPojoFromInstanceSync(c);
    expect(pojo).toMatchInlineSnapshot(`
      PojoHost {
        "value": Object {
          "a": "a-string",
          "b": 123,
        },
      }
    `);
  });

  test('it should construct from class instance', () => {
    class C implements PojoConstructorSyncProps<{ a: string; b: number }> {
      a() {
        return { value: 'a-string' };
      }

      b() {
        return { value: 123 };
      }
    }

    const c = new C();
    const pojo = constructPojoFromInstanceSync(c);
    expect(pojo).toMatchInlineSnapshot(`
      PojoHost {
        "value": Object {
          "a": "a-string",
          "b": 123,
        },
      }
    `);
  });

  test('it should construct from nested class instance', () => {
    type PojoC = PojoConstructorSyncProps<{ a: string; b: number }>;

    class Base implements Pick<PojoC, 'a'> {
      a() {
        return { value: 'a-string' };
      }
    }

    class C extends Base implements PojoC {
      b() {
        return { value: 123 };
      }
    }

    const c = new C();
    const pojo = constructPojoFromInstanceSync(c);
    expect(pojo).toMatchInlineSnapshot(`
      PojoHost {
        "value": Object {
          "a": "a-string",
          "b": 123,
        },
      }
    `);
  });

  test('it should pass input', () => {
    const c: PojoConstructorSyncProps<{ a: string; b: number }, boolean> = {
      a: (input) => ({
        value: input ? 'a-string-truthy-variant' : 'a-string-falsy-variant',
      }),
      b: (input) => ({ value: input ? 123 : 321 }),
    };
    const pojo1 = constructPojoFromInstanceSync(c, true);
    expect(pojo1).toMatchInlineSnapshot(`
      PojoHost {
        "value": Object {
          "a": "a-string-truthy-variant",
          "b": 123,
        },
      }
    `);
    const pojo2 = constructPojoFromInstanceSync(c, false);
    expect(pojo2).toMatchInlineSnapshot(`
      PojoHost {
        "value": Object {
          "a": "a-string-falsy-variant",
          "b": 321,
        },
      }
    `);
  });

  test('cachingProxy access - only evaluated once', async () => {
    let acounter = 0;
    let bcounter = 0;
    let ccounter = 0;

    type O = { a: string; b: string; c: string };

    class C implements PojoConstructorSyncProps<O> {
      a() {
        acounter++;
        return { value: 'a-string' };
      }

      b(_: any, { cache: cachingProxy }: PojoConstructorSyncHelpersHost<O>) {
        bcounter++;
        return cachingProxy.a();
      }

      c(_: any, { cache: cachingProxy }: PojoConstructorSyncHelpersHost<O>) {
        ccounter++;
        return cachingProxy.b();
      }
    }

    const c = new C();
    const pojo = constructPojoFromInstanceSync(c);
    expect(pojo).toMatchInlineSnapshot(`
      PojoHost {
        "value": Object {
          "a": "a-string",
          "b": "a-string",
          "c": "a-string",
        },
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
      implements PojoConstructorSyncProps<{ a: string; b: string; c: string }>
    {
      a() {
        acounter++;
        return { value: 'a-string' };
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
    const pojo = constructPojoFromInstanceSync(c);
    expect(pojo).toMatchInlineSnapshot(`
      PojoHost {
        "value": Object {
          "a": "a-string",
          "b": "a-string",
          "c": "a-string",
        },
      }
    `);
    expect(acounter).toBe(3);
    expect(bcounter).toBe(2);
    expect(ccounter).toBe(1);
  });

  test('using cachingProxy', () => {
    let acount = 0;
    type T = { a: string; b: string; c: string };
    type Input = null;
    const c: PojoConstructorSyncProps<T, Input> = {
      a: () => {
        acount++;
        return { value: 'a-string' };
      },
      b: (
        _,
        { cache: cachingProxy }: PojoConstructorSyncHelpersHost<T, Input>,
      ) => cachingProxy.a(),
      c: (
        _,
        { cache: cachingProxy }: PojoConstructorSyncHelpersHost<T, Input>,
      ) => cachingProxy.b(),
    };
    const pojo = constructPojoFromInstanceSync(c);
    expect(pojo).toMatchInlineSnapshot(`
      PojoHost {
        "value": Object {
          "a": "a-string",
          "b": "a-string",
          "c": "a-string",
        },
      }
    `);
    expect(acount).toBe(1);
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

    class C implements PojoConstructorSyncProps<O, boolean> {
      b(
        input: boolean,
        { cache: cachingProxy }: PojoConstructorSyncHelpersHost<O, boolean>,
      ) {
        evalOrder.push('b');
        if (!counts['b']) {
          counts['b'] = 0;
        }
        counts['b']++;
        return cachingProxy.a(input);
      }

      a(input: boolean) {
        evalOrder.push('a');
        if (!counts['a']) {
          counts['a'] = 0;
        }
        counts['a']++;
        return { value: `a-string-${input}` };
      }

      c(
        input: boolean,
        { cache: cachingProxy }: PojoConstructorSyncHelpersHost<O, boolean>,
      ) {
        evalOrder.push('c');
        if (!counts['c']) {
          counts['c'] = 0;
        }
        counts['c']++;
        return cachingProxy.b(input);
      }

      d99(
        input: boolean,
        { cache: cachingProxy }: PojoConstructorSyncHelpersHost<O, boolean>,
      ) {
        evalOrder.push('d99');
        if (!counts['d99']) {
          counts['d99'] = 0;
        }
        counts['d99']++;
        return cachingProxy.b(input);
      }

      d10(
        input: boolean,
        { cache: cachingProxy }: PojoConstructorSyncHelpersHost<O, boolean>,
      ) {
        evalOrder.push('d10');
        if (!counts['d10']) {
          counts['d10'] = 0;
        }
        counts['d10']++;
        return cachingProxy.b(input);
      }

      d101(
        input: boolean,
        { cache: cachingProxy }: PojoConstructorSyncHelpersHost<O, boolean>,
      ) {
        evalOrder.push('d101');
        if (!counts['d101']) {
          counts['d101'] = 0;
        }
        counts['d101']++;
        return cachingProxy.b(input);
      }
    }

    const pojo = constructPojoFromInstanceSync(new C(), true);
    expect(pojo).toMatchInlineSnapshot(`
      PojoHost {
        "value": Object {
          "a": "a-string-true",
          "b": "a-string-true",
          "c": "a-string-true",
          "d10": "a-string-true",
          "d101": "a-string-true",
          "d99": "a-string-true",
        },
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

  test('cachingProxy - eval order - reversed sorting', async () => {
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

    class C implements PojoConstructorSyncProps<O, boolean> {
      b(
        input: boolean,
        { cache: cachingProxy }: PojoConstructorSyncHelpersHost<O, boolean>,
      ) {
        evalOrder.push('b');
        if (!counts['b']) {
          counts['b'] = 0;
        }
        counts['b']++;
        return cachingProxy.a(input);
      }

      a(input: boolean) {
        evalOrder.push('a');
        if (!counts['a']) {
          counts['a'] = 0;
        }
        counts['a']++;
        return { value: `a-string-${input}` };
      }

      c(
        input: boolean,
        { cache: cachingProxy }: PojoConstructorSyncHelpersHost<O, boolean>,
      ) {
        evalOrder.push('c');
        if (!counts['c']) {
          counts['c'] = 0;
        }
        counts['c']++;
        return cachingProxy.b(input);
      }

      d99(
        input: boolean,
        { cache: cachingProxy }: PojoConstructorSyncHelpersHost<O, boolean>,
      ) {
        evalOrder.push('d99');
        if (!counts['d99']) {
          counts['d99'] = 0;
        }
        counts['d99']++;
        return cachingProxy.b(input);
      }

      d10(
        input: boolean,
        { cache: cachingProxy }: PojoConstructorSyncHelpersHost<O, boolean>,
      ) {
        evalOrder.push('d10');
        if (!counts['d10']) {
          counts['d10'] = 0;
        }
        counts['d10']++;
        return cachingProxy.b(input);
      }

      d101(
        input: boolean,
        { cache: cachingProxy }: PojoConstructorSyncHelpersHost<O, boolean>,
      ) {
        evalOrder.push('d101');
        if (!counts['d101']) {
          counts['d101'] = 0;
        }
        counts['d101']++;
        return cachingProxy.b(input);
      }
    }

    const pojo = constructPojoFromInstanceSync(new C(), true, {
      sortKeys: (keys) => keys.slice().sort((a, b) => (a > b ? -1 : 1)),
    });
    expect(pojo).toMatchInlineSnapshot(`
      PojoHost {
        "value": Object {
          "a": "a-string-true",
          "b": "a-string-true",
          "c": "a-string-true",
          "d10": "a-string-true",
          "d101": "a-string-true",
          "d99": "a-string-true",
        },
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
    type O = { a: string; b: string; c: string };
    const c: PojoConstructorSyncProps<O, boolean> = {
      a: (input) => {
        acounter++;
        return {
          value: input ? 'a-string-truthy-variant' : 'a-string-falsy-variant',
        };
      },
      b: (
        input,
        { cache: cachingProxy }: PojoConstructorSyncHelpersHost<O, boolean>,
      ) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return cachingProxy.a(!input);
      },
      c: (
        input,
        { cache: cachingProxy }: PojoConstructorSyncHelpersHost<O, boolean>,
      ) => {
        return cachingProxy.a(input);
      },
    };
    const pojo1 = await constructPojoFromInstanceSync(c, true);
    expect(pojo1).toMatchInlineSnapshot(`
      PojoHost {
        "value": Object {
          "a": "a-string-truthy-variant",
          "b": "a-string-falsy-variant",
          "c": "a-string-truthy-variant",
        },
      }
    `);
    expect(acounter).toBe(2);
    const pojo2 = constructPojoFromInstanceSync(c, false);
    expect(pojo2).toMatchInlineSnapshot(`
      PojoHost {
        "value": Object {
          "a": "a-string-falsy-variant",
          "b": "a-string-truthy-variant",
          "c": "a-string-falsy-variant",
        },
      }
    `);
    expect(acounter).toBe(4);
  });

  test('limit keys', () => {
    const c: PojoConstructorSyncProps<{ a: string; b: number; c: string }> = {
      a: () => ({ value: 'a-string' }),
      b: () => {
        throw new Error('b-error');
      },
      c: () => ({ value: 'c-string' }),
    };
    const pojo = constructPojoFromInstanceSync(c, null, {
      keys: () => ['a'],
    });
    expect(pojo).toMatchInlineSnapshot(`
      PojoHost {
        "value": Object {
          "a": "a-string",
        },
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
    const c: PojoConstructorSyncProps<O, In> = {
      a: (input) => {
        counters.a++;
        return { value: `a-${input.key}` };
      },
      b: (input, { cache }: PojoConstructorSyncHelpersHost<O, In>) => {
        counters.b++;
        return cache.a({ key: !input.key });
      },
      c: (input, { cache }: PojoConstructorSyncHelpersHost<O, In>) => {
        counters.c++;
        return cache.b({ key: !input.key });
      },
      d: (input, { cache }: PojoConstructorSyncHelpersHost<O, In>) => {
        counters.d++;
        return cache.c({ key: !input.key });
      },
    };
    const pojoControl = constructPojoFromInstanceSync(c, {
      key: true,
    });
    expect(pojoControl).toMatchInlineSnapshot(`
      PojoHost {
        "value": Object {
          "a": "a-true",
          "b": "a-false",
          "c": "a-true",
          "d": "a-false",
        },
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
    const pojoTest = constructPojoFromInstanceSync(
      c,
      { key: true },
      {
        cacheKeyFromConstructorInput: (input) => input?.key,
      },
    );
    expect(pojoTest).toMatchInlineSnapshot(`
      PojoHost {
        "value": Object {
          "a": "a-true",
          "b": "a-false",
          "c": "a-true",
          "d": "a-false",
        },
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

  test('input passing through', () => {
    type O = { a: string; b: string };
    const c: PojoConstructorSyncProps<O, boolean> = {
      a: (input) => ({ value: `a-string-${input}` }),
      b: (
        input,
        { cache: cachingProxy }: PojoConstructorSyncHelpersHost<O, boolean>,
      ) => cachingProxy.a(input),
    };
    const pojo1 = constructPojoFromInstanceSync(c, true);
    expect(pojo1).toMatchInlineSnapshot(`
      PojoHost {
        "value": Object {
          "a": "a-string-true",
          "b": "a-string-true",
        },
      }
    `);
    const pojo2 = constructPojoFromInstanceSync(c, false);
    expect(pojo2).toMatchInlineSnapshot(`
      PojoHost {
        "value": Object {
          "a": "a-string-false",
          "b": "a-string-false",
        },
      }
    `);
  });

  test('construct from class 1', () => {
    class C
      implements PojoConstructorSyncProps<{ a: string; b: string }, number>
    {
      a(input?: number) {
        return { value: `a-field-${input}` };
      }

      b(input: number) {
        return this.a(input);
      }
    }

    const pojo = constructPojoSync(C, 321);
    expect(pojo).toMatchInlineSnapshot(`
      PojoHost {
        "value": Object {
          "a": "a-field-321",
          "b": "a-field-321",
        },
      }
    `);
  });

  test('symbols are not proxied', () => {
    const prvm = Symbol('prvm');
    const prvv = Symbol('prvv');

    class C
      implements PojoConstructorSyncProps<{ a: string; b: string }, number>
    {
      [prvm]() {
        return 'private-method-by-symbol-result';
      }

      [prvv] = 'private-value-by-symbol-result';

      a(input: number, { cache: cachingProxy }: any) {
        return {
          value: `a-field-${input}---${this[prvm]()}---${
            this[prvv]
          }---${cachingProxy[prvm]()}---${cachingProxy[prvv]}`,
        };
      }

      b(input: number, { cache: cachingProxy }: any) {
        return cachingProxy.a(input);
      }
    }

    const pojo = constructPojoSync(C, 3212);
    expect(pojo).toMatchInlineSnapshot(`
      PojoHost {
        "value": Object {
          "a": "a-field-3212---private-method-by-symbol-result---private-value-by-symbol-result---private-method-by-symbol-result---private-value-by-symbol-result",
          "b": "a-field-3212---private-method-by-symbol-result---private-value-by-symbol-result---private-method-by-symbol-result---private-value-by-symbol-result",
        },
      }
    `);
  });

  test('non-function values can be accessed (is not supported for TS)', () => {
    class C
      implements PojoConstructorSyncProps<{ a: string; b: string }, number>
    {
      nonFunctionProp = 'simple-prop-value';

      a(input: number, { cache: cachingProxy }: any) {
        return {
          value: `a-field-${input}---${this.nonFunctionProp}---${cachingProxy.nonFunctionProp}`,
        };
      }

      b(input: number, { cache: cachingProxy }: any) {
        return cachingProxy.a(input);
      }
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const pojo = constructPojoSync(C, 321);
    expect(pojo).toMatchInlineSnapshot(`
      PojoHost {
        "value": Object {
          "a": "a-field-321---simple-prop-value---simple-prop-value",
          "b": "a-field-321---simple-prop-value---simple-prop-value",
        },
      }
    `);
  });

  test('throws in key-method', () => {
    const c: PojoConstructorSyncProps<{ a: number; b: string }> = {
      a() {
        throw new Error('a-error');
      },
      b(...args) {
        return { value: String(this.a(...args).value) };
      },
    };
    // expect.assertions(2);
    try {
      constructPojoFromInstanceSync(c);
    } catch (caught) {
      expect(caught).toMatchInlineSnapshot(`[Error: a-error]`);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      expect(caught?.pojoConstructorStack).toMatchInlineSnapshot(`
        Array [
          Object {
            "key": "a",
            "stage": "sync-result-method",
          },
        ]
      `);
    }
  });

  test('throws in key-method - uses catch method', () => {
    const c: PojoConstructorSyncProps<{ a: number; b: string; c: string }> = {
      a() {
        throw new Error('a-error');
      },
      b(...args) {
        return { value: String(this.a(...args).value) };
      },
      c() {
        return { value: 'c-string' };
      },
    };
    const savedCaught: unknown[] = [];
    const pojo = constructPojoFromInstanceSync(c, null, {
      catch(caught, options) {
        savedCaught.push({ caught, options });
      },
    });
    expect(pojo).toMatchInlineSnapshot(`
      PojoHost {
        "value": Object {
          "c": "c-string",
        },
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
                "stage": "sync-result-method",
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
                "stage": "sync-result-method",
              },
            ],
          },
        },
      ]
    `);
  });
});
