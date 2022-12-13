import type { PojoConstructor } from '../src';
import { constructPojo } from '../src';

describe('PojoConstructor + pojoFrom', function () {
  it('should construct from plain', () => {
    const c: PojoConstructor<{ a: string; b: number }> = {
      a: () => ({ sync: () => 'a-string' }),
      b: () => ({ sync: () => 123 }),
    };
    const pojo = constructPojo(c).sync();
    expect(pojo).toMatchInlineSnapshot(`
      Object {
        "a": "a-string",
        "b": 123,
      }
    `);
  });

  it('should construct from class instance', () => {
    class C implements PojoConstructor<{ a: string; b: number }> {
      a() {
        return { sync: () => 'a-string' };
      }

      b() {
        return { sync: () => 123 };
      }
    }

    const c = new C();
    const pojo = constructPojo(c).sync();
    expect(pojo).toMatchInlineSnapshot(`
      Object {
        "a": "a-string",
        "b": 123,
      }
    `);
  });

  it('should construct from nested class instance', () => {
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
    const pojo = constructPojo(c).sync();
    expect(pojo).toMatchInlineSnapshot(`
      Object {
        "a": "a-string",
        "b": 123,
      }
    `);
  });

  it('should pass input', () => {
    const c: PojoConstructor<{ a: string; b: number }, boolean> = {
      a: (input) => ({
        sync: () =>
          input ? 'a-string-truthy-variant' : 'a-string-falsy-variant',
      }),
      b: (input) => ({ sync: () => (input ? 123 : 321) }),
    };
    const pojo1 = constructPojo(c, true).sync();
    expect(pojo1).toMatchInlineSnapshot(`
      Object {
        "a": "a-string-truthy-variant",
        "b": 123,
      }
    `);
    const pojo2 = constructPojo(c, false).sync();
    expect(pojo2).toMatchInlineSnapshot(`
      Object {
        "a": "a-string-falsy-variant",
        "b": 321,
      }
    `);
  });

  it('async', async () => {
    const c: PojoConstructor<{ a: string; b: number }> = {
      a: () => ({ sync: () => 'a-string' }),
      b: () => ({ promise: () => Promise.resolve(123) }),
    };
    const pojo = await constructPojo(c).promise();
    expect(pojo).toMatchInlineSnapshot(`
      Object {
        "a": "a-string",
        "b": 123,
      }
    `);
  });

  it('only evaluated once', async () => {
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
    const pojo = constructPojo(c).sync();
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

  it('only evaluated once - async', async () => {
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
    const pojo = await constructPojo(c).promise();
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

  it('caching by input - using cachingProxy argument', () => {
    let acounter = 0;
    const c: PojoConstructor<{ a: string; b: string; c: string }, boolean> = {
      a: (input) => ({
        sync: () => {
          // console.log('a call', { input });
          acounter++;
          return input ? 'a-string-truthy-variant' : 'a-string-falsy-variant';
        },
      }),
      b: (input, { cachingProxy }) => ({
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        sync: () => cachingProxy.a(!input).sync(),
      }),
      c: (input, { cachingProxy }) => ({
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        sync: () => cachingProxy.a(input).sync(),
      }),
    };
    const pojo1 = constructPojo(c, true).sync();
    expect(pojo1).toMatchInlineSnapshot(`
      Object {
        "a": "a-string-truthy-variant",
        "b": "a-string-falsy-variant",
        "c": "a-string-truthy-variant",
      }
    `);
    expect(acounter).toBe(2);
    const pojo2 = constructPojo(c, false).sync();
    expect(pojo2).toMatchInlineSnapshot(`
      Object {
        "a": "a-string-falsy-variant",
        "b": "a-string-truthy-variant",
        "c": "a-string-falsy-variant",
      }
    `);
    expect(acounter).toBe(4);
  });

  it('caching by input - using this', async () => {
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

    const pojo = await constructPojo(new C(), true).promise();
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

  it('eval order - default sorting', async () => {
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

    const pojo = await constructPojo(new C(), true).promise();
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

  it('eval order - reversed sorting', async () => {
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

    const pojo = await constructPojo(new C(), null, {
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

  it('eval order - reversed sorting', async () => {
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

    const pojo = constructPojo(new C(), true, {
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
});
