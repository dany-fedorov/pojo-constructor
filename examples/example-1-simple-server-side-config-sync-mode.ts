import { PojoConstructorSync } from '../src';

/**
 * Use TypeScript to make configuration type safe.
 */
type AppCfg = {
  appName: string;
  listenOnPort: number;
  thirdPartyApiEndpoint: string;
};

type Env = 'dev' | 'staging' | 'production';

/**
 * Define configuration properties in methods.
 */
const appCfgCtor = new PojoConstructorSync<AppCfg, Env>({
  appName(env: Env) {
    return { value: `awesome-app-in-${env}` };
  },

  listenOnPort() {
    return { value: 3003 };
  },

  thirdPartyApiEndpoint(env: Env) {
    switch (env) {
      case 'dev':
      case 'staging':
        return { value: 'https://sandbox.thrird-party-api.example.com' };
      case 'production':
        return { value: 'https://api.example.com' };
      default:
        throw new Error('Unknown env');
    }
  },
});

console.log('- dev:');
const { value: configDev } = appCfgCtor.pojo('dev' as Env);
console.log(configDev);

console.log();
console.log('- staging:');
const { value: configStaging } = appCfgCtor.pojo('staging' as Env);
console.log(configStaging);

console.log();
console.log('- production:');
const { value: configProduction } = appCfgCtor.pojo('production' as Env);
console.log(configProduction);
