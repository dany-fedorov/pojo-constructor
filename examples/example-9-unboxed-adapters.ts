import { PojoConstructorAdapters, PojoConstructorSync } from '../src';

type Cfg = {
  b: string;
  a: number;
};

const ctor = PojoConstructorSync.create(
  null,
  PojoConstructorAdapters.props({ src: 'sync-unboxed', dst: 'sync' })<Cfg>({
    b() {
      return '123';
    },
    a(_, { cache }) {
      const bb = cache.b();
      return Number(bb);
    },
  }),
);

console.log(ctor.pojo());
