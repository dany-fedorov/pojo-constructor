import type { PojoConstructorAsyncProxy } from './PojoConstructorAsync/PojoConstructorAsyncProps';
import type { PojoConstructorSyncProxy } from './PojoConstructorSync/PojoConstructorSyncProps';
import type { PojoConstructorSyncAndAsyncProxy } from './PojoConstructorSyncAndAsync/PojoConstructorSyncAndAsyncProps';
import {
  decoratePojoConstructorMethods,
  isPropNameProxiable,
} from './PojoConstructorSyncAndAsync/PojoConstructorSyncAndAsyncProxiesHost';

type PojoConstructorAdapterSrc =
  | 'sync'
  | 'async'
  | 'sync-and-async'
  | 'plain-object';
type PojoConstructorAdapterDst = 'sync' | 'async' | 'sync-and-async';

export function decoratePlainObjet<T extends object>(
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
      : DstType extends 'async'
      ? PojoConstructorAsyncProxy<Pojo, CtorInput>
      : DstType extends 'sync-and-async'
      ? PojoConstructorSyncAndAsyncProxy<Pojo, CtorInput>
      : never
  : SrcType extends 'async'
  ? <Pojo extends object, CtorInput = unknown>(
      srcInstance: PojoConstructorAsyncProxy<Pojo, CtorInput>,
    ) => DstType extends 'async'
      ? PojoConstructorAsyncProxy<Pojo, CtorInput>
      : DstType extends 'sync-and-async'
      ? PojoConstructorSyncAndAsyncProxy<Pojo, CtorInput>
      : never
  : SrcType extends 'sync-and-async'
  ? <Pojo extends object, CtorInput = unknown>(
      srcInstance: PojoConstructorSyncAndAsyncProxy<Pojo, CtorInput>,
    ) => DstType extends 'sync'
      ? PojoConstructorSyncProxy<Pojo, CtorInput>
      : DstType extends 'async'
      ? PojoConstructorAsyncProxy<Pojo, CtorInput>
      : DstType extends 'sync-and-async'
      ? PojoConstructorSyncAndAsyncProxy<Pojo, CtorInput>
      : never
  : SrcType extends 'plain-object'
  ? <Pojo extends object>(
      srcInstance: Pojo,
    ) => DstType extends 'sync'
      ? PojoConstructorSyncProxy<Pojo>
      : DstType extends 'async'
      ? PojoConstructorAsyncProxy<Pojo>
      : DstType extends 'sync-and-async'
      ? PojoConstructorSyncAndAsyncProxy<Pojo>
      : never
  : never;

export class PojoConstructorAdapters {
  static proxy<
    SrcType extends PojoConstructorAdapterSrc,
    DstType extends PojoConstructorAdapterDst,
  >(cfg: {
    src: SrcType;
    dst: DstType;
  }): ProxyAdapterFunction<SrcType, DstType> {
    const { src, dst } = cfg;
    switch (src) {
      case 'sync': {
        switch (dst) {
          case 'sync': {
            return ((srcInstance: any) => srcInstance) as ProxyAdapterFunction<
              SrcType,
              DstType
            >;
          }
          case 'async': {
            return (<Pojo extends object, CtorInput = unknown>(
              srcInstance: PojoConstructorSyncProxy<Pojo, CtorInput>,
            ) => {
              return decoratePojoConstructorMethods(
                srcInstance,
                (target, key) => {
                  return function PojoConstructorAdapters_proxy_sync2Async_decoratorFn(
                    input: CtorInput,
                  ) {
                    return Promise.resolve((target as any)[key](input));
                  };
                },
              ) as PojoConstructorAsyncProxy<Pojo, CtorInput>;
            }) as ProxyAdapterFunction<SrcType, DstType>;
          }
          case 'sync-and-async':
          default: {
            return (<Pojo extends object, CtorInput = unknown>(
              srcInstance: PojoConstructorSyncProxy<Pojo, CtorInput>,
            ) => {
              return decoratePojoConstructorMethods(
                srcInstance,
                (target, key) => {
                  return function PojoConstructorAdapters_proxy_sync2SyncAndAsync_decoratorFn(
                    input: CtorInput,
                  ) {
                    function sync() {
                      return { value: (target as any)[key](input) };
                    }

                    function promise() {
                      return Promise.resolve(sync());
                    }

                    return { sync, promise };
                  };
                },
              ) as PojoConstructorSyncAndAsyncProxy<Pojo, CtorInput>;
            }) as ProxyAdapterFunction<SrcType, DstType>;
          }
        }
      }
      case 'async': {
        switch (dst) {
          case 'sync': {
            throw new Error('Cannot adapt async to sync');
          }
          case 'async': {
            return ((srcInstance: any) => srcInstance) as ProxyAdapterFunction<
              SrcType,
              DstType
            >;
          }
          case 'sync-and-async':
          default: {
            return (<Pojo extends object, CtorInput = unknown>(
              srcInstance: PojoConstructorAsyncProxy<Pojo, CtorInput>,
            ) => {
              return decoratePojoConstructorMethods(
                srcInstance,
                (target, key) => {
                  return function PojoConstructorAdapters_proxy_async2SyncAndAsync_decoratorFn(
                    input: CtorInput,
                  ) {
                    function promise() {
                      return Promise.resolve(
                        (target as any)[key](input).promise(),
                      );
                    }

                    return { promise };
                  };
                },
              ) as PojoConstructorSyncAndAsyncProxy<Pojo, CtorInput>;
            }) as ProxyAdapterFunction<SrcType, DstType>;
          }
        }
      }
      case 'sync-and-async': {
        switch (dst) {
          case 'sync': {
            return (<Pojo extends object, CtorInput = unknown>(
              srcInstance: PojoConstructorSyncAndAsyncProxy<Pojo, CtorInput>,
            ) => {
              return decoratePojoConstructorMethods(
                srcInstance,
                (target, key) => {
                  return function PojoConstructorAdapters_proxy_syncAndAsync2Sync_decoratorFn(
                    input: CtorInput,
                  ) {
                    return (target as any)[key](input).sync();
                  };
                },
              ) as PojoConstructorSyncProxy<Pojo, CtorInput>;
            }) as ProxyAdapterFunction<SrcType, DstType>;
          }
          case 'async': {
            return (<Pojo extends object, CtorInput = unknown>(
              srcInstance: PojoConstructorSyncAndAsyncProxy<Pojo, CtorInput>,
            ) => {
              return decoratePojoConstructorMethods(
                srcInstance,
                (target, key) => {
                  return function PojoConstructorAdapters_proxy_syncAndAsync2Async_decoratorFn(
                    input: CtorInput,
                  ) {
                    return (target as any)[key](input).promise();
                  };
                },
              ) as PojoConstructorAsyncProxy<Pojo, CtorInput>;
            }) as ProxyAdapterFunction<SrcType, DstType>;
          }
          case 'sync-and-async':
          default: {
            return ((srcInstance: any) => srcInstance) as ProxyAdapterFunction<
              SrcType,
              DstType
            >;
          }
        }
      }
      case 'plain-object':
      default: {
        switch (dst) {
          case 'sync': {
            return (<Pojo extends object>(srcInstance: any) => {
              return decoratePlainObjet(srcInstance, (target, key) => {
                return function PojoConstructorAdapters_proxy_plainObject2Sync_decoratorFn() {
                  return { value: target[key] };
                };
              }) as PojoConstructorSyncProxy<Pojo>;
            }) as ProxyAdapterFunction<SrcType, DstType>;
          }
          case 'async': {
            return (<Pojo extends object>(srcInstance: any) => {
              return decoratePlainObjet(srcInstance, (target, key) => {
                return function PojoConstructorAdapters_proxy_plainObject2Async_decoratorFn() {
                  return Promise.resolve({ value: target[key] });
                };
              }) as PojoConstructorAsyncProxy<Pojo>;
            }) as ProxyAdapterFunction<SrcType, DstType>;
          }
          case 'sync-and-async':
          default: {
            return (<Pojo extends object>(srcInstance: any) => {
              return decoratePlainObjet(srcInstance, (target, key) => {
                return function PojoConstructorAdapters_proxy_plainObject2SyncAndAsync_decoratorFn() {
                  function sync() {
                    return { value: target[key] };
                  }

                  function promise() {
                    return Promise.resolve(sync());
                  }

                  return { sync, promise };
                };
              }) as PojoConstructorSyncAndAsyncProxy<Pojo>;
            }) as ProxyAdapterFunction<SrcType, DstType>;
          }
        }
      }
    }
  }
}

// const r = PojoConstructorAdapters.proxy({
//   src: 'sync',
//   dst: 'async',
// });
//
// // const rr = r<{ f: number }, 'heh'>({ f: () => ({ value: 123 }) });
//
// // rr.f('heh').then(() => {});
//
// // const res = PojoConstructorAdapters.proxyAdapter(
// //   {
// //     src: 'sync',
// //     dst: 'sync-and-async',
// //   },
// //   {
// //     f: () => {
// //       return { value: 'hey' };
// //     },
// //   },
// // );
//
// type TT<F2> = { tt: F2 };
//
// function f<F1 extends 'a' | 'b'>(
//   heh: F1,
// ): <F2>(hoh: TT<F2>) => F1 extends 'a' ? [F1, F2] : [F2, F1] {
//   return <F2>(x: TT<F2>) =>
//     (heh === 'a' ? [heh, x.tt] : [x.tt, heh]) as F1 extends 'a'
//       ? [F1, F2]
//       : [F2, F1];
// }
//
// const fef = f('b')({ tt: 'wer' as const });
