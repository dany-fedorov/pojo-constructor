import { PojoConstructorAdapters } from '../src';

const adapt = PojoConstructorAdapters.pojoConstructor({
  src: 'plain',
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

const r = con.pojo();

console.log(r);
