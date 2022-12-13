import type { PojoConstructorAsync } from '../src';
import { pojoFromAsync } from '../src';

describe('PojoConstructorAsync + pojoFromAsync', function () {
  it('should construct from plain', async () => {
    const c: PojoConstructorAsync<{ a: string; b: number }> = {
      a: async () => 'a-string',
      b: async () => 123,
    };
    const pojo = await pojoFromAsync(c);
    expect(pojo).toMatchInlineSnapshot(`
      Object {
        "a": "a-string",
        "b": 123,
      }
    `);
  });

  it('should construct from class instance', async () => {
    class C implements PojoConstructorAsync<{ a: string; b: number }> {
      async a() {
        return 'a-string';
      }

      async b() {
        return 123;
      }
    }

    const c = new C();
    const pojo = await pojoFromAsync(c);
    expect(pojo).toMatchInlineSnapshot(`
      Object {
        "a": "a-string",
        "b": 123,
      }
    `);
  });

  it('should construct from nested class instance', async () => {
    type PojoC = PojoConstructorAsync<{ a: string; b: number }>;

    class Base implements Pick<PojoC, 'a'> {
      async a() {
        return 'a-string';
      }
    }

    class C extends Base implements PojoC {
      async b() {
        return 123;
      }
    }

    const c = new C();
    const pojo = await pojoFromAsync(c);
    expect(pojo).toMatchInlineSnapshot(`
      Object {
        "a": "a-string",
        "b": 123,
      }
    `);
  });

  it('should pass input', async () => {
    const c: PojoConstructorAsync<{ a: string; b: number }, boolean> = {
      a: async (input) =>
        input ? 'a-string-truthy-variant' : 'a-string-falsy-variant',
      b: async (input) => (input ? 123 : 321),
    };
    const pojo1 = await pojoFromAsync(c, { input: true });
    expect(pojo1).toMatchInlineSnapshot(`
      Object {
        "a": "a-string-truthy-variant",
        "b": 123,
      }
    `);
    const pojo2 = await pojoFromAsync(c, { input: false });
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
      implements PojoConstructorAsync<{ a: string; b: string; c: string }>
    {
      async a() {
        acounter++;
        return 'a-string';
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
    const pojo = await pojoFromAsync(c);
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
});
