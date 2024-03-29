import axios from 'axios';
import { PojoConstructorAsync } from '../src';

type AppCfg = {
  appName: string;
  listenOnPort: number;
  featureFlags: {
    feature1: boolean;
    feature2: boolean;
  };
};

type Env = 'dev' | 'staging' | 'production';

const appCfgCtor = new PojoConstructorAsync<AppCfg, Env>({
  async appName(env: Env) {
    return { value: `awesome-app-in-${env}` };
  },

  async listenOnPort() {
    return { value: 3003 };
  },

  /**
   * Emulates fetching feature flags from database or a CMS.
   */
  async featureFlags(env: Env) {
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
  },
});

(async () => {
  console.log('- dev:');
  const { value: configDev } = await appCfgCtor.pojo('dev' as Env);
  console.log(configDev);

  console.log();
  console.log('- staging:');
  const { value: configStaging } = await appCfgCtor.pojo('staging' as Env);
  console.log(configStaging);

  console.log();
  console.log('- production:');
  const { value: configProduction } = await appCfgCtor.pojo('production' as Env);
  console.log(configProduction);
})();
