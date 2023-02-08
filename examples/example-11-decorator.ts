import {
  PojoConstructorAdapters,
  PojoConstructorDecorators,
  PojoConstructorSync,
  PojoConstructorSyncProps,
} from '../src';

type Cfg = {
  b: string;
  a: number;
};

const ctor = PojoConstructorSync.create<Cfg>(
  null,
  PojoConstructorDecorators.props<PojoConstructorSyncProps<Cfg>>(
    (target, key) => {
      return function (...rest) {
        const res: any = (target as any)[key](...rest);
        return {
          ...res,
          metadata: {
            ...(res?.metadata ?? {}),
            ts: new Date(),
          },
        };
      };
    },
  )(
    PojoConstructorAdapters.props({ src: 'sync-unboxed', dst: 'sync' })<Cfg>({
      b() {
        return '123';
      },
      a(_, { cache }) {
        const bb = cache.b();
        return Number(bb);
      },
    }),
  ),
);

const pojoHost = ctor.pojo();
console.log({ pojoHost });
console.log({ a: pojoHost.get(['a'] as const) });
