import type {
  PojoConstructorSync,
  PojoConstructorSyncMethodCallOptions,
} from '../src';
import { constructPojoSync } from '../src';

describe('PojoConstructorSync + pojoFromSync', function () {
  it('should construct from plain', () => {
    const c: PojoConstructorSync<{ a: string; b: number }> = {
      a: () => 'a-string',
      b: () => 123,
    };
    const pojo = constructPojoSync(c);
    expect(pojo).toMatchInlineSnapshot(`
      Object {
        "a": "a-string",
        "b": 123,
      }
    `);
  });

  it('should construct from class instance', () => {
    class C implements PojoConstructorSync<{ a: string; b: number }> {
      a() {
        return 'a-string';
      }

      b() {
        return 123;
      }
    }

    const c = new C();
    const pojo = constructPojoSync(c);
    expect(pojo).toMatchInlineSnapshot(`
      Object {
        "a": "a-string",
        "b": 123,
      }
    `);
  });

  it('should construct from nested class instance', () => {
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
    const pojo = constructPojoSync(c);
    expect(pojo).toMatchInlineSnapshot(`
      Object {
        "a": "a-string",
        "b": 123,
      }
    `);
  });

  it('should pass input', () => {
    const c: PojoConstructorSync<{ a: string; b: number }, boolean> = {
      a: (input) =>
        input ? 'a-string-truthy-variant' : 'a-string-falsy-variant',
      b: (input) => (input ? 123 : 321),
    };
    const pojo1 = constructPojoSync(c, true);
    expect(pojo1).toMatchInlineSnapshot(`
      Object {
        "a": "a-string-truthy-variant",
        "b": 123,
      }
    `);
    const pojo2 = constructPojoSync(c, false);
    expect(pojo2).toMatchInlineSnapshot(`
      Object {
        "a": "a-string-falsy-variant",
        "b": 321,
      }
    `);
  });

  it('only evaluated once', async () => {
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
    const pojo = constructPojoSync(c);
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

  it('using cachingProxy', () => {
    let acount = 0;
    type T = { a: string; b: string; c: string };
    type Input = null;
    const c: PojoConstructorSync<T, Input> = {
      a: () => {
        acount++;
        return 'a-string';
      },
      b: (
        _,
        { cachingProxy }: PojoConstructorSyncMethodCallOptions<T, Input>,
      ) => cachingProxy.a(),
      c: (
        _,
        { cachingProxy }: PojoConstructorSyncMethodCallOptions<T, Input>,
      ) => cachingProxy.b(),
    };
    const pojo = constructPojoSync(c);
    expect(pojo).toMatchInlineSnapshot(`
      Object {
        "a": "a-string",
        "b": "a-string",
        "c": "a-string",
      }
    `);
    expect(acount).toBe(1);
  });

  it('eval order - default sorting', async () => {
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

    const pojo = constructPojoSync(new C(), true);
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
});
