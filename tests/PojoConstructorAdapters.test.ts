import { PojoConstructorAdapters } from '../src/PojoConstructorAdapters';
import {
  PojoConstructorAsync,
  PojoConstructorSync,
  PojoConstructorSyncAndAsync,
} from '../src';

describe('PojoConstructorAdapters.proxy', function () {
  test('sync 2 sync', () => {
    const adapter = PojoConstructorAdapters.proxy({
      src: 'sync',
      dst: 'sync',
    });
    const fieldVal = Math.random();
    const orig = {
      field: () => ({ value: fieldVal }),
    };
    const adapted = adapter(orig);
    expect(adapted).toBe(orig);
    const fieldRes = adapted.field();
    expect(fieldRes.value).toBe(fieldVal);
  });

  test('sync 2 async', async () => {
    const adapter = PojoConstructorAdapters.proxy({
      src: 'sync',
      dst: 'async',
    });
    const fieldVal = Math.random();
    const orig = {
      field: () => ({ value: fieldVal }),
    };
    const adapted = adapter(orig);
    const fieldRes = await adapted.field();
    expect(fieldRes.value).toBe(fieldVal);
  });

  test('sync 2 sync-and-async', async () => {
    const adapter = PojoConstructorAdapters.proxy({
      src: 'sync',
      dst: 'sync-and-async',
    });
    const fieldVal = Math.random();
    const orig = {
      field: () => ({ value: fieldVal }),
    };
    const adapted = adapter(orig);
    const fieldResSync = adapted.field().sync!();
    expect(fieldResSync.value).toBe(fieldVal);
    const fieldResAsync = await adapted.field().async!();
    expect(fieldResAsync.value).toBe(fieldVal);
  });

  test('async 2 sync', async () => {
    expect.assertions(1);
    try {
      PojoConstructorAdapters.proxy({
        src: 'async',
        dst: 'sync',
      });
    } catch (caught) {
      expect(caught).toMatchInlineSnapshot(
        `[Error: Cannot adapt async to sync]`,
      );
    }
  });

  test('async 2 async', async () => {
    const adapter = PojoConstructorAdapters.proxy({
      src: 'async',
      dst: 'async',
    });
    const fieldVal = Math.random();
    const orig = {
      field: () => Promise.resolve({ value: fieldVal }),
    };
    const adapted = adapter(orig);
    expect(adapted).toBe(orig);
    const fieldRes = await adapted.field();
    expect(fieldRes.value).toBe(fieldVal);
  });

  test('async 2 sync-and-async', async () => {
    const adapter = PojoConstructorAdapters.proxy({
      src: 'async',
      dst: 'sync-and-async',
    });
    const fieldVal = Math.random();
    const orig = {
      field: () => Promise.resolve({ value: fieldVal }),
    };
    const adapted = adapter(orig);
    expect('sync' in adapted.field()).toBe(false);
    const fieldResAsync = await adapted.field().async!();
    expect(fieldResAsync.value).toBe(fieldVal);
  });

  test('sync-and-async 2 sync', async () => {
    const adapter = PojoConstructorAdapters.proxy({
      src: 'sync-and-async',
      dst: 'sync',
    });
    const fieldVal = Math.random();
    const orig = {
      field: () => ({ sync: () => ({ value: fieldVal }) }),
    };
    const adapted = adapter(orig);
    const fieldRes = adapted.field();
    expect(fieldRes.value).toBe(fieldVal);
  });

  /**
   * Not a valid test case, sync-and-async proxy based on sync-only props provider will have an async that falls back on sync
   */
  test('sync-and-async (sync) 2 async', async () => {
    const adapter = PojoConstructorAdapters.proxy({
      src: 'sync-and-async',
      dst: 'async',
    });
    const fieldVal = Math.random();
    const orig = {
      field: () => ({ sync: () => ({ value: fieldVal }) }),
    };
    const adapted = adapter(orig);
    const fieldRes = await adapted.field();
    expect(fieldRes.value).toBe(fieldVal);
  });

  test('sync-and-async (async) 2 async', async () => {
    const adapter = PojoConstructorAdapters.proxy({
      src: 'sync-and-async',
      dst: 'async',
    });
    const fieldVal = Math.random();
    const orig = {
      field: () => ({ async: () => Promise.resolve({ value: fieldVal }) }),
    };
    const adapted = adapter(orig);
    const fieldRes = await adapted.field();
    expect(fieldRes.value).toBe(fieldVal);
  });

  test('sync-and-async (sync) 2 sync-and-async', async () => {
    const adapter = PojoConstructorAdapters.proxy({
      src: 'sync-and-async',
      dst: 'sync-and-async',
    });
    const fieldVal = Math.random();
    const orig = {
      field: () => ({ sync: () => ({ value: fieldVal }) }),
    };
    const adapted = adapter(orig);
    expect(adapted).toBe(orig);
    const fieldResSync = adapted.field().sync!();
    expect(fieldResSync.value).toBe(fieldVal);
  });

  test('sync-and-async (async) 2 sync-and-async', async () => {
    const adapter = PojoConstructorAdapters.proxy({
      src: 'sync-and-async',
      dst: 'sync-and-async',
    });
    const fieldVal = Math.random();
    const orig = {
      field: () => ({ async: () => Promise.resolve({ value: fieldVal }) }),
    };
    const adapted = adapter(orig);
    expect(adapted).toBe(orig);
    const fieldResSync = await adapted.field().async!();
    expect(fieldResSync.value).toBe(fieldVal);
  });

  test('plain-object 2 sync', () => {
    const adapter = PojoConstructorAdapters.proxy({
      src: 'plain',
      dst: 'sync',
    });
    const fieldVal = Math.random();
    const orig = { field: fieldVal };
    const adapted = adapter(orig);
    const fieldRes = adapted.field();
    expect(fieldRes.value).toBe(fieldVal);
  });

  test('plain-object 2 async', async () => {
    const adapter = PojoConstructorAdapters.proxy({
      src: 'plain',
      dst: 'async',
    });
    const fieldVal = Math.random();
    const orig = { field: fieldVal };
    const adapted = adapter(orig);
    const fieldRes = await adapted.field();
    expect(fieldRes.value).toBe(fieldVal);
  });

  test('plain-object 2 sync-and-async', async () => {
    const adapter = PojoConstructorAdapters.proxy({
      src: 'plain',
      dst: 'sync-and-async',
    });
    const fieldVal = Math.random();
    const orig = { field: fieldVal };
    const adapted = adapter(orig);
    const fieldResSync = adapted.field().sync!();
    expect(fieldResSync.value).toBe(fieldVal);
    const fieldResAsync = await adapted.field().async!();
    expect(fieldResAsync.value).toBe(fieldVal);
  });
});

describe('PojoConstructorAdapters.props', function () {
  test('sync 2 sync', () => {
    const adapter = PojoConstructorAdapters.props({
      src: 'sync',
      dst: 'sync',
    });
    const fieldVal = Math.random();
    const orig = {
      field: () => ({ value: fieldVal }),
    };
    const adapted = adapter(orig);
    expect(adapted).toBe(orig);
  });

  test('sync 2 async', async () => {
    const adapter = PojoConstructorAdapters.props({
      src: 'sync',
      dst: 'async',
    });
    const fieldVal = Math.random();
    const orig = {
      field: () => ({ value: fieldVal }),
    };
    const adapted = adapter(orig);
    const ctor = new PojoConstructorAsync(adapted);
    const res = await ctor.pojo();
    expect(res).toMatchObject({ value: { field: fieldVal } });
  });

  test('sync 2 sync-and-async', async () => {
    const adapter = PojoConstructorAdapters.props({
      src: 'sync',
      dst: 'sync-and-async',
    });
    const fieldVal = Math.random();
    const orig = {
      field: () => ({ value: fieldVal }),
    };
    const adapted = adapter(orig);
    const ctor = new PojoConstructorSyncAndAsync(adapted);
    const resAsync = await ctor.pojo().async();
    expect(resAsync).toMatchObject({ value: { field: fieldVal } });
    const resSync = ctor.pojo().sync();
    expect(resSync).toMatchObject({ value: { field: fieldVal } });
  });

  test('async 2 sync', async () => {
    expect.assertions(1);
    try {
      PojoConstructorAdapters.props({
        src: 'async',
        dst: 'sync',
      });
    } catch (caught) {
      expect(caught).toMatchInlineSnapshot(
        `[Error: Cannot adapt async to sync]`,
      );
    }
  });

  test('async 2 async', async () => {
    const adapter = PojoConstructorAdapters.props({
      src: 'async',
      dst: 'async',
    });
    const fieldVal = Math.random();
    const orig = {
      field: () => Promise.resolve({ value: fieldVal }),
    };
    const adapted = adapter(orig);
    expect(adapted).toBe(orig);
  });

  test('async 2 sync-and-async', async () => {
    const adapter = PojoConstructorAdapters.props({
      src: 'async',
      dst: 'sync-and-async',
    });
    const fieldVal = Math.random();
    const orig = {
      field: () => Promise.resolve({ value: fieldVal }),
    };
    const adapted = adapter(orig);
    const ctor = new PojoConstructorSyncAndAsync(adapted);
    const resAsync = await ctor.pojo().async();
    expect(resAsync).toMatchObject({ value: { field: fieldVal } });
  });

  test('sync-and-async 2 sync', async () => {
    const adapter = PojoConstructorAdapters.props({
      src: 'sync-and-async',
      dst: 'sync',
    });
    const fieldVal = Math.random();
    const orig = {
      field: () => ({ sync: () => ({ value: fieldVal }) }),
    };
    const adapted = adapter(orig);
    const ctor = new PojoConstructorSync(adapted);
    const res = ctor.pojo();
    expect(res).toMatchObject({ value: { field: fieldVal } });
  });

  test('sync-and-async (sync) 2 async', async () => {
    const adapter = PojoConstructorAdapters.props({
      src: 'sync-and-async',
      dst: 'async',
    });
    const fieldVal = Math.random();
    const orig = {
      field: () => ({ sync: () => ({ value: fieldVal }) }),
    };
    const adapted = adapter(orig);
    const ctor = new PojoConstructorAsync(adapted);
    const res = await ctor.pojo();
    expect(res).toMatchObject({ value: { field: fieldVal } });
  });

  test('sync-and-async (async) 2 async', async () => {
    const adapter = PojoConstructorAdapters.props({
      src: 'sync-and-async',
      dst: 'async',
    });
    const fieldVal = Math.random();
    const orig = {
      field: () => ({ async: () => Promise.resolve({ value: fieldVal }) }),
    };
    const adapted = adapter(orig);
    const ctor = new PojoConstructorAsync(adapted);
    const res = await ctor.pojo();
    expect(res).toMatchObject({ value: { field: fieldVal } });
  });

  test('sync-and-async (sync) 2 sync-and-async', async () => {
    const adapter = PojoConstructorAdapters.props({
      src: 'sync-and-async',
      dst: 'sync-and-async',
    });
    const fieldVal = Math.random();
    const orig = {
      field: () => ({ sync: () => ({ value: fieldVal }) }),
    };
    const adapted = adapter(orig);
    expect(adapted).toBe(orig);
    const ctor = new PojoConstructorSyncAndAsync(adapted);
    const resSync = ctor.pojo().sync();
    expect(resSync).toMatchObject({ value: { field: fieldVal } });
  });

  test('sync-and-async (async) 2 sync-and-async', async () => {
    const adapter = PojoConstructorAdapters.props({
      src: 'sync-and-async',
      dst: 'sync-and-async',
    });
    const fieldVal = Math.random();
    const orig = {
      field: () => ({ async: () => Promise.resolve({ value: fieldVal }) }),
    };
    const adapted = adapter(orig);
    expect(adapted).toBe(orig);
    const ctor = new PojoConstructorSyncAndAsync(adapted);
    const resAsync = await ctor.pojo().async();
    expect(resAsync).toMatchObject({ value: { field: fieldVal } });
  });

  test('plain-object 2 sync', () => {
    const adapter = PojoConstructorAdapters.props({
      src: 'plain',
      dst: 'sync',
    });
    const fieldVal = Math.random();
    const orig = { field: fieldVal };
    const adapted = adapter(orig);
    const ctor = new PojoConstructorSync(adapted);
    const res = ctor.pojo();
    expect(res).toMatchObject({ value: orig });
  });

  test('plain-object 2 async', async () => {
    const adapter = PojoConstructorAdapters.props({
      src: 'plain',
      dst: 'async',
    });
    const fieldVal = Math.random();
    const orig = { field: fieldVal };
    const adapted = adapter(orig);
    const ctor = new PojoConstructorAsync(adapted);
    const res = await ctor.pojo();
    expect(res).toMatchObject({ value: orig });
  });

  test('plain-object 2 sync-and-async', async () => {
    const adapter = PojoConstructorAdapters.props({
      src: 'plain',
      dst: 'sync-and-async',
    });
    const fieldVal = Math.random();
    const orig = { field: fieldVal };
    const adapted = adapter(orig);
    const ctor = new PojoConstructorSyncAndAsync(adapted);
    const resAsync = await ctor.pojo().async();
    expect(resAsync).toMatchObject({ value: orig });
    const resSync = ctor.pojo().sync();
    expect(resSync).toMatchObject({ value: orig });
  });
});

describe('PojoConstructorAdapters.pojoConstructor', function () {
  test('sync 2 sync', () => {
    const adapter = PojoConstructorAdapters.pojoConstructor({
      src: 'sync',
      dst: 'sync',
    });
    const fieldVal = Math.random();
    const orig = new PojoConstructorSync({
      field: () => ({ value: fieldVal }),
    });
    const adapted = adapter(orig);
    expect(adapted).toBe(orig);
  });

  test('sync 2 async', async () => {
    const adapter = PojoConstructorAdapters.pojoConstructor({
      src: 'sync',
      dst: 'async',
    });
    const fieldVal = Math.random();
    const orig = new PojoConstructorSync({
      field: () => ({ value: fieldVal }),
    });
    const adapted = adapter(orig);
    const res = await adapted.pojo();
    expect(res).toMatchObject({ value: { field: fieldVal } });
  });

  test('sync 2 sync-and-async', async () => {
    const adapter = PojoConstructorAdapters.pojoConstructor({
      src: 'sync',
      dst: 'sync-and-async',
    });
    const fieldVal = Math.random();
    const orig = new PojoConstructorSync({
      field: () => ({ value: fieldVal }),
    });
    const adapted = adapter(orig);
    const resAsync = await adapted.pojo().async();
    expect(resAsync).toMatchObject({ value: { field: fieldVal } });
    const resSync = adapted.pojo().sync();
    expect(resSync).toMatchObject({ value: { field: fieldVal } });
  });

  test('async 2 sync', async () => {
    expect.assertions(1);
    try {
      PojoConstructorAdapters.pojoConstructor({
        src: 'async',
        dst: 'sync',
      });
    } catch (caught) {
      expect(caught).toMatchInlineSnapshot(
        `[Error: Cannot adapt async to sync]`,
      );
    }
  });

  test('async 2 async', async () => {
    const adapter = PojoConstructorAdapters.pojoConstructor({
      src: 'async',
      dst: 'async',
    });
    const fieldVal = Math.random();
    const orig = new PojoConstructorAsync({
      field: () => Promise.resolve({ value: fieldVal }),
    });
    const adapted = adapter(orig);
    expect(adapted).toBe(orig);
  });

  test('async 2 sync-and-async', async () => {
    const adapter = PojoConstructorAdapters.pojoConstructor({
      src: 'async',
      dst: 'sync-and-async',
    });
    const fieldVal = Math.random();
    const orig = new PojoConstructorAsync({
      field: () => Promise.resolve({ value: fieldVal }),
    });
    const adapted = adapter(orig);
    const resAsync = await adapted.pojo().async();
    expect(resAsync).toMatchObject({ value: { field: fieldVal } });
  });

  test('sync-and-async 2 sync', async () => {
    const adapter = PojoConstructorAdapters.pojoConstructor({
      src: 'sync-and-async',
      dst: 'sync',
    });
    const fieldVal = Math.random();
    const orig = new PojoConstructorSyncAndAsync({
      field: () => ({ sync: () => ({ value: fieldVal }) }),
    });
    const adapted = adapter(orig);
    const res = adapted.pojo();
    expect(res).toMatchObject({ value: { field: fieldVal } });
  });

  test('sync-and-async (sync) 2 async', async () => {
    const adapter = PojoConstructorAdapters.pojoConstructor({
      src: 'sync-and-async',
      dst: 'async',
    });
    const fieldVal = Math.random();
    const orig = new PojoConstructorSyncAndAsync({
      field: () => ({ sync: () => ({ value: fieldVal }) }),
    });
    const adapted = adapter(orig);
    const res = await adapted.pojo();
    expect(res).toMatchObject({ value: { field: fieldVal } });
  });

  test('sync-and-async (async) 2 async', async () => {
    const adapter = PojoConstructorAdapters.pojoConstructor({
      src: 'sync-and-async',
      dst: 'async',
    });
    const fieldVal = Math.random();
    const orig = new PojoConstructorSyncAndAsync({
      field: () => ({ async: () => Promise.resolve({ value: fieldVal }) }),
    });
    const adapted = adapter(orig);
    const res = await adapted.pojo();
    expect(res).toMatchObject({ value: { field: fieldVal } });
  });

  test('sync-and-async (sync) 2 sync-and-async', async () => {
    const adapter = PojoConstructorAdapters.pojoConstructor({
      src: 'sync-and-async',
      dst: 'sync-and-async',
    });
    const fieldVal = Math.random();
    const orig = new PojoConstructorSyncAndAsync({
      field: () => ({ sync: () => ({ value: fieldVal }) }),
    });
    const adapted = adapter(orig);
    expect(adapted).toBe(orig);
    const resSync = adapted.pojo().sync();
    expect(resSync).toMatchObject({ value: { field: fieldVal } });
  });

  test('sync-and-async (async) 2 sync-and-async', async () => {
    const adapter = PojoConstructorAdapters.pojoConstructor({
      src: 'sync-and-async',
      dst: 'sync-and-async',
    });
    const fieldVal = Math.random();
    const orig = new PojoConstructorSyncAndAsync({
      field: () => ({ async: () => Promise.resolve({ value: fieldVal }) }),
    });
    const adapted = adapter(orig);
    expect(adapted).toBe(orig);
    const resAsync = await adapted.pojo().async();
    expect(resAsync).toMatchObject({ value: { field: fieldVal } });
  });

  test('plain-object 2 sync', () => {
    const adapter = PojoConstructorAdapters.pojoConstructor({
      src: 'plain',
      dst: 'sync',
    });
    const fieldVal = Math.random();
    const orig = { field: fieldVal };
    const adapted = adapter(orig);
    const res = adapted.pojo();
    expect(res).toMatchObject({ value: orig });
  });

  test('plain-object 2 async', async () => {
    const adapter = PojoConstructorAdapters.pojoConstructor({
      src: 'plain',
      dst: 'async',
    });
    const fieldVal = Math.random();
    const orig = { field: fieldVal };
    const adapted = adapter(orig);
    const res = await adapted.pojo();
    expect(res).toMatchObject({ value: orig });
  });

  test('plain-object 2 sync-and-async', async () => {
    const adapter = PojoConstructorAdapters.pojoConstructor({
      src: 'plain',
      dst: 'sync-and-async',
    });
    const fieldVal = Math.random();
    const orig = { field: fieldVal };
    const adapted = adapter(orig);
    const resAsync = await adapted.pojo().async();
    expect(resAsync).toMatchObject({ value: orig });
    const resSync = adapted.pojo().sync();
    expect(resSync).toMatchObject({ value: orig });
  });
});
