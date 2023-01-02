import {
  PojoConstructorAsync,
  constructPojoAsync,
} from '../src/PojoConstructorAsync';
import axios from 'axios';

type AppCfg = {
  appName: string;
  listenOnPort: number;
  featureFlags: {
    feature1: boolean;
    feature2: boolean;
  };
};

type Env = 'dev' | 'staging' | 'production';

class AppCfgCtor implements PojoConstructorAsync<AppCfg, Env> {
  async appName(env: Env) {
    return `awesome-app-in-${env}`;
  }

  async listenOnPort() {
    return 3003;
  }

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
      feature1: feature1Flag,
      feature2: feature2Flag,
    };
  }
}

(async () => {
  console.log('--- dev ---');
  const configDev = await constructPojoAsync(AppCfgCtor, 'dev' as Env);
  console.log(JSON.stringify(configDev, null, 2));

  console.log('--- staging ---');
  const configStaging = await constructPojoAsync(AppCfgCtor, 'staging' as Env);
  console.log(JSON.stringify(configStaging, null, 2));

  console.log('--- production ---');
  const configProduction = await constructPojoAsync(
    AppCfgCtor,
    'production' as Env,
  );
  console.log(JSON.stringify(configProduction, null, 2));
})();
