import type {
  PojoConstructorSyncProps,
  PojoConstructorSyncProxy,
} from './PojoConstructorSyncProps';

export class PojoConstructorSyncHelpersHost<
  Pojo extends object,
  CtorInput = unknown,
> {
  constructor(
    public readonly target: PojoConstructorSyncProps<Pojo, CtorInput>,
    public readonly key: Extract<keyof Pojo, string>,
    public readonly cache: PojoConstructorSyncProxy<Pojo, CtorInput>,
    public readonly proxy: PojoConstructorSyncProxy<Pojo, CtorInput>,
  ) {}
}
