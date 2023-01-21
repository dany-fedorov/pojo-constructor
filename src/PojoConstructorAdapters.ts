import type { PojoConstructorAsyncProxy } from './PojoConstructorAsync/PojoConstructorAsyncProps';
import type { PojoConstructorSyncProxy } from './PojoConstructorSync/PojoConstructorSyncProps';
import type { PojoConstructorSyncAndAsyncProxy } from './PojoConstructorSyncAndAsync/PojoConstructorSyncAndAsyncProps';

type PojoConstructorAdapterSrc =
  | 'sync'
  | 'async'
  | 'sync-and-async'
  | 'plain-object';
type PojoConstructorAdapterDst = 'sync' | 'async' | 'sync-and-async';

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
    ) => DstType extends 'sync'
      ? PojoConstructorSyncProxy<Pojo, CtorInput>
      : DstType extends 'async'
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
            return ((srcInstance: any) => srcInstance) as ProxyAdapterFunction<
              SrcType,
              DstType
            >;
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
      case 'async': {
        switch (dst) {
          case 'sync': {
            return ((srcInstance: any) => srcInstance) as ProxyAdapterFunction<
              SrcType,
              DstType
            >;
          }
          case 'async': {
            return ((srcInstance: any) => srcInstance) as ProxyAdapterFunction<
              SrcType,
              DstType
            >;
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
      case 'sync-and-async': {
        switch (dst) {
          case 'sync': {
            return ((srcInstance: any) => srcInstance) as ProxyAdapterFunction<
              SrcType,
              DstType
            >;
          }
          case 'async': {
            return ((srcInstance: any) => srcInstance) as ProxyAdapterFunction<
              SrcType,
              DstType
            >;
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
            return ((srcInstance: any) => srcInstance) as ProxyAdapterFunction<
              SrcType,
              DstType
            >;
          }
          case 'async': {
            return ((srcInstance: any) => srcInstance) as ProxyAdapterFunction<
              SrcType,
              DstType
            >;
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
    }
  }
}

const r = PojoConstructorAdapters.proxy({
  src: 'sync',
  dst: 'async',
});

// const rr = r<{ f: number }, 'heh'>({ f: () => ({ value: 123 }) });

// rr.f('heh').then(() => {});

// const res = PojoConstructorAdapters.proxyAdapter(
//   {
//     src: 'sync',
//     dst: 'sync-and-async',
//   },
//   {
//     f: () => {
//       return { value: 'hey' };
//     },
//   },
// );

type TT<F2> = { tt: F2 };

function f<F1 extends 'a' | 'b'>(
  heh: F1,
): <F2>(hoh: TT<F2>) => F1 extends 'a' ? [F1, F2] : [F2, F1] {
  return <F2>(x: TT<F2>) =>
    (heh === 'a' ? [heh, x.tt] : [x.tt, heh]) as F1 extends 'a'
      ? [F1, F2]
      : [F2, F1];
}

const fef = f('b')({ tt: 'wer' as const });
