import type {
  PojoConstructorSyncProps,
  PojoConstructorSyncProxy,
  PojoConstructorSyncUnboxedProps,
  PojoConstructorSyncUnboxedProxy,
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

export class PojoConstructorSyncUnboxedHelpersHost<
  Pojo extends object,
  CtorInput = unknown,
> {
  constructor(
    public readonly target: PojoConstructorSyncUnboxedProps<Pojo, CtorInput>,
    public readonly key: Extract<keyof Pojo, string>,
    public readonly cache: PojoConstructorSyncUnboxedProxy<Pojo, CtorInput>,
    public readonly proxy: PojoConstructorSyncUnboxedProxy<Pojo, CtorInput>,
  ) {}
}
