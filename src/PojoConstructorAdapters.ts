import type {
  PojoConstructorAsyncPropFn,
  PojoConstructorAsyncProps,
  PojoConstructorAsyncProxy,
  PojoConstructorAsyncUnboxedPropFn,
  PojoConstructorAsyncUnboxedProps,
  PojoConstructorAsyncUnboxedProxy,
} from './PojoConstructorAsync/PojoConstructorAsyncProps';
import type {
  PojoConstructorSyncPropFn,
  PojoConstructorSyncProps,
  PojoConstructorSyncProxy,
  PojoConstructorSyncUnboxedPropFn,
  PojoConstructorSyncUnboxedProps,
  PojoConstructorSyncUnboxedProxy,
} from './PojoConstructorSync/PojoConstructorSyncProps';
import type {
  PojoConstructorSyncAndAsyncPropFn,
  PojoConstructorSyncAndAsyncProps,
  PojoConstructorSyncAndAsyncProxy,
  PojoConstructorSyncAndAsyncUnboxedPropFn,
  PojoConstructorSyncAndAsyncUnboxedProps,
  PojoConstructorSyncAndAsyncUnboxedProxy,
  PojoMetadata,
} from './PojoConstructorSyncAndAsync/PojoConstructorSyncAndAsyncProps';
import {
  decoratePojoConstructorMethods,
  isPropNameProxiable,
} from './PojoConstructorSyncAndAsync/PojoConstructorSyncAndAsyncProxiesHost';
import {
  PojoConstructorSyncHelpersHost,
  PojoConstructorSyncUnboxedHelpersHost,
} from './PojoConstructorSync/PojoConstructorSyncHelpersHost';
import {
  PojoConstructorAsyncHelpersHost,
  PojoConstructorAsyncUnboxedHelpersHost,
} from './PojoConstructorAsync/PojoConstructorAsyncHelpersHost';
import { PojoConstructorSyncAndAsyncHelpersHost } from './PojoConstructorSyncAndAsync/PojoConstructorSyncAndAsyncHelpersHost';
import { PojoConstructorSync } from './PojoConstructorSync/PojoConstructorSync';
import { PojoConstructorSyncAndAsync } from './PojoConstructorSyncAndAsync/PojoConstructorSyncAndAsync';
import { PojoConstructorAsync } from './PojoConstructorAsync/PojoConstructorAsync';

type PojoConstructorAdapterSrc = PojoConstructorAdapterDst | 'plain';
type PojoConstructorAdapterDst =
  | 'sync'
  | 'sync-unboxed'
  | 'async'
  | 'async-unboxed'
  | 'sync-and-async'
  | 'sync-and-async-unboxed';

export function decoratePlainObject<T extends object>(
  obj: T,
  makeDecorator: (
    target: T,
    key: Extract<keyof T, string>,
  ) => (...args: any[]) => unknown,
): unknown {
  const proxy = new Proxy(obj, {
    get(target: T, propName: string | symbol): unknown {
      if (!isPropNameProxiable(propName)) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return target[propName];
      }
      return makeDecorator(target, propName as Extract<keyof T, string>);
    },
  });
  return proxy;
}

type ProxyAdapterFunction<
  SrcType extends PojoConstructorAdapterSrc,
  DstType extends PojoConstructorAdapterDst,
> = SrcType extends 'sync'
  ? <Pojo extends object, CtorInput = unknown>(
      srcInstance: PojoConstructorSyncProxy<Pojo, CtorInput>,
    ) => DstType extends 'sync'
      ? PojoConstructorSyncProxy<Pojo, CtorInput>
      : DstType extends 'sync-unboxed'
      ? PojoConstructorSyncUnboxedProxy<Pojo, CtorInput>
      : DstType extends 'async'
      ? PojoConstructorAsyncProxy<Pojo, CtorInput>
      : DstType extends 'async-unboxed'
      ? PojoConstructorAsyncUnboxedProxy<Pojo, CtorInput>
      : DstType extends 'sync-and-async'
      ? PojoConstructorSyncAndAsyncProxy<Pojo, CtorInput>
      : DstType extends 'sync-and-async-unboxed'
      ? PojoConstructorSyncAndAsyncUnboxedProxy<Pojo, CtorInput>
      : never
  : SrcType extends 'async'
  ? <Pojo extends object, CtorInput = unknown>(
      srcInstance: PojoConstructorAsyncProxy<Pojo, CtorInput>,
    ) => DstType extends 'async'
      ? PojoConstructorAsyncProxy<Pojo, CtorInput>
      : DstType extends 'async-unboxed'
      ? PojoConstructorAsyncUnboxedProxy<Pojo, CtorInput>
      : DstType extends 'sync-and-async'
      ? PojoConstructorSyncAndAsyncProxy<Pojo, CtorInput>
      : DstType extends 'sync-and-async-unboxed'
      ? PojoConstructorSyncAndAsyncUnboxedProxy<Pojo, CtorInput>
      : never
  : SrcType extends 'sync-and-async'
  ? <Pojo extends object, CtorInput = unknown>(
      srcInstance: PojoConstructorSyncAndAsyncProxy<Pojo, CtorInput>,
    ) => DstType extends 'sync'
      ? PojoConstructorSyncProxy<Pojo, CtorInput>
      : DstType extends 'sync-unboxed'
      ? PojoConstructorSyncUnboxedProxy<Pojo, CtorInput>
      : DstType extends 'async'
      ? PojoConstructorAsyncProxy<Pojo, CtorInput>
      : DstType extends 'async-unboxed'
      ? PojoConstructorAsyncUnboxedProxy<Pojo, CtorInput>
      : DstType extends 'sync-and-async'
      ? PojoConstructorSyncAndAsyncProxy<Pojo, CtorInput>
      : DstType extends 'sync-and-async-unboxed'
      ? PojoConstructorSyncAndAsyncUnboxedProxy<Pojo, CtorInput>
      : never
  : SrcType extends 'plain'
  ? <Pojo extends object, CtorInput = unknown>(
      srcInstance: Pojo,
      extra?: { metadata?: PojoMetadata<Pojo> },
    ) => DstType extends 'sync'
      ? PojoConstructorSyncProxy<Pojo, CtorInput>
      : DstType extends 'sync-unboxed'
      ? PojoConstructorSyncUnboxedProxy<Pojo, CtorInput>
      : DstType extends 'async'
      ? PojoConstructorAsyncProxy<Pojo, CtorInput>
      : DstType extends 'async-unboxed'
      ? PojoConstructorAsyncUnboxedProxy<Pojo, CtorInput>
      : DstType extends 'sync-and-async'
      ? PojoConstructorSyncAndAsyncProxy<Pojo, CtorInput>
      : DstType extends 'sync-and-async-unboxed'
      ? PojoConstructorSyncAndAsyncUnboxedProxy<Pojo, CtorInput>
      : never
  : never;

type PropAdapterFunction<
  SrcType extends PojoConstructorAdapterSrc,
  DstType extends PojoConstructorAdapterDst,
> = SrcType extends 'sync'
  ? <Pojo extends object, Key extends keyof Pojo, CtorInput = unknown>(
      key: Key,
      srcFn: PojoConstructorSyncPropFn<Pojo, Pojo[Key], CtorInput>,
    ) => DstType extends 'sync'
      ? PojoConstructorSyncPropFn<Pojo, Pojo[Key], CtorInput>
      : DstType extends 'sync-unboxed'
      ? PojoConstructorSyncUnboxedPropFn<Pojo, Pojo[Key], CtorInput>
      : DstType extends 'async'
      ? PojoConstructorAsyncPropFn<Pojo, Pojo[Key], CtorInput>
      : DstType extends 'async-unboxed'
      ? PojoConstructorAsyncUnboxedPropFn<Pojo, Pojo[Key], CtorInput>
      : DstType extends 'sync-and-async'
      ? PojoConstructorSyncAndAsyncPropFn<Pojo, Pojo[Key], CtorInput>
      : DstType extends 'sync-and-async-unboxed'
      ? PojoConstructorSyncAndAsyncUnboxedPropFn<Pojo, Pojo[Key], CtorInput>
      : never
  : SrcType extends 'sync-unboxed'
  ? <Pojo extends object, Key extends keyof Pojo, CtorInput = unknown>(
      key: Key,
      srcFn: PojoConstructorSyncUnboxedPropFn<Pojo, Pojo[Key], CtorInput>,
    ) => DstType extends 'sync'
      ? PojoConstructorSyncPropFn<Pojo, Pojo[Key], CtorInput>
      : DstType extends 'sync-unboxed'
      ? PojoConstructorSyncUnboxedPropFn<Pojo, Pojo[Key], CtorInput>
      : DstType extends 'async'
      ? PojoConstructorAsyncPropFn<Pojo, Pojo[Key], CtorInput>
      : DstType extends 'async-unboxed'
      ? PojoConstructorAsyncUnboxedPropFn<Pojo, Pojo[Key], CtorInput>
      : DstType extends 'sync-and-async'
      ? PojoConstructorSyncAndAsyncPropFn<Pojo, Pojo[Key], CtorInput>
      : DstType extends 'sync-and-async-unboxed'
      ? PojoConstructorSyncAndAsyncUnboxedPropFn<Pojo, Pojo[Key], CtorInput>
      : never
  : SrcType extends 'async'
  ? <Pojo extends object, CtorInput = unknown>(
      srcFn: PojoConstructorAsyncPropFn<Pojo, Pojo[keyof Pojo], CtorInput>,
    ) => DstType extends 'async'
      ? PojoConstructorAsyncPropFn<Pojo, Pojo[keyof Pojo], CtorInput>
      : DstType extends 'async-unboxed'
      ? PojoConstructorAsyncUnboxedPropFn<Pojo, Pojo[keyof Pojo], CtorInput>
      : DstType extends 'sync-and-async'
      ? PojoConstructorSyncAndAsyncPropFn<Pojo, Pojo[keyof Pojo], CtorInput>
      : DstType extends 'sync-and-async-unboxed'
      ? PojoConstructorSyncAndAsyncUnboxedPropFn<
          Pojo,
          Pojo[keyof Pojo],
          CtorInput
        >
      : never
  : SrcType extends 'sync-and-async'
  ? <Pojo extends object, CtorInput = unknown>(
      srcFn: PojoConstructorSyncAndAsyncPropFn<
        Pojo,
        Pojo[keyof Pojo],
        CtorInput
      >,
    ) => DstType extends 'sync'
      ? PojoConstructorSyncPropFn<Pojo, Pojo[keyof Pojo], CtorInput>
      : DstType extends 'sync-unboxed'
      ? PojoConstructorSyncUnboxedPropFn<Pojo, Pojo[keyof Pojo], CtorInput>
      : DstType extends 'async'
      ? PojoConstructorAsyncPropFn<Pojo, Pojo[keyof Pojo], CtorInput>
      : DstType extends 'async-unboxed'
      ? PojoConstructorAsyncUnboxedPropFn<Pojo, Pojo[keyof Pojo], CtorInput>
      : DstType extends 'sync-and-async'
      ? PojoConstructorSyncAndAsyncPropFn<Pojo, Pojo[keyof Pojo], CtorInput>
      : DstType extends 'sync-and-async-unboxed'
      ? PojoConstructorSyncAndAsyncUnboxedPropFn<
          Pojo,
          Pojo[keyof Pojo],
          CtorInput
        >
      : never
  : SrcType extends 'plain'
  ? <Pojo extends object, CtorInput = unknown>(
      src: Pojo[keyof Pojo],
      extra?: { metadata?: unknown },
    ) => DstType extends 'sync'
      ? PojoConstructorSyncPropFn<Pojo, Pojo[keyof Pojo], CtorInput>
      : DstType extends 'sync-unboxed'
      ? PojoConstructorSyncUnboxedPropFn<Pojo, Pojo[keyof Pojo], CtorInput>
      : DstType extends 'async'
      ? PojoConstructorAsyncPropFn<Pojo, Pojo[keyof Pojo], CtorInput>
      : DstType extends 'async-unboxed'
      ? PojoConstructorAsyncUnboxedPropFn<Pojo, Pojo[keyof Pojo], CtorInput>
      : DstType extends 'sync-and-async'
      ? PojoConstructorSyncAndAsyncPropFn<Pojo, Pojo[keyof Pojo], CtorInput>
      : DstType extends 'sync-and-async-unboxed'
      ? PojoConstructorSyncAndAsyncUnboxedPropFn<
          Pojo,
          Pojo[keyof Pojo],
          CtorInput
        >
      : never
  : never;

type PropsAdapterFunction<
  SrcType extends PojoConstructorAdapterSrc,
  DstType extends PojoConstructorAdapterDst,
> = SrcType extends 'sync'
  ? <Pojo extends object, CtorInput = unknown>(
      srcInstance: PojoConstructorSyncProps<Pojo, CtorInput>,
    ) => DstType extends 'sync'
      ? PojoConstructorSyncProps<Pojo, CtorInput>
      : DstType extends 'sync-unboxed'
      ? PojoConstructorSyncProps<Pojo, CtorInput>
      : DstType extends 'async'
      ? PojoConstructorAsyncProps<Pojo, CtorInput>
      : DstType extends 'async-unboxed'
      ? PojoConstructorAsyncUnboxedProps<Pojo, CtorInput>
      : DstType extends 'sync-and-async'
      ? PojoConstructorSyncAndAsyncProps<Pojo, CtorInput>
      : DstType extends 'sync-and-async-unboxed'
      ? PojoConstructorSyncAndAsyncUnboxedProps<Pojo, CtorInput>
      : never
  : SrcType extends 'sync-unboxed'
  ? <Pojo extends object, CtorInput = unknown>(
      srcInstance: PojoConstructorSyncUnboxedProps<Pojo, CtorInput>,
    ) => DstType extends 'sync'
      ? PojoConstructorSyncProps<Pojo, CtorInput>
      : DstType extends 'sync-unboxed'
      ? PojoConstructorSyncProps<Pojo, CtorInput>
      : DstType extends 'async'
      ? PojoConstructorAsyncProps<Pojo, CtorInput>
      : DstType extends 'async-unboxed'
      ? PojoConstructorAsyncUnboxedProps<Pojo, CtorInput>
      : DstType extends 'sync-and-async'
      ? PojoConstructorSyncAndAsyncProps<Pojo, CtorInput>
      : DstType extends 'sync-and-async-unboxed'
      ? PojoConstructorSyncAndAsyncUnboxedProps<Pojo, CtorInput>
      : never
  : SrcType extends 'async'
  ? <Pojo extends object, CtorInput = unknown>(
      srcInstance: PojoConstructorAsyncProps<Pojo, CtorInput>,
    ) => DstType extends 'async'
      ? PojoConstructorAsyncProps<Pojo, CtorInput>
      : DstType extends 'async-unboxed'
      ? PojoConstructorAsyncUnboxedProps<Pojo, CtorInput>
      : DstType extends 'sync-and-async'
      ? PojoConstructorSyncAndAsyncProps<Pojo, CtorInput>
      : DstType extends 'sync-and-async-unboxed'
      ? PojoConstructorSyncAndAsyncUnboxedProps<Pojo, CtorInput>
      : never
  : SrcType extends 'sync-and-async'
  ? <Pojo extends object, CtorInput = unknown>(
      srcInstance: PojoConstructorSyncAndAsyncProps<Pojo, CtorInput>,
    ) => DstType extends 'sync'
      ? PojoConstructorSyncProps<Pojo, CtorInput>
      : DstType extends 'sync-unboxed'
      ? PojoConstructorSyncProps<Pojo, CtorInput>
      : DstType extends 'async'
      ? PojoConstructorAsyncProps<Pojo, CtorInput>
      : DstType extends 'async-unboxed'
      ? PojoConstructorAsyncUnboxedProps<Pojo, CtorInput>
      : DstType extends 'sync-and-async'
      ? PojoConstructorSyncAndAsyncProps<Pojo, CtorInput>
      : DstType extends 'sync-and-async-unboxed'
      ? PojoConstructorSyncAndAsyncUnboxedProps<Pojo, CtorInput>
      : never
  : SrcType extends 'plain'
  ? <Pojo extends object, CtorInput = unknown>(
      srcInstance: Pojo,
      extra?: { metadata?: PojoMetadata<Pojo> },
    ) => DstType extends 'sync'
      ? PojoConstructorSyncProps<Pojo, CtorInput>
      : DstType extends 'sync-unboxed'
      ? PojoConstructorSyncProps<Pojo, CtorInput>
      : DstType extends 'async'
      ? PojoConstructorAsyncProps<Pojo, CtorInput>
      : DstType extends 'async-unboxed'
      ? PojoConstructorAsyncUnboxedProps<Pojo, CtorInput>
      : DstType extends 'sync-and-async'
      ? PojoConstructorSyncAndAsyncProps<Pojo, CtorInput>
      : DstType extends 'sync-and-async-unboxed'
      ? PojoConstructorSyncAndAsyncUnboxedProps<Pojo, CtorInput>
      : never
  : never;

type PojoConstructorAdapterFunction<
  SrcType extends PojoConstructorAdapterSrc,
  DstType extends PojoConstructorAdapterDst,
> = SrcType extends 'sync'
  ? <Pojo extends object, CtorInput = unknown>(
      srcInstance: PojoConstructorSync<Pojo, CtorInput>,
    ) => DstType extends 'sync'
      ? PojoConstructorSync<Pojo, CtorInput>
      : DstType extends 'async'
      ? PojoConstructorAsync<Pojo, CtorInput>
      : DstType extends 'sync-and-async'
      ? PojoConstructorSyncAndAsync<Pojo, CtorInput>
      : never
  : SrcType extends 'async'
  ? <Pojo extends object, CtorInput = unknown>(
      srcInstance: PojoConstructorAsync<Pojo, CtorInput>,
    ) => DstType extends 'async'
      ? PojoConstructorAsync<Pojo, CtorInput>
      : DstType extends 'sync-and-async'
      ? PojoConstructorSyncAndAsync<Pojo, CtorInput>
      : never
  : SrcType extends 'sync-and-async'
  ? <Pojo extends object, CtorInput = unknown>(
      srcInstance: PojoConstructorSyncAndAsync<Pojo, CtorInput>,
    ) => DstType extends 'sync'
      ? PojoConstructorSync<Pojo, CtorInput>
      : DstType extends 'async'
      ? PojoConstructorAsync<Pojo, CtorInput>
      : DstType extends 'sync-and-async'
      ? PojoConstructorSyncAndAsync<Pojo, CtorInput>
      : never
  : SrcType extends 'plain'
  ? <Pojo extends object, CtorInput = unknown>(
      srcInstance: Pojo,
      extra?: { metadata?: PojoMetadata<Pojo> },
    ) => DstType extends 'sync'
      ? PojoConstructorSync<Pojo, CtorInput>
      : DstType extends 'async'
      ? PojoConstructorAsync<Pojo, CtorInput>
      : DstType extends 'sync-and-async'
      ? PojoConstructorSyncAndAsync<Pojo, CtorInput>
      : never
  : never;

function pojoConstructorAdapt<
  SrcType extends PojoConstructorAdapterSrc,
  DstType extends PojoConstructorAdapterDst,
>(
  src: SrcType,
  dst: DstType,
  argumentsDecorator: (
    src: SrcType,
    dst: DstType,
    srcInstance: any,
    args: any[],
  ) => any[],
): (srcInstance: any, extra?: any) => any {
  switch (src) {
    case 'sync': {
      switch (dst) {
        case 'sync': {
          return (srcInstance: any) => srcInstance;
        }
        case 'sync-unboxed': {
          return (srcInstance: any) => {
            return decoratePojoConstructorMethods(
              srcInstance,
              (target, key) => {
                return function PojoConstructorAdapters_sync2SyncUnboxed_decoratorFn(
                  ...rest
                ) {
                  const res = (target as any)[key](
                    ...argumentsDecorator(src, dst, srcInstance, rest),
                  );
                  if (!res || typeof res !== 'object' || !('value' in res)) {
                    return undefined;
                  }
                  return res.value;
                };
              },
            );
          };
        }
        case 'async': {
          return (srcInstance: any) => {
            return decoratePojoConstructorMethods(
              srcInstance,
              (target, key) => {
                return function PojoConstructorAdapters_sync2Async_decoratorFn(
                  ...rest
                ) {
                  return Promise.resolve(
                    (target as any)[key](
                      ...argumentsDecorator(src, dst, srcInstance, rest),
                    ),
                  );
                };
              },
            );
          };
        }
        case 'async-unboxed': {
          return (srcInstance: any) => {
            return decoratePojoConstructorMethods(
              srcInstance,
              (target, key) => {
                return function PojoConstructorAdapters_sync2AsyncUnboxed_decoratorFn(
                  ...rest
                ) {
                  const res = (target as any)[key](
                    ...argumentsDecorator(src, dst, srcInstance, rest),
                  );
                  if (!res || typeof res !== 'object' || !('value' in res)) {
                    return Promise.resolve(undefined);
                  }
                  return Promise.resolve(res.value);
                };
              },
            );
          };
        }
        case 'sync-and-async': {
          return (srcInstance: any) => {
            return decoratePojoConstructorMethods(
              srcInstance,
              (target, key) => {
                return function PojoConstructorAdapters_sync2SyncAndAsync_decoratorFn(
                  ...rest
                ) {
                  function sync() {
                    return (target as any)[key](
                      ...argumentsDecorator(src, dst, srcInstance, rest),
                    );
                  }

                  function async() {
                    return Promise.resolve(sync());
                  }

                  return { sync, async };
                };
              },
            );
          };
        }
        case 'sync-and-async-unboxed': {
          return (srcInstance: any) => {
            return decoratePojoConstructorMethods(
              srcInstance,
              (target, key) => {
                return function PojoConstructorAdapters_sync2SyncAndAsyncUnbox_decoratorFn(
                  ...rest
                ) {
                  function sync() {
                    const res = (target as any)[key](
                      ...argumentsDecorator(src, dst, srcInstance, rest),
                    );
                    if (!res || typeof res !== 'object' || !('value' in res)) {
                      return undefined;
                    }
                    return res.value;
                  }

                  function async() {
                    return Promise.resolve(sync());
                  }

                  return { sync, async };
                };
              },
            );
          };
        }
        default: {
          throw new Error(`Unknown dst - ${dst}`);
        }
      }
    }
    case 'sync-unboxed': {
      const adaptSyncSrc = pojoConstructorAdapt(
        'sync' as SrcType,
        dst,
        argumentsDecorator,
      );
      return (srcInstance: any) => {
        const syncSrc = decoratePojoConstructorMethods(
          srcInstance,
          (target, key) => {
            return function PojoConstructorAdapters_syncUnboxed2Sync_decoratorFn(
              ...rest
            ) {
              const value = (target as any)[key](
                ...argumentsDecorator(
                  src,
                  'sync' as DstType,
                  srcInstance,
                  rest,
                ),
              );
              if (value === undefined) {
                return {};
              }
              return { value };
            };
          },
        );
        return adaptSyncSrc(syncSrc);
      };
    }
    case 'async': {
      switch (dst) {
        case 'sync': {
          throw new Error('Cannot adapt async to sync');
        }
        case 'sync-unboxed': {
          throw new Error('Cannot adapt async to sync-unboxed');
        }
        case 'async': {
          return (srcInstance: any) => srcInstance;
        }
        case 'async-unboxed': {
          return (srcInstance: any) => {
            return decoratePojoConstructorMethods(
              srcInstance,
              (target, key) => {
                return async function PojoConstructorAdapters_async2AsyncUnboxed_decoratorFn(
                  ...rest
                ) {
                  const res = await (target as any)[key](
                    ...argumentsDecorator(src, dst, srcInstance, rest),
                  );
                  if (!res || typeof res !== 'object' || !('value' in res)) {
                    return undefined;
                  }
                  return res.value;
                };
              },
            );
          };
        }
        case 'sync-and-async': {
          return (srcInstance: any) => {
            return decoratePojoConstructorMethods(
              srcInstance,
              (target, key) => {
                return function PojoConstructorAdapters_async2SyncAndAsync_decoratorFn(
                  ...rest
                ) {
                  function async() {
                    return Promise.resolve(
                      (target as any)[key](
                        ...argumentsDecorator(src, dst, srcInstance, rest),
                      ),
                    );
                  }

                  return { async };
                };
              },
            );
          };
        }
        case 'sync-and-async-unboxed': {
          return (srcInstance: any) => {
            return decoratePojoConstructorMethods(
              srcInstance,
              (target, key) => {
                return function PojoConstructorAdapters_async2SyncAndAsyncUnboxed_decoratorFn(
                  ...rest
                ) {
                  async function async() {
                    const res = await (target as any)[key](
                      ...argumentsDecorator(src, dst, srcInstance, rest),
                    );
                    if (!res || typeof res !== 'object' || !('value' in res)) {
                      return Promise.resolve(undefined);
                    }
                    return Promise.resolve(res.value);
                  }

                  return { async };
                };
              },
            );
          };
        }
        default: {
          throw new Error(`Unknown dst - ${dst}`);
        }
      }
    }
    case 'async-unboxed': {
      const adaptAsyncSrc = pojoConstructorAdapt(
        'async' as SrcType,
        dst,
        argumentsDecorator,
      );
      return (srcInstance: any) => {
        const asyncSrc = decoratePojoConstructorMethods(
          srcInstance,
          (target, key) => {
            return async function PojoConstructorAdapters_asyncUnboxed2Async_decoratorFn(
              ...rest
            ) {
              const value = await (target as any)[key](
                ...argumentsDecorator(
                  src,
                  'async' as DstType,
                  srcInstance,
                  rest,
                ),
              );
              if (value === undefined) {
                return {};
              }
              return { value };
            };
          },
        );
        return adaptAsyncSrc(asyncSrc);
      };
    }
    case 'sync-and-async': {
      switch (dst) {
        case 'sync': {
          return (srcInstance: any) => {
            return decoratePojoConstructorMethods(
              srcInstance,
              (target, key) => {
                return function PojoConstructorAdapters_syncAndAsync2Sync_decoratorFn(
                  ...rest
                ) {
                  return (target as any)
                    [key](...argumentsDecorator(src, dst, srcInstance, rest))
                    .sync();
                };
              },
            );
          };
        }
        case 'sync-unboxed': {
          return (srcInstance: any) => {
            return decoratePojoConstructorMethods(
              srcInstance,
              (target, key) => {
                return function PojoConstructorAdapters_syncAndAsync2SyncUnboxed_decoratorFn(
                  ...rest
                ) {
                  // console.log('vvval',(target as any)
                  //   [key](...argumentsDecorator(src, dst, srcInstance, rest)));
                  const res = (target as any)
                    [key](...argumentsDecorator(src, dst, srcInstance, rest))
                    .sync();
                  if (!res || typeof res !== 'object' || !('value' in res)) {
                    return undefined;
                  }
                  return res.value;
                };
              },
            );
          };
        }
        case 'async': {
          return (srcInstance: any) => {
            return decoratePojoConstructorMethods(
              srcInstance,
              (target, key) => {
                return function PojoConstructorAdapters_syncAndAsync2Async_decoratorFn(
                  ...rest
                ) {
                  const res = (target as any)[key](
                    ...argumentsDecorator(src, dst, srcInstance, rest),
                  );
                  if ('async' in res) {
                    return res.async();
                  } else if ('sync' in res) {
                    return res.sync();
                  } else {
                    throw new Error('Could not get not sync nor async');
                  }
                };
              },
            );
          };
        }
        case 'async-unboxed': {
          return (srcInstance: any) => {
            return decoratePojoConstructorMethods(
              srcInstance,
              (target, key) => {
                return async function PojoConstructorAdapters_syncAndAsync2AsyncUnboxed_decoratorFn(
                  ...rest
                ) {
                  const res = (target as any)[key](
                    ...argumentsDecorator(src, dst, srcInstance, rest),
                  );
                  let res2;
                  if ('async' in res) {
                    res2 = await res.async();
                  } else if ('sync' in res) {
                    res2 = res.sync();
                  } else {
                    throw new Error('Could not get not sync nor async');
                  }
                  if (!res2 || typeof res2 !== 'object' || !('value' in res2)) {
                    return undefined;
                  }
                  return res2.value;
                };
              },
            );
          };
        }
        case 'sync-and-async': {
          return ((srcInstance: any) => srcInstance) as ProxyAdapterFunction<
            SrcType,
            DstType
          >;
        }
        case 'sync-and-async-unboxed': {
          return (srcInstance: any) => {
            return decoratePojoConstructorMethods(
              srcInstance,
              (target, key) => {
                return function PojoConstructorAdapters_syncAndAsync2SyncAndAsyncUnboxed_decoratorFn(
                  ...rest
                ) {
                  const res = (target as any)[key](
                    ...argumentsDecorator(src, dst, srcInstance, rest),
                  );
                  let res2;
                  if ('async' in res) {
                    const async = async function async() {
                      res2 = await res.async();
                      if (
                        !res2 ||
                        typeof res2 !== 'object' ||
                        !('value' in res2)
                      ) {
                        return undefined;
                      }
                      return res2.value;
                    };

                    return { async };
                  } else if ('sync' in res) {
                    res2 = res.sync();

                    const sync = function sync() {
                      res2 = res.sync();
                      if (
                        !res2 ||
                        typeof res2 !== 'object' ||
                        !('value' in res2)
                      ) {
                        return undefined;
                      }
                      return res2.value;
                    };

                    const async = function async() {
                      return Promise.resolve(sync());
                    };

                    return { sync, async };
                  } else {
                    throw new Error('Could not get not sync nor async');
                  }
                };
              },
            );
          };
        }
        default: {
          throw new Error(`unknown dst - ${dst}`);
        }
      }
    }
    case 'sync-and-async-unboxed': {
      const adaptSyncAndAsyncSrc = pojoConstructorAdapt(
        'sync-and-async' as SrcType,
        dst,
        argumentsDecorator,
      );
      return (srcInstance: any) => {
        const syncAndAsyncSrc = decoratePojoConstructorMethods(
          srcInstance,
          (target, key) => {
            return function PojoConstructorAdapters_syncAndAsyncUnboxed2SyncAndAsync_decoratorFn(
              ...rest
            ) {
              const res = (target as any)[key](
                ...argumentsDecorator(src, dst, srcInstance, rest),
              );
              if ('async' in res) {
                const async = async function async() {
                  const value = await res.async();
                  if (value === undefined) {
                    return {};
                  }
                  return { value };
                };

                return { async };
              } else if ('sync' in res) {
                const sync = function sync() {
                  const value = res.sync();
                  if (value === undefined) {
                    return {};
                  }
                  return { value };
                };

                const async = function async() {
                  return Promise.resolve(sync());
                };

                return { sync, async };
              } else {
                throw new Error('Could not get not sync nor async');
              }
            };
          },
        );
        return adaptSyncAndAsyncSrc(syncAndAsyncSrc);
      };
    }
    case 'plain': {
      switch (dst) {
        case 'sync': {
          return (srcInstance: any, extra: any) => {
            return decoratePlainObject(srcInstance, (target, key) => {
              return function PojoConstructorAdapters_plainObject2Sync_decoratorFn() {
                const r = { value: target[key] };
                if (
                  extra &&
                  typeof extra === 'object' &&
                  'metadata' in extra &&
                  extra.metadata &&
                  typeof extra.metadata === 'object' &&
                  key in extra.metadata
                ) {
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-ignore
                  r.metadata = extra.metadata[key];
                }
                return r;
              };
            });
          };
        }
        case 'sync-unboxed': {
          return (srcInstance: any) => {
            const syncSrc = pojoConstructorAdapt(
              'plain',
              'sync',
              (_, __, ___, args) => args,
            )(srcInstance);
            return pojoConstructorAdapt(
              'sync',
              'sync-unboxed',
              (_, __, ___, args) => args,
            )(syncSrc);
          };
        }
        case 'async': {
          return (srcInstance: any) => {
            return decoratePlainObject(srcInstance, (target, key) => {
              return function PojoConstructorAdapters_plainObject2Async_decoratorFn() {
                return Promise.resolve({ value: target[key] });
              };
            });
          };
        }
        case 'async-unboxed': {
          return (srcInstance: any) => {
            const syncSrc = pojoConstructorAdapt(
              'plain',
              'sync',
              (_, __, ___, args) => args,
            )(srcInstance);
            return pojoConstructorAdapt(
              'sync',
              'async-unboxed',
              (_, __, ___, args) => args,
            )(syncSrc);
          };
        }
        case 'sync-and-async': {
          return (srcInstance: any) => {
            return decoratePlainObject(srcInstance, (target, key) => {
              return function PojoConstructorAdapters_plainObject2SyncAndAsync_decoratorFn() {
                function sync() {
                  return { value: target[key] };
                }

                function async() {
                  return Promise.resolve(sync());
                }

                return { sync, async };
              };
            });
          };
        }
        case 'sync-and-async-unboxed': {
          return (srcInstance: any) => {
            const syncSrc = pojoConstructorAdapt(
              'plain',
              'sync',
              (_, __, ___, args) => args,
            )(srcInstance);
            return pojoConstructorAdapt(
              'sync',
              'sync-and-async-unboxed',
              (_, __, ___, args) => args,
            )(syncSrc);
          };
        }
        default: {
          throw new Error(`Unknown dst - ${dst}`);
        }
      }
    }
    default: {
      throw new Error(`Unknown src - ${src}`);
    }
  }
}

function pojoConstructorPropsAdaptProcessArgs<
  SrcType extends PojoConstructorAdapterSrc,
  DstType extends PojoConstructorAdapterDst,
>(src: SrcType, dst: DstType, srcInstance: any, args: any[]) {
  const [input, helpersHost] = args;
  const HelpersHostCtor =
    src === 'sync'
      ? PojoConstructorSyncHelpersHost
      : src === 'sync-unboxed'
      ? PojoConstructorSyncUnboxedHelpersHost
      : src === 'async'
      ? PojoConstructorAsyncHelpersHost
      : src === 'async-unboxed'
      ? PojoConstructorAsyncUnboxedHelpersHost
      : PojoConstructorSyncAndAsyncHelpersHost;
  // const helpersHost = Object.create(null);

  return [
    input,
    new HelpersHostCtor(
      srcInstance,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      (helpersHost as any).key,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      (helpersHost as any).constructorName,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      PojoConstructorAdapters.proxy({ src: dst, dst: src })(
        (helpersHost as any).cache,
      ),
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      PojoConstructorAdapters.proxy({ src: dst, dst: src })(
        (helpersHost as any).proxy,
      ),
    ),
  ];
}

export class PojoConstructorAdapters {
  static proxy<
    SrcType extends PojoConstructorAdapterSrc,
    DstType extends PojoConstructorAdapterDst,
  >(cfg: {
    src: SrcType;
    dst: DstType;
  }): ProxyAdapterFunction<SrcType, DstType> {
    return pojoConstructorAdapt(
      cfg.src,
      cfg.dst,
      (_, __, ___, args) => args,
    ) as ProxyAdapterFunction<SrcType, DstType>;
  }

  static props<
    SrcType extends PojoConstructorAdapterSrc,
    DstType extends PojoConstructorAdapterDst,
  >(cfg: {
    src: SrcType;
    dst: DstType;
  }): PropsAdapterFunction<SrcType, DstType> {
    if (
      (cfg.src === 'sync' || cfg.src === 'sync-unboxed') &&
      (cfg.dst === 'async' || cfg.src === 'async-unboxed')
    ) {
      const syncAndAsyncPropsAdapter = pojoConstructorAdapt(
        cfg.src,
        'sync-and-async',
        pojoConstructorPropsAdaptProcessArgs,
      );
      return ((srcInstance: any) =>
        pojoConstructorAdapt(
          'sync-and-async',
          cfg.dst,
          pojoConstructorPropsAdaptProcessArgs,
        )(syncAndAsyncPropsAdapter(srcInstance))) as PropsAdapterFunction<
        SrcType,
        DstType
      >;
    }
    return pojoConstructorAdapt(
      cfg.src,
      cfg.dst,
      pojoConstructorPropsAdaptProcessArgs,
    ) as PropsAdapterFunction<SrcType, DstType>;
  }

  static pojoConstructor<
    SrcType extends PojoConstructorAdapterSrc,
    DstType extends PojoConstructorAdapterDst,
  >(cfg: {
    src: SrcType;
    dst: DstType;
  }): PojoConstructorAdapterFunction<SrcType, DstType> {
    if ((cfg.src as string) === (cfg.dst as string)) {
      return ((srcInstance: any) =>
        srcInstance) as PojoConstructorAdapterFunction<SrcType, DstType>;
    }
    if (cfg.src === 'async' && cfg.dst === 'sync') {
      throw new Error('Cannot adapt async to sync');
    }
    if (cfg.src === 'plain') {
      const adapt = PojoConstructorAdapters.props<SrcType, DstType>({
        src: cfg.src,
        dst: cfg.dst,
      });
      return ((srcInstance: any, extra?: any) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const adaptedProps = adapt(srcInstance, extra);
        switch (cfg.dst) {
          case 'async': {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            return new PojoConstructorAsync(adaptedProps);
          }
          case 'sync': {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            return new PojoConstructorSync(adaptedProps);
          }
          case 'sync-and-async': {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            return new PojoConstructorSyncAndAsync(adaptedProps);
          }
          default: {
            throw new Error(`Unknown ${cfg.dst}`);
          }
        }
      }) as PojoConstructorAdapterFunction<SrcType, DstType>;
    }
    const adapt = PojoConstructorAdapters.props<SrcType, DstType>({
      src: cfg.src,
      dst: cfg.dst,
    });
    return ((srcInstance: any, extra: any) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const adaptedProps = adapt(srcInstance.props, extra);
      const options = srcInstance.options;
      switch (cfg.dst) {
        case 'async': {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          return new PojoConstructorAsync(adaptedProps, options);
        }
        case 'sync': {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          return new PojoConstructorSync(adaptedProps, options);
        }
        case 'sync-and-async': {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          return new PojoConstructorSyncAndAsync(adaptedProps, options);
        }
        default: {
          throw new Error(`Unknown ${cfg.dst}`);
        }
      }
    }) as PojoConstructorAdapterFunction<SrcType, DstType>;
  }

  static prop<
    SrcType extends PojoConstructorAdapterSrc,
    DstType extends PojoConstructorAdapterDst,
  >(cfg: {
    src: SrcType;
    dst: DstType;
  }): PropAdapterFunction<SrcType, DstType> {
    return function (key: string, srcFn: any) {
      const adaptedPropsObject = PojoConstructorAdapters.props(cfg)({
        [key]: srcFn,
      });
      return adaptedPropsObject[key];
    } as PropAdapterFunction<SrcType, DstType>;
  }
}
