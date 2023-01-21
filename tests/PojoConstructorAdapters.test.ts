import { PojoConstructorAdapters } from '../src/PojoConstructorAdapters';

describe('PojoConstructorAdapters.proxy', function () {
  test('sync sync', () => {
    const adapt = PojoConstructorAdapters.proxy({
      src: 'sync',
      dst: 'sync',
    });
    const orig = {
      field: () => ({ value: 123 }),
    };
    const res = adapt(orig);
    expect(res).toBe(orig);
  });

  test('sync async', async () => {
    const adapt = PojoConstructorAdapters.proxy({
      src: 'sync',
      dst: 'async',
    });
    const fieldVal = 123;
    const orig = {
      field: () => ({ value: fieldVal }),
    };
    const res = adapt(orig);
    const fieldRes = await res.field();
    expect(fieldRes.value).toBe(fieldVal);
  });
});
