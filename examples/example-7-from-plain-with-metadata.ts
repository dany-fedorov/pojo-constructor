import { PojoConstructorAdapters } from '../src';

const adapt = PojoConstructorAdapters.pojoConstructor({
  src: 'plain-object',
  dst: 'sync',
});

const con = adapt(
  {
    a: 1,
    b: 2,
  },
  {
    metadata: {
      a: 'hey',
    },
  },
);

const r = con.new();

console.log(r);
