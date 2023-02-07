import { PojoConstructorSync } from '../src';

type AppCfg = {
  dev_option?: string;
  prod_option: string | undefined;
};

type Env = 'dev' | 'staging' | 'production';

type Input = { env: Env; prodOption?: string };

const appCfgCtor = new PojoConstructorSync<AppCfg, Input>({
  dev_option({ env }) {
    if (env === 'dev') {
      return { value: 'this-option-is-only-set-in-dev' };
    }
    return {};
  },

  prod_option({ prodOption }) {
    return {
      value: prodOption,
    };
  },
});

console.log('- dev:');
const { value: configDev } = appCfgCtor.new({ env: 'dev' as Env });
console.log(configDev);

console.log();
console.log('- staging:');
const { value: configStaging } = appCfgCtor.new({ env: 'staging' as Env });
console.log(configStaging);

console.log();
console.log('- production:');
const { value: configProduction } = appCfgCtor.new({
  env: 'production' as Env,
  prodOption: 'prodOption value',
});
console.log(configProduction);
