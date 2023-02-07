import { PojoConstructorSync } from '../src';

type Top = {
  a: {
    b: 1;
    c: string;
  };
};

const acon = new PojoConstructorSync<Top['a']>({
  b() {
    return {
      value: 1,
    };
  },

  c() {
    return {
      value: 'hey',
      metadata: 'hoh',
    };
  },
});

const top = new PojoConstructorSync<Top>({
  a() {
    return acon.new();
  },
});

const r = top.new();

const rr = r.get(['a', 'b'] as const);
const rrr = rr.value;
console.log(1,rr, rrr);
const rr2 = r.get(['a', 'd'] as const);
const rrr2 = rr2.value;
console.log(2,rr2, rrr2);

