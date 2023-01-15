import type {
  PojoConstructorPropsAsync,
  PojoConstructorProxyAsync,
} from './PojoConstructorPropsAsync';

export class PojoConstructorHelpersHostAsync<
  Pojo extends object,
  CtorInput = unknown,
> {
  constructor(
    public readonly target: PojoConstructorPropsAsync<Pojo, CtorInput>,
    public readonly key: Extract<keyof Pojo, string>,
    public readonly cache: PojoConstructorProxyAsync<Pojo, CtorInput>,
    public readonly proxy: PojoConstructorProxyAsync<Pojo, CtorInput>,
  ) {}
}
