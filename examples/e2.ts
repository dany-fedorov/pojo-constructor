import { PojoConstructorSync } from '../src/PojoConstructorSync/PojoConstructorSync';

const ctor = new PojoConstructorSync<{ a: 123 }>({
  a() {
    return { value: 123 };
  },
});

console.log(ctor.new());
