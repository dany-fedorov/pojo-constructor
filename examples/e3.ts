import { PojoConstructorSync } from '../src/PojoConstructorSync/PojoConstructorSync';
import assert from 'node:assert';

const ctor = new PojoConstructorSync<{ field: number }, number>({
  field: (input) => {
    console.log(input);
    return { value: input + 2 };
  },
});
const obj = ctor.new(2);
assert.strictEqual(obj.field, 4);

console.log(obj);
