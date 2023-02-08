import { PojoConstructorAdapters, PojoConstructorSync } from '../src';

type Cfg = {
  b: string;
  a: number;
};

const ctor = PojoConstructorSync.create<Cfg>(null, {
  b: PojoConstructorAdapters.prop({ src: 'sync-unboxed', dst: 'sync' })(
    'b',
    function () {
      return '123';
    },
  ),
  a(_, { cache }) {
    const bb = cache.b().value;
    return { value: Number(bb) };
  },
});

console.log(ctor.pojo());
