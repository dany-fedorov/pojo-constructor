import type { PojoConstructor } from './PojoConstructor';
import { pojoFrom } from './PojoConstructor';

describe('PojoConstructor + pojoFrom', function () {
  it('should construct from plain', () => {
    const c: PojoConstructor<{ a: string; b: number }> = {
      a: () => ({ sync: () => 'a-string' }),
      b: () => ({ sync: () => 123 }),
    };
    const pojo = pojoFrom(c).sync();
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
    const pojo = pojoFrom(c).sync();
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
    const pojo = pojoFrom(c).sync();
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
    const pojo1 = pojoFrom(c, { input: true }).sync();
    expect(pojo1).toMatchInlineSnapshot(`
      Object {
        "a": "a-string-truthy-variant",
        "b": 123,
      }
    `);
    const pojo2 = pojoFrom(c, { input: false }).sync();
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
    const pojo = await pojoFrom(c).promise();
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
    const pojo = pojoFrom(c).sync();
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
    const pojo = await pojoFrom(c).promise();
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
