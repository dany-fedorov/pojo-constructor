import type {
  PojoConstructorPropsSync,
  PojoConstructorProxySync,
} from './PojoConstructorPropsSync';

export class PojoConstructorHelpersHostSync<
  Pojo extends object,
  CtorInput = unknown,
> {
  constructor(
    public readonly target: PojoConstructorPropsSync<Pojo, CtorInput>,
    public readonly key: string,
    public readonly cache: PojoConstructorProxySync<Pojo, CtorInput>,
    public readonly proxy: PojoConstructorProxySync<Pojo, CtorInput>,
  ) {}
}
