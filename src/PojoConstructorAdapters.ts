import type {
  PojoConstructorAsyncProps,
  PojoConstructorAsyncProxy,
} from './PojoConstructorAsync/PojoConstructorAsyncProps';
import type {
  PojoConstructorSyncProps,
  PojoConstructorSyncProxy,
} from './PojoConstructorSync/PojoConstructorSyncProps';
import type {
  PojoConstructorSyncAndAsyncProps,
  PojoConstructorSyncAndAsyncProxy,
  PojoMetadata,
} from './PojoConstructorSyncAndAsync/PojoConstructorSyncAndAsyncProps';
import {
  decoratePojoConstructorMethods,
  isPropNameProxiable,
} from './PojoConstructorSyncAndAsync/PojoConstructorSyncAndAsyncProxiesHost';
import { PojoConstructorSyncHelpersHost } from './PojoConstructorSync/PojoConstructorSyncHelpersHost';
import { PojoConstructorAsyncHelpersHost } from './PojoConstructorAsync/PojoConstructorAsyncHelpersHost';
import { PojoConstructorSyncAndAsyncHelpersHost } from './PojoConstructorSyncAndAsync/PojoConstructorSyncAndAsyncHelpersHost';
import { PojoConstructorSync } from './PojoConstructorSync/PojoConstructorSync';
import { PojoConstructorSyncAndAsync } from './PojoConstructorSyncAndAsync/PojoConstructorSyncAndAsync';
import { PojoConstructorAsync } from './PojoConstructorAsync/PojoConstructorAsync';

type PojoConstructorAdapterSrc = PojoConstructorAdapterDst | 'plain-object';
type PojoConstructorAdapterDst = 'sync' | 'async' | 'sync-and-async';

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
  ? <Pojo extends object, CtorInput = unknown>(
      srcInstance: Pojo,
      extra?: { metadata?: PojoMetadata<Pojo> },
    ) => DstType extends 'sync'
      ? PojoConstructorSyncProxy<Pojo, CtorInput>
      : DstType extends 'async'
      ? PojoConstructorAsyncProxy<Pojo, CtorInput>
      : DstType extends 'sync-and-async'
      ? PojoConstructorSyncAndAsyncProxy<Pojo, CtorInput>
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
      : DstType extends 'async'
      ? PojoConstructorAsyncProps<Pojo, CtorInput>
      : DstType extends 'sync-and-async'
      ? PojoConstructorSyncAndAsyncProps<Pojo, CtorInput>
      : never
  : SrcType extends 'async'
  ? <Pojo extends object, CtorInput = unknown>(
      srcInstance: PojoConstructorAsyncProps<Pojo, CtorInput>,
    ) => DstType extends 'async'
      ? PojoConstructorAsyncProps<Pojo, CtorInput>
      : DstType extends 'sync-and-async'
      ? PojoConstructorSyncAndAsyncProps<Pojo, CtorInput>
      : never
  : SrcType extends 'sync-and-async'
  ? <Pojo extends object, CtorInput = unknown>(
      srcInstance: PojoConstructorSyncAndAsyncProps<Pojo, CtorInput>,
    ) => DstType extends 'sync'
      ? PojoConstructorSyncProps<Pojo, CtorInput>
      : DstType extends 'async'
      ? PojoConstructorAsyncProps<Pojo, CtorInput>
      : DstType extends 'sync-and-async'
      ? PojoConstructorSyncAndAsyncProps<Pojo, CtorInput>
      : never
  : SrcType extends 'plain-object'
  ? <Pojo extends object, CtorInput = unknown>(
      srcInstance: Pojo,
      extra?: { metadata?: PojoMetadata<Pojo> },
    ) => DstType extends 'sync'
      ? PojoConstructorSyncProps<Pojo, CtorInput>
      : DstType extends 'async'
      ? PojoConstructorAsyncProps<Pojo, CtorInput>
      : DstType extends 'sync-and-async'
      ? PojoConstructorSyncAndAsyncProps<Pojo, CtorInput>
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
  : SrcType extends 'plain-object'
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
        case 'sync-and-async':
        default: {
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
      }
    }
    case 'async': {
      switch (dst) {
        case 'sync': {
          throw new Error('Cannot adapt async to sync');
        }
        case 'async': {
          return (srcInstance: any) => srcInstance;
        }
        case 'sync-and-async':
        default: {
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
      }
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
        case 'sync-and-async': {
          return ((srcInstance: any) => srcInstance) as ProxyAdapterFunction<
            SrcType,
            DstType
          >;
        }
        default: {
          throw new Error(`unknown dst ${dst}`);
        }
      }
    }
    case 'plain-object':
    default: {
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
        case 'async': {
          return (srcInstance: any) => {
            return decoratePlainObject(srcInstance, (target, key) => {
              return function PojoConstructorAdapters_plainObject2Async_decoratorFn() {
                return Promise.resolve({ value: target[key] });
              };
            });
          };
        }
        case 'sync-and-async':
        default: {
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
      }
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
      : src === 'async'
      ? PojoConstructorAsyncHelpersHost
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
    if (cfg.src === 'sync' && cfg.dst === 'async') {
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
    if (cfg.src === 'plain-object') {
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
          case 'sync-and-async':
          default: {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            return new PojoConstructorSyncAndAsync(adaptedProps);
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
        case 'sync-and-async':
        default: {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          return new PojoConstructorSyncAndAsync(adaptedProps, options);
        }
      }
    }) as PojoConstructorAdapterFunction<SrcType, DstType>;
  }
}
