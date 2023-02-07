import type {
  PojoConstructorPropMetadataType,
  PojoConstructorResult,
  PojoMetadata,
} from './PojoConstructorSyncAndAsyncProps';
import type { Object } from 'ts-toolbelt';

export type PojoHostProp<Pojo extends object, P extends Object.Paths<Pojo>> = {
  value: Object.Path<Pojo, P>;
  metadata?: PojoConstructorPropMetadataType;
};

export class PojoHost<Pojo extends object> {
  value: Pojo;
  metadata?: PojoMetadata<Pojo>;

  constructor(r: PojoConstructorResult<Pojo>) {
    this.value = r.value;
    if ('metadata' in r) {
      this.metadata = r.metadata;
    }
  }

  /**
   * TODO: https://github.com/microsoft/TypeScript/issues/41114#issuecomment-1336501862
   * - https://www.typescriptlang.org/play?#code/C4TwDgpgBA8gRgKygXigbwFBSgQwFzpbZRwGbHEDGBARAIwBMAzDQNxHYC+7X73GGUJCgBxCMAA8AFQA0UANIA+FAqgQAHsAgA7ACYBnKAGsIIAPYAzKFKgB+KADkz2hwFcANu5xx3EaQG15AF1lAm0IADcIACd2QXBoMWAABRxgAAtpOWTlVGS1TR0DKH8gonsbAHpKqABJK3yAS0MIAFswUDlo8Vdo7WsAOiICfI0tPUN-Ru0LGIU5AcXp2eioACUIfWAy7Hsk1IyJJKyFRTkNreVqqABRd30ILohKXoeh7DDImLiLV21KYCNZxQB6SWRQUaFCYg4DRaYAc1KigAFEQzIgCLIiGA0ukCP5FgNkkEZEQIjh3K4IAR9riTjkMABKdCcAS6Z5ebpQSjOLZQdEIAjwBDsHnaPnkynQVD0ZhsASg5ECuT+Gg4GhyGhwDVQGiUGgkqCSqmMuJiiUUqkMFSMJhxRXKkpqnVal36w3GiAMU0YIA
   * - https://www.typescriptlang.org/play?#code/C4TwDgpgBA8gRgKygXigbwFBSgQwFzpbZRwGbHEDGBARAIwBMAzDQNxHYC+7X73GGUJCgBxCMAA8AFQA0UANIA+FAqgQAHsAgA7ACYBnKAGsIIAPYAzKFKgB+KADkz2hwFcANu5xx3EaQG15AF1lAm0IADcIACd2QXBoMWAABRxgAAtpOWTlVGS1TR0DKH8gonsbAHpKqABJK3yAS0MIAFswUDlo8Vdo7WsAOiICfI0tPUN-Ru0LGIU5AcXp2eioACUIfWAy7Hsk1IyJJKyFRTkNreVqqABRd30ILohKXoeh7DDImLiLV21KYCNZxQB6SWRQUaFCZQbo4XTOdwgEHAaLTADmpUUAAoiGZEARZEQwGl0gQAGo4dyNXRpPyw+HaRElRYDZIhGRECKU1wQAj7EknHIYACU6E4AiE0ApVJpWmkBXGxXpCKRW1R2gxIRU5BK8ig02Mpks1iCBDV6IVRUMUkCQTsUHCUVWBNtGHFGF0zy83SglGcWygeIQBHgCHYfu0Aa57h5KnozDYAgjAeJGRU-hoOBochocGzUBolBoZQwoKxQbkqfScmjPOFcWTwCgVYY6cz+dzHaLdpwhkbAjLFebJIYNe5EHrGCAA
   * TODO: Use `const` modifier for type
   */
  get<P extends Object.Paths<Pojo>>(
    path: P,
  ): {
    value: Object.Path<Pojo, P>;
    metadata?: PojoConstructorPropMetadataType;
  } {
    let noV = false;
    let curV = this.value;
    let noM = false;
    let curM = this.metadata;
    for (const k of path) {
      if (curV && typeof curV === 'object' && k in curV) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        curV = curV[k];
      } else {
        noV = true;
      }
      if (curM && typeof curM === 'object' && k in curM) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        curM = curM[k];
      } else {
        noM = true;
      }
    }
    if (noV) {
      throw new Error('[pojo-constructor] [PojoHost#get] No value');
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const r: PojoHostProp<Pojo, P> = { value: curV };
    if (!noM) {
      r.metadata = curM;
    }
    return r;
  }
}
