import type { PojoConstructorAsyncProxy } from './PojoConstructorAsync/PojoConstructorAsyncProps';
import type { PojoConstructorSyncProxy } from './PojoConstructorSync/PojoConstructorSyncProps';
import type { PojoConstructorSyncAndAsyncProxy } from './PojoConstructorSyncAndAsync/PojoConstructorSyncAndAsyncProps';

type PojoConstructorAdapterType = 'sync' | 'async' | 'sync-and-async';

export class PojoConstructorAdapters {
  static proxy<
    SrcType extends PojoConstructorAdapterType,
    DstType extends PojoConstructorAdapterType,
  >(cfg: {
    src: SrcType;
    dst: DstType;
  }): SrcType extends 'sync'
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
    : never {
    // const { src, dst } = cfg;
    // if (dst === 'sync') {
    //   return <Pojo extends object>(
    //     srcInstance: PojoConstructorSyncProxy<Pojo>,
    //   ): PojoConstructorSyncProxy<Pojo> => {
    //     return srcInstance as PojoConstructorSyncProxy<Pojo>;
    //   };
    // }
    return (<Pojo extends object, CtorInput = unknown>(
      proxyInstance:
        | PojoConstructorAsyncProxy<Pojo, CtorInput>
        | PojoConstructorSyncProxy<Pojo, CtorInput>
        | PojoConstructorSyncAndAsyncProxy<Pojo, CtorInput>,
    ): DstType extends 'sync'
      ? PojoConstructorSyncProxy<Pojo, CtorInput>
      : DstType extends 'async'
      ? PojoConstructorAsyncProxy<Pojo, CtorInput>
      : DstType extends 'sync-and-async'
      ? PojoConstructorSyncAndAsyncProxy<Pojo, CtorInput>
      : never => {
      return proxyInstance as unknown as DstType extends 'sync'
        ? PojoConstructorSyncProxy<Pojo, CtorInput>
        : DstType extends 'async'
        ? PojoConstructorAsyncProxy<Pojo, CtorInput>
        : DstType extends 'sync-and-async'
        ? PojoConstructorSyncAndAsyncProxy<Pojo, CtorInput>
        : never;
    }) as unknown as SrcType extends 'sync'
      ? <Pojo extends object, CtorInput = unknown>(
          proxyInstance: PojoConstructorSyncProxy<Pojo, CtorInput>,
        ) => DstType extends 'sync'
          ? PojoConstructorSyncProxy<Pojo, CtorInput>
          : DstType extends 'async'
          ? PojoConstructorAsyncProxy<Pojo, CtorInput>
          : DstType extends 'sync-and-async'
          ? PojoConstructorSyncAndAsyncProxy<Pojo, CtorInput>
          : never
      : SrcType extends 'async'
      ? <Pojo extends object, CtorInput = unknown>(
          proxyInstance: PojoConstructorAsyncProxy<Pojo, CtorInput>,
        ) => DstType extends 'sync'
          ? PojoConstructorSyncProxy<Pojo, CtorInput>
          : DstType extends 'async'
          ? PojoConstructorAsyncProxy<Pojo, CtorInput>
          : DstType extends 'sync-and-async'
          ? PojoConstructorSyncAndAsyncProxy<Pojo, CtorInput>
          : never
      : SrcType extends 'sync-and-async'
      ? <Pojo extends object, CtorInput = unknown>(
          proxyInstance: PojoConstructorSyncAndAsyncProxy<Pojo, CtorInput>,
        ) => DstType extends 'sync'
          ? PojoConstructorSyncProxy<Pojo, CtorInput>
          : DstType extends 'async'
          ? PojoConstructorAsyncProxy<Pojo, CtorInput>
          : DstType extends 'sync-and-async'
          ? PojoConstructorSyncAndAsyncProxy<Pojo, CtorInput>
          : never
      : never;
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
