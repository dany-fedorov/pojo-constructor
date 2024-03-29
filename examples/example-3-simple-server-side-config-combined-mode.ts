import axios from 'axios';
import {
  PojoConstructorSyncAndAsync,
  PojoConstructorOptionsCatchFn,
} from '../src';

type AppCfg = {
  appName: string;
  listenOnPort: number;
  featureFlags: {
    feature1: boolean;
    feature2: boolean;
  };
};

type Env = 'dev' | 'staging' | 'production';

const appCfgCtor = new PojoConstructorSyncAndAsync<AppCfg, Env>({
  appName(env: Env) {
    const sync = () => {
      return { value: `awesome-app-in-${env}` };
    };
    return { sync };
  },

  listenOnPort() {
    const sync = () => {
      return { value: 3003 };
    };
    return { sync };
  },

  featureFlags(env: Env) {
    const async = async () => {
      const GET_0_OR_1 = `https://www.random.org/integers/?num=1&min=0&max=1&col=1&base=2&format=plain&rnd=id.${env}`;
      const feature1Flag = Boolean(
        Number((await axios.get(GET_0_OR_1 + 'feature1')).data),
      );
      const feature2Flag = Boolean(
        Number((await axios.get(GET_0_OR_1 + 'feature2')).data),
      );
      return {
        value: {
          feature1: feature1Flag,
          feature2: feature2Flag,
        },
      };
    };
    return { async };
  },
});

function handler(caught: unknown, { key }: PojoConstructorOptionsCatchFn) {
  console.log(`- - Caught trying to construct ${key}`);
  console.log(caught);
  console.log('---');
}

console.log('- dev (sync mode):');
const configDev = appCfgCtor.pojo('dev' as Env, { catch: handler }).sync();
console.log(configDev);

console.log();
console.log('- staging (sync mode):');
const configStaging = appCfgCtor
  .pojo('staging' as Env, { catch: handler })
  .sync();
console.log(configStaging);

console.log();
console.log('- production (sync mode):');
const configProduction = appCfgCtor
  .pojo('production' as Env, { catch: handler })
  .sync();
console.log(configProduction);

(async () => {
  console.log('- dev (async mode):');
  const { value: configDev } = await appCfgCtor.pojo('dev' as Env).async();
  console.log(configDev);

  console.log();
  console.log('- staging (async mode):');
  const { value: configStaging } = await appCfgCtor
    .pojo('staging' as Env)
    .async();
  console.log(configStaging);

  console.log();
  console.log('- production (async mode):');
  const { value: configProduction } = await appCfgCtor
    .pojo('production' as Env)
    .async();
  console.log(configProduction);
})();
