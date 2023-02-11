import {
  PojoConstructorAdapters,
  PojoConstructorDecorators,
  PojoConstructorSyncAndAsync,
  PojoConstructorSyncAndAsyncProps,
} from '../src';

type Cfg = {
  b: string;
  a: number;
};

const ctor = PojoConstructorSyncAndAsync.create<Cfg>(
  null,
  PojoConstructorDecorators.props<PojoConstructorSyncAndAsyncProps<Cfg>>(
    (target, key) => {
      return function (...rest) {
        return PojoConstructorSyncAndAsync.bothFromSync(() => {
          const res: any = (target as any)[key](...rest).sync();
          return {
            ...res,
            metadata: {
              ...(res?.metadata ?? {}),
              ts1: new Date(),
            },
          };
        });
      };
    },
  )(
    PojoConstructorAdapters.props({
      src: 'sync-unboxed',
      dst: 'sync-and-async',
    })<Cfg>({
      b() {
        return '123';
      },
      a(_, host) {
        // console.log(host);
        const bb = host.cache.b();
        return Number(bb);
      },
    }),
  ),
);

const main = async () => {
  const pojoHost = await ctor
    .pojo(null, {
      _experimental_syncAndAsyncPropsDecorators: [
        PojoConstructorDecorators.props<PojoConstructorSyncAndAsyncProps<Cfg>>(
          (target, key) => {
            return function (...rest) {
              return PojoConstructorSyncAndAsync.bothFromSync(() => {
                const res: any = (target as any)[key](...rest).sync();
                return {
                  ...res,
                  metadata: {
                    ...(res?.metadata ?? {}),
                    next_ts: new Date(),
                  },
                };
              });
            };
          },
        ),
      ],
    })
    .async();
  console.log({ pojoHost });
  console.log({ a: pojoHost.get(['a'] as const) });
};

main();
