import type {
  PojoConstructorAsyncProps,
  PojoConstructorAsyncProxy,
} from './PojoConstructorAsyncProps';

export class PojoConstructorAsyncHelpersHost<
  Pojo extends object,
  CtorInput = unknown,
> {
  constructor(
    public readonly target: PojoConstructorAsyncProps<Pojo, CtorInput>,
    public readonly key: Extract<keyof Pojo, string>,
    public readonly cache: PojoConstructorAsyncProxy<Pojo, CtorInput>,
    public readonly proxy: PojoConstructorAsyncProxy<Pojo, CtorInput>,
  ) {}
}
