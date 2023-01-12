import { PojoConstructor } from '../src/PojoConstructor';

const ctor = new PojoConstructor<{ a: 1 }>({
  a() {
    return {
      sync: () => {
        return { value: 1 };
      },
    };
  },
});

console.log(ctor.new().sync!());
