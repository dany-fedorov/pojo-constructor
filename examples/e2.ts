import { PojoConstructorSync } from '../src/PojoConstructorSync/PojoConstructorSync';

// const o = syncProps2Props({
//   // eslint-disable-next-line @typescript-eslint/ban-ts-comment
//   // @ts-ignore
//   a() {
//     return 1;
//   },
// }) as any;
//
// console.log(o.a());

const ctor = new PojoConstructorSync<{ a: 123 }>({
  a() {
    return { value: 123 };
  },
});

console.log(ctor.new());
