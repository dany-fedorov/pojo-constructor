import { PojoConstructor } from '../src/PojoConstructor';

const ctor = new PojoConstructor<{ a: string; b: string; c: string }>({
  b() {
    return {
      sync: () => {
        console.log('called');
        throw new Error('b err');
        // return { value: 'b-value' };
      },
    };
  },

  a(input, helpers) {
    return {
      sync: () => {
        return this.b(input, helpers).sync!();
      },
    };
  },

  c(input, helpers) {
    return {
      sync: () => {
        return this.a(input, helpers).sync!();
      },
    };
  },
});

console.log(
  ctor.new(null, {
    catch(caught, opts) {
      console.log('top level caught|caught::', caught);
      console.log('top level caught|opts::', opts);
    },
  }).sync!(),
);
