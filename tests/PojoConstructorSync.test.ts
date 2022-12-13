import type { PojoConstructorSync } from '../src';
import { pojoFromSync } from '../src';

describe('PojoConstructorSync + pojoFromSync', function () {
  it('should construct from plain', () => {
    const c: PojoConstructorSync<{ a: string; b: number }> = {
      a: () => 'a-string',
      b: () => 123,
    };
    const pojo = pojoFromSync(c);
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
    const pojo = pojoFromSync(c);
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
    const pojo = pojoFromSync(c);
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
    const pojo1 = pojoFromSync(c, { input: true });
    expect(pojo1).toMatchInlineSnapshot(`
      Object {
        "a": "a-string-truthy-variant",
        "b": 123,
      }
    `);
    const pojo2 = pojoFromSync(c, { input: false });
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
    const pojo = pojoFromSync(c);
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
