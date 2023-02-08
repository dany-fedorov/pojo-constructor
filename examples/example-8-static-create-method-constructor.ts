import { PojoConstructorSyncAndAsync } from '../src';

type Cfg = {
  a: number;
};

PojoConstructorSyncAndAsync.create<Cfg>(null, {
  a() {
    return {
      sync: () => {
        return { value: 123 };
      },
    };
  },
});
