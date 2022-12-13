import { configure } from 'safe-stable-stringify';

const stringify = configure({
  circularValue: '[jsonStringifySafe: Circular]',
  deterministic: false,
});

type StringifyAsSafeJsonValueOptions = {
  replacer?: (this: any, key: string, value: any) => any;
  indent?: string | number;
};

// TODO: Use https://github.com/ehmicky/safe-json-value with https://github.com/AlCalzone/esm2cjs (https://github.com/esm2cjs)
export function _pojo_jsonStringifySafe(
  value: unknown,
  options?: StringifyAsSafeJsonValueOptions,
): string {
  return String(stringify(value, options?.replacer, options?.indent));
}

export function plines(p: string, ...lines: string[]): string {
  return lines.map((l) => `${p}: ${l}`).join('\n');
}
